const pool = require("../config/db");
const ApiError = require("../utils/apiError");
const fs = require("fs");
const path = require("path");

async function createAnnouncement(req, res, next) {
  try {
    const { title, content, category, isPinned, priority, publishDate, expiryDate } = req.body;
    const adminId = req.user.id;

    // Validate input
    if (!title || title.trim().length === 0) {
      throw new ApiError(400, "Title is required");
    }

    if (!content || content.trim().length === 0) {
      throw new ApiError(400, "Content is required");
    }

    const validCategories = ['policy_changes', 'new_features', 'events', 'holidays', 'general'];
    if (!category || !validCategories.includes(category)) {
      throw new ApiError(400, "Invalid category");
    }

    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (priority && !validPriorities.includes(priority)) {
      throw new ApiError(400, "Invalid priority");
    }

    const [result] = await pool.query(
      `INSERT INTO announcements (admin_id, title, content, category, is_pinned, priority, publish_date, expiry_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        adminId,
        title.trim(),
        content.trim(),
        category,
        isPinned ? 1 : 0,
        priority || 'medium',
        publishDate || new Date(),
        expiryDate || null
      ]
    );

    // Handle file attachments if any
    if (req.files && req.files.length > 0) {
      const announcementId = result.insertId;
      const attachmentPromises = req.files.map(file => {
        return pool.query(
          `INSERT INTO announcement_attachments (announcement_id, file_name, file_path, file_size, file_type)
           VALUES (?, ?, ?, ?, ?)`,
          [
            announcementId,
            file.originalname,
            file.path,
            file.size,
            file.mimetype
          ]
        );
      });
      await Promise.all(attachmentPromises);
    }

    res.status(201).json({
      message: "Announcement created successfully",
      announcementId: result.insertId
    });
  } catch (err) {
    next(err);
  }
}

async function getAllAnnouncements(req, res, next) {
  try {
    const { category, status = 'active', page = 1, limit = 20, userId } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT a.*, 
             u.email as admin_email,
             COUNT(DISTINCT av.id) as view_count
      FROM announcements a
      LEFT JOIN users u ON a.admin_id = u.id
      LEFT JOIN announcement_views av ON a.id = av.announcement_id
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      query += " AND a.category = ?";
      params.push(category);
    }

    if (status === 'active') {
      query += " AND a.is_active = TRUE";
      query += " AND (a.expiry_date IS NULL OR a.expiry_date > NOW())";
    } else if (status === 'expired') {
      query += " AND a.expiry_date IS NOT NULL AND a.expiry_date <= NOW()";
    } else if (status === 'archived') {
      query += " AND a.is_active = FALSE";
    }

    query += " GROUP BY a.id ORDER BY a.is_pinned DESC, a.publish_date DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), offset);

    const [announcements] = await pool.query(query, params);

    // Get total count
    let countQuery = "SELECT COUNT(DISTINCT a.id) as total FROM announcements a WHERE 1=1";
    const countParams = [];

    if (category) {
      countQuery += " AND a.category = ?";
      countParams.push(category);
    }

    if (status === 'active') {
      countQuery += " AND a.is_active = TRUE";
      countQuery += " AND (a.expiry_date IS NULL OR a.expiry_date > NOW())";
    } else if (status === 'expired') {
      countQuery += " AND a.expiry_date IS NOT NULL AND a.expiry_date <= NOW()";
    } else if (status === 'archived') {
      countQuery += " AND a.is_active = FALSE";
    }

    const [countResult] = await pool.query(countQuery, countParams);

    // Get attachments for each announcement
    const announcementIds = announcements.map(a => a.id);
    let attachments = [];
    if (announcementIds.length > 0) {
      const [attachmentRows] = await pool.query(
        `SELECT * FROM announcement_attachments WHERE announcement_id IN (${announcementIds.join(',')})`
      );
      attachments = attachmentRows;
    }

    const announcementsWithAttachments = announcements.map(a => ({
      id: a.id,
      adminId: a.admin_id,
      adminEmail: a.admin_email,
      title: a.title,
      content: a.content,
      category: a.category,
      isPinned: Boolean(a.is_pinned),
      isActive: Boolean(a.is_active),
      priority: a.priority,
      publishDate: a.publish_date,
      expiryDate: a.expiry_date,
      viewCount: a.view_count,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
      attachments: attachments
        .filter(att => att.announcement_id === a.id)
        .map(att => ({
          id: att.id,
          fileName: att.file_name,
          filePath: att.file_path,
          fileSize: att.file_size,
          fileType: att.file_type,
          uploadedAt: att.uploaded_at
        }))
    }));

    res.json({
      announcements: announcementsWithAttachments,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getAnnouncementById(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const [announcements] = await pool.query(
      `SELECT a.*, 
              u.email as admin_email
       FROM announcements a
       LEFT JOIN users u ON a.admin_id = u.id
       WHERE a.id = ?`,
      [id]
    );

    if (announcements.length === 0) {
      throw new ApiError(404, "Announcement not found");
    }

    const a = announcements[0];

    // Get attachments
    const [attachments] = await pool.query(
      `SELECT * FROM announcement_attachments WHERE announcement_id = ?`,
      [id]
    );

    // Mark as viewed if user is logged in
    if (userId) {
      await pool.query(
        `INSERT IGNORE INTO announcement_views (announcement_id, user_id) VALUES (?, ?)`,
        [id, userId]
      );
    }

    res.json({
      announcement: {
        id: a.id,
        adminId: a.admin_id,
        adminEmail: a.admin_email,
        title: a.title,
        content: a.content,
        category: a.category,
        isPinned: Boolean(a.is_pinned),
        isActive: Boolean(a.is_active),
        priority: a.priority,
        publishDate: a.publish_date,
        expiryDate: a.expiry_date,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
        attachments: attachments.map(att => ({
          id: att.id,
          fileName: att.file_name,
          filePath: att.file_path,
          fileSize: att.file_size,
          fileType: att.file_type,
          uploadedAt: att.uploaded_at
        }))
      }
    });
  } catch (err) {
    next(err);
  }
}

async function updateAnnouncement(req, res, next) {
  try {
    const { id } = req.params;
    const { title, content, category, isPinned, priority, publishDate, expiryDate, isActive } = req.body;
    const adminId = req.user.id;

    // Validate input
    if (title && title.trim().length === 0) {
      throw new ApiError(400, "Title cannot be empty");
    }

    if (content && content.trim().length === 0) {
      throw new ApiError(400, "Content cannot be empty");
    }

    const validCategories = ['policy_changes', 'new_features', 'events', 'holidays', 'general'];
    if (category && !validCategories.includes(category)) {
      throw new ApiError(400, "Invalid category");
    }

    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (priority && !validPriorities.includes(priority)) {
      throw new ApiError(400, "Invalid priority");
    }

    const [result] = await pool.query(
      `UPDATE announcements 
       SET title = COALESCE(?, title),
           content = COALESCE(?, content),
           category = COALESCE(?, category),
           is_pinned = COALESCE(?, is_pinned),
           priority = COALESCE(?, priority),
           publish_date = COALESCE(?, publish_date),
           expiry_date = COALESCE(?, expiry_date),
           is_active = COALESCE(?, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        title ? title.trim() : null,
        content ? content.trim() : null,
        category,
        isPinned !== undefined ? (isPinned ? 1 : 0) : null,
        priority,
        publishDate,
        expiryDate,
        isActive !== undefined ? (isActive ? 1 : 0) : null,
        id
      ]
    );

    if (result.affectedRows === 0) {
      throw new ApiError(404, "Announcement not found");
    }

    // Handle file attachments if any
    if (req.files && req.files.length > 0) {
      const attachmentPromises = req.files.map(file => {
        return pool.query(
          `INSERT INTO announcement_attachments (announcement_id, file_name, file_path, file_size, file_type)
           VALUES (?, ?, ?, ?, ?)`,
          [
            id,
            file.originalname,
            file.path,
            file.size,
            file.mimetype
          ]
        );
      });
      await Promise.all(attachmentPromises);
    }

    res.json({
      message: "Announcement updated successfully"
    });
  } catch (err) {
    next(err);
  }
}

async function deleteAnnouncement(req, res, next) {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    // Get announcement details before deletion
    const [announcements] = await pool.query(
      `SELECT * FROM announcements WHERE id = ?`,
      [id]
    );

    if (announcements.length === 0) {
      throw new ApiError(404, "Announcement not found");
    }

    const announcement = announcements[0];

    // Archive the announcement
    await pool.query(
      `INSERT INTO announcement_archive (original_announcement_id, title, content, category, admin_id, archived_by, original_publish_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        announcement.title,
        announcement.content,
        announcement.category,
        announcement.admin_id,
        adminId,
        announcement.publish_date
      ]
    );

    // Delete attachments from filesystem
    const [attachments] = await pool.query(
      `SELECT file_path FROM announcement_attachments WHERE announcement_id = ?`,
      [id]
    );

    attachments.forEach(att => {
      const filePath = path.join(__dirname, '../../uploads', att.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    // Delete the announcement (cascade will delete attachments)
    const [result] = await pool.query(
      `DELETE FROM announcements WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      throw new ApiError(404, "Announcement not found");
    }

    res.json({
      message: "Announcement deleted successfully"
    });
  } catch (err) {
    next(err);
  }
}

async function archiveAnnouncement(req, res, next) {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    // Get announcement details
    const [announcements] = await pool.query(
      `SELECT * FROM announcements WHERE id = ?`,
      [id]
    );

    if (announcements.length === 0) {
      throw new ApiError(404, "Announcement not found");
    }

    const announcement = announcements[0];

    // Archive the announcement
    await pool.query(
      `INSERT INTO announcement_archive (original_announcement_id, title, content, category, admin_id, archived_by, original_publish_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        announcement.title,
        announcement.content,
        announcement.category,
        announcement.admin_id,
        adminId,
        announcement.publish_date
      ]
    );

    // Mark as inactive
    const [result] = await pool.query(
      `UPDATE announcements SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      throw new ApiError(404, "Announcement not found");
    }

    res.json({
      message: "Announcement archived successfully"
    });
  } catch (err) {
    next(err);
  }
}

async function getAnnouncementStats(req, res, next) {
  try {
    const [total] = await pool.query(
      `SELECT COUNT(*) as count FROM announcements WHERE is_active = TRUE`
    );

    const [pinned] = await pool.query(
      `SELECT COUNT(*) as count FROM announcements WHERE is_pinned = TRUE AND is_active = TRUE`
    );

    const [byCategory] = await pool.query(
      `SELECT category, COUNT(*) as count 
       FROM announcements 
       WHERE is_active = TRUE 
       GROUP BY category`
    );

    res.json({
      stats: {
        total: total[0].count,
        pinned: pinned[0].count,
        byCategory: byCategory.reduce((acc, row) => {
          acc[row.category] = row.count;
          return acc;
        }, {})
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
  archiveAnnouncement,
  getAnnouncementStats
};
