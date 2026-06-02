const pool = require("../config/db");
const ApiError = require("../utils/apiError");

async function upsertProfile(req, res, next) {
  try {
    const {
      first_name,
      last_name,
      phone,
      national_id,
      date_of_birth,
      address,
      business_name,
      business_type,
      vending_zone,
    } = req.body;

    const userId = req.user.id;

    console.log("Received profile data:", req.body);
    console.log("User ID:", userId);

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    // First, check if profile exists
    const [[existingProfile]] = await pool.query(
      "SELECT id FROM vendor_profiles WHERE user_id = ?",
      [userId]
    );

    console.log("Existing profile:", existingProfile);

    let result;
    if (existingProfile) {
      // Update existing profile
      console.log("Updating existing profile");
      result = await pool.query(
        `UPDATE vendor_profiles SET 
          first_name = ?,
          last_name = ?,
          phone = ?,
          national_id = ?,
          date_of_birth = ?,
          address = ?,
          business_name = ?,
          business_type = ?,
          vending_zone = ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [
          first_name || null,
          last_name || null,
          phone || null,
          national_id || null,
          date_of_birth || null,
          address || null,
          business_name || null,
          business_type || null,
          vending_zone || null,
          userId,
        ]
      );
    } else {
      // Insert new profile
      console.log("Inserting new profile");
      result = await pool.query(
        `INSERT INTO vendor_profiles (
          user_id, first_name, last_name, phone, national_id, date_of_birth,
          address, business_name, business_type, vending_zone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          first_name || null,
          last_name || null,
          phone || null,
          national_id || null,
          date_of_birth || null,
          address || null,
          business_name || null,
          business_type || null,
          vending_zone || null,
        ]
      );
    }

    console.log("Query result:", result);

    res.json({ message: "Vendor profile updated successfully" });
  } catch (err) {
    console.error("Error in upsertProfile:", err);
    next(err);
  }
}

async function uploadDocuments(req, res, next) {
  try {
    const userId = req.user.id;
    const files = req.files || [];

    if (files.length === 0) {
      throw new ApiError(400, "Please upload at least one document");
    }

    const values = files.map((file) => [
      userId,
      file.fieldname,
      file.originalname,
      file.filename,
      file.mimetype,
      file.size,
    ]);

    await pool.query(
      `INSERT INTO vendor_documents
      (user_id, document_type, original_name, stored_name, mime_type, file_size)
      VALUES ?`,
      [values],
    );

    res.status(201).json({
      message: "Documents uploaded successfully",
      files: files.map((f) => ({
        type: f.fieldname,
        name: f.originalname,
      })),
    });
  } catch (err) {
    next(err);
  }
}

async function uploadProfilePicture(req, res, next) {
  try {
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
      throw new ApiError(400, "Please upload a profile picture");
    }

    // Save the file path to database
    const profilePictureUrl = `/uploads/profile-pictures/${file.filename}`;
    
    await pool.query(
      `UPDATE vendor_profiles 
       SET profile_picture_url = ?, profile_picture_uploaded_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [profilePictureUrl, userId],
    );

    res.json({
      message: "Profile picture uploaded successfully",
      profile_picture_url: profilePictureUrl,
    });
  } catch (err) {
    next(err);
  }
}

async function getDashboard(req, res, next) {
  try {
    const userId = req.user.id;

    const [[profile]] = await pool.query(
      `SELECT first_name, last_name, phone, national_id, date_of_birth, address, business_name, business_type, vending_zone
       FROM vendor_profiles WHERE user_id = ?`,
      [userId],
    );

    const [docs] = await pool.query(
      `SELECT id, document_type, original_name, uploaded_at
       FROM vendor_documents WHERE user_id = ? ORDER BY uploaded_at DESC`,
      [userId],
    );

    const [applications] = await pool.query(
      `SELECT id, application_ref, desired_zone, stall_type, status, submitted_at, reviewed_at
       FROM license_applications
       WHERE user_id = ?
       ORDER BY submitted_at DESC`,
      [userId],
    );

    res.json({
      profile: profile || null,
      documents: docs,
      applications,
    });
  } catch (err) {
    next(err);
  }
}

async function listNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const { category, search, status } = req.query;
    const conditions = ["user_id = ?"];
    const params = [userId];

    if (category && category !== "All") {
      conditions.push("category = ?");
      params.push(category);
    }

    if (status === "read") {
      conditions.push("is_read = 1");
    } else if (status === "unread") {
      conditions.push("is_read = 0");
    }

    if (search) {
      conditions.push("(title LIKE ? OR message LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const [rows] = await pool.query(
      `SELECT id, category, title, message, link, is_read, created_at, updated_at
       FROM vendor_notifications
       WHERE ${conditions.join(" AND ")}
       ORDER BY created_at DESC`,
      params,
    );

    res.json({ notifications: rows });
  } catch (err) {
    next(err);
  }
}

async function getNotificationPreferences(req, res, next) {
  try {
    const userId = req.user.id;
    const [[prefs]] = await pool.query(
      `SELECT email_notifications, sms_notifications, push_notifications,
              license_updates, payment_alerts, renewal_reminders,
              zone_changes, inspection_notices, system_announcements
       FROM vendor_notification_preferences
       WHERE user_id = ?`,
      [userId],
    );

    if (prefs) {
      res.json({ preferences: prefs });
      return;
    }

    res.json({
      preferences: {
        email_notifications: true,
        sms_notifications: true,
        push_notifications: false,
        license_updates: true,
        payment_alerts: true,
        renewal_reminders: true,
        zone_changes: true,
        inspection_notices: true,
        system_announcements: true,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function updateNotificationPreferences(req, res, next) {
  try {
    const userId = req.user.id;
    const {
      email_notifications = true,
      sms_notifications = true,
      push_notifications = false,
      license_updates = true,
      payment_alerts = true,
      renewal_reminders = true,
      zone_changes = true,
      inspection_notices = true,
      system_announcements = true,
    } = req.body;

    await pool.query(
      `INSERT INTO vendor_notification_preferences
       (user_id, email_notifications, sms_notifications, push_notifications,
        license_updates, payment_alerts, renewal_reminders,
        zone_changes, inspection_notices, system_announcements)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         email_notifications = VALUES(email_notifications),
         sms_notifications = VALUES(sms_notifications),
         push_notifications = VALUES(push_notifications),
         license_updates = VALUES(license_updates),
         payment_alerts = VALUES(payment_alerts),
         renewal_reminders = VALUES(renewal_reminders),
         zone_changes = VALUES(zone_changes),
         inspection_notices = VALUES(inspection_notices),
         system_announcements = VALUES(system_announcements)`,
      [
        userId,
        email_notifications ? 1 : 0,
        sms_notifications ? 1 : 0,
        push_notifications ? 1 : 0,
        license_updates ? 1 : 0,
        payment_alerts ? 1 : 0,
        renewal_reminders ? 1 : 0,
        zone_changes ? 1 : 0,
        inspection_notices ? 1 : 0,
        system_announcements ? 1 : 0,
      ],
    );

    res.json({ message: "Notification preferences updated successfully" });
  } catch (err) {
    next(err);
  }
}

async function markNotificationRead(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const [result] = await pool.query(
      `UPDATE vendor_notifications
       SET is_read = 1
       WHERE id = ? AND user_id = ?`,
      [id, userId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification marked as read" });
  } catch (err) {
    next(err);
  }
}

async function markNotificationUnread(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const [result] = await pool.query(
      `UPDATE vendor_notifications
       SET is_read = 0
       WHERE id = ? AND user_id = ?`,
      [id, userId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification marked as unread" });
  } catch (err) {
    next(err);
  }
}

async function deleteNotification(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const [result] = await pool.query(
      `DELETE FROM vendor_notifications
       WHERE id = ? AND user_id = ?`,
      [id, userId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted successfully" });
  } catch (err) {
    next(err);
  }
}

async function createComplaint(req, res, next) {
  try {
    const userId = req.user.id;
    const { subject, category, priority = "medium", description, is_anonymous = false } = req.body;

    if (!subject || !category || !description) {
      throw new ApiError(400, "Subject, category, and description are required");
    }

    const categories = [
      "Zone issue",
      "License problem",
      "Payment issue",
      "Harassment",
      "Illegal eviction",
      "Others",
    ];
    if (!categories.includes(category)) {
      throw new ApiError(400, "Invalid complaint category");
    }

    if (!["low", "medium", "high"].includes(priority)) {
      throw new ApiError(400, "Invalid priority level");
    }

    const complaintRef = `C-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const [result] = await pool.query(
      `INSERT INTO vendor_complaints (
        complaint_ref, user_id, is_anonymous, subject, category, priority, description, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'new')`,
      [complaintRef, userId, is_anonymous ? 1 : 0, subject, category, priority, description],
    );

    res.status(201).json({
      message: "Complaint filed successfully",
      complaint_ref: complaintRef,
      complaint_id: result.insertId,
    });
  } catch (err) {
    next(err);
  }
}

async function listComplaints(req, res, next) {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let query = `SELECT id, complaint_ref, subject, category, priority, status, description, created_at, resolved_at
                 FROM vendor_complaints
                 WHERE user_id = ?`;
    const params = [userId];

    if (status) {
      query += " AND status = ?";
      params.push(status);
    }

    query += " ORDER BY created_at DESC";

    const [rows] = await pool.query(query, params);
    res.json({ complaints: rows });
  } catch (err) {
    next(err);
  }
}

async function getComplaintDetails(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [[complaint]] = await pool.query(
      `SELECT id, complaint_ref, subject, category, priority, status, description, 
              resolution_note, created_at, resolved_at
       FROM vendor_complaints
       WHERE id = ? AND user_id = ?`,
      [id, userId],
    );

    if (!complaint) {
      throw new ApiError(404, "Complaint not found");
    }

    const [evidence] = await pool.query(
      `SELECT id, original_name, stored_name, file_type, file_size, created_at
       FROM complaint_evidence
       WHERE complaint_id = ?
       ORDER BY created_at DESC`,
      [id],
    );

    res.json({ complaint, evidence });
  } catch (err) {
    next(err);
  }
}

async function uploadComplaintEvidence(req, res, next) {
  try {
    const { complaintId } = req.params;
    const files = req.files || [];

    if (files.length === 0) {
      throw new ApiError(400, "Please upload at least one file as evidence");
    }

    // Verify complaint belongs to user
    const [[complaint]] = await pool.query(
      `SELECT id FROM vendor_complaints WHERE id = ? AND user_id = ?`,
      [complaintId, req.user.id],
    );

    if (!complaint) {
      throw new ApiError(404, "Complaint not found");
    }

    const values = files.map((file) => [
      complaintId,
      file.fieldname,
      file.originalname,
      file.filename,
      file.mimetype,
      file.size,
    ]);

    await pool.query(
      `INSERT INTO complaint_evidence
       (complaint_id, file_type, original_name, stored_name, mime_type, file_size)
       VALUES ?`,
      [values],
    );

    res.status(201).json({
      message: "Evidence uploaded successfully",
      files: files.map((f) => ({
        type: f.fieldname,
        name: f.originalname,
      })),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  upsertProfile,
  uploadDocuments,
  uploadProfilePicture,
  getDashboard,
  listNotifications,
  getNotificationPreferences,
  updateNotificationPreferences,
  markNotificationRead,
  markNotificationUnread,
  deleteNotification,
  createComplaint,
  listComplaints,
  getComplaintDetails,
  uploadComplaintEvidence,
};
