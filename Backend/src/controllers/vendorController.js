const pool = require("../config/db");
const ApiError = require("../utils/apiError");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

let complaintCommentsTableReady = false;

async function ensureComplaintCommentsTable() {
  if (complaintCommentsTableReady) {
    return;
  }

  await pool.query(
    `CREATE TABLE IF NOT EXISTS complaint_comments (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      complaint_id BIGINT UNSIGNED NOT NULL,
      author_type ENUM('vendor', 'admin') NOT NULL DEFAULT 'vendor',
      author_id BIGINT UNSIGNED NULL,
      comment TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_complaint_comments_complaint (complaint_id),
      CONSTRAINT fk_complaint_comments_complaint FOREIGN KEY (complaint_id) REFERENCES vendor_complaints (id) ON DELETE CASCADE
    ) ENGINE = InnoDB;`,
  );

  complaintCommentsTableReady = true;
}

async function upsertProfile(req, res, next) {
  try {
    const {
      first_name,
      last_name,
      phone,
      national_id,
      date_of_birth,
      gender,
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

    // Convert ISO date string to MySQL DATE format (YYYY-MM-DD)
    let formattedDateOfBirth = null;
    if (date_of_birth) {
      try {
        const date = new Date(date_of_birth);
        formattedDateOfBirth = date.toISOString().split('T')[0];
      } catch (e) {
        console.error("Error parsing date_of_birth:", e);
      }
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

      // Build the update query dynamically to implement "gender can only be updated once"
      let updateFields = `
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
      `;

      let queryParams = [
          first_name || null,
          last_name || null,
          phone || null,
          national_id || null,
          formattedDateOfBirth,
          address || null,
          business_name || null,
          business_type || null,
          vending_zone || null
      ];

      // Only allow updating gender if it hasn't been set before
      // First, get the current gender from the profile
      const [[currentProfile]] = await pool.query(
        "SELECT gender FROM vendor_profiles WHERE user_id = ?",
        [userId]
      );

      if (gender && (!currentProfile.gender || currentProfile.gender === '')) {
        updateFields += ", gender = ?";
        queryParams.push(gender);
      }

      queryParams.push(userId);

      result = await pool.query(
        `UPDATE vendor_profiles SET ${updateFields} WHERE user_id = ?`,
        queryParams
      );
    } else {
      // Insert new profile
      console.log("Inserting new profile");
      result = await pool.query(
        `INSERT INTO vendor_profiles (
          user_id, first_name, last_name, phone, national_id, date_of_birth, gender,
          address, business_name, business_type, vending_zone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          first_name || null,
          last_name || null,
          phone || null,
          national_id || null,
          formattedDateOfBirth,
          gender || null,
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

    console.log("Uploading profile picture for user:", userId);
    console.log("File:", file.filename);

    // Read the file data as buffer
    const filePath = path.join(__dirname, "../../uploads/profile-pictures", file.filename);
    const fileData = fs.readFileSync(filePath);

    // Delete the file from disk after reading it (since we're storing in database)
    fs.unlinkSync(filePath);

    console.log("File read and deleted from disk, size:", fileData.length);

    // Store the image data in database
    const profilePictureUrl = `/api/vendor/profile-picture`;

    console.log("Profile picture URL to save:", profilePictureUrl);

    // Check if profile exists, if not create it
    const [[existingProfile]] = await pool.query(
      "SELECT id FROM vendor_profiles WHERE user_id = ?",
      [userId]
    );

    if (existingProfile) {
      await pool.query(
        `UPDATE vendor_profiles
         SET profile_picture_url = ?, profile_picture_data = ?, profile_picture_mime_type = ?, profile_picture_uploaded_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [profilePictureUrl, fileData, file.mimetype, userId],
      );
    } else {
      await pool.query(
        `INSERT INTO vendor_profiles (user_id, profile_picture_url, profile_picture_data, profile_picture_mime_type, profile_picture_uploaded_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [userId, profilePictureUrl, fileData, file.mimetype],
      );
    }

    console.log("Profile picture data saved to database");

    res.json({
      message: "Profile picture uploaded successfully",
      profile_picture_url: profilePictureUrl,
    });
  } catch (err) {
    console.error("Error uploading profile picture:", err);
    next(err);
  }
}

async function getDashboard(req, res, next) {
  try {
    const userId = req.user.id;

    const [[profile]] = await pool.query(
      `SELECT first_name, last_name, phone, national_id, date_of_birth, gender, address, business_name, business_type, vending_zone, profile_picture_url
       FROM vendor_profiles WHERE user_id = ?`,
      [userId],
    );

    console.log("Profile data for dashboard:", profile);

    const [docs] = await pool.query(
      `SELECT id, document_type, original_name, uploaded_at
       FROM vendor_documents WHERE user_id = ? ORDER BY uploaded_at DESC`,
      [userId],
    );

    const [applications] = await pool.query(
      `SELECT id, application_ref, desired_zone, stall_type, status, submitted_at, reviewed_at, payment_status, payment_id
       FROM license_applications
       WHERE user_id = ?
       ORDER BY submitted_at DESC`,
      [userId],
    );

    // Get payment summary for dashboard
    const [[paymentSummary]] = await pool.query(
      `SELECT 
        COUNT(*) as total_payments,
        COALESCE(SUM(final_amount), 0) as total_paid,
        COALESCE(SUM(CASE WHEN status = 'completed' AND YEAR(payment_date) = YEAR(NOW()) THEN final_amount ELSE 0 END), 0) as paid_this_year
       FROM vendor_payments
       WHERE user_id = ?`,
      [userId]
    );

    // Get outstanding dues
    const [[outstandingSummary]] = await pool.query(
      `SELECT 
        COUNT(*) as outstanding_count,
        COALESCE(SUM(amount), 0) as outstanding_amount
       FROM vendor_dues
       WHERE user_id = ? AND is_paid = 0`,
      [userId]
    );

    res.json({
      profile: profile || null,
      documents: docs,
      applications,
      payment_summary: paymentSummary || { total_payments: 0, total_paid: 0, paid_this_year: 0 },
      outstanding_summary: outstandingSummary || { outstanding_count: 0, outstanding_amount: 0 },
    });
  } catch (err) {
    next(err);
  }
}

async function listNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const { category, search, status } = req.query;
    const conditions = ["user_id = ?", "is_hidden = 0"];
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

    let rows;
    try {
      rows = await pool.query(
        `SELECT id, category, title, message, link, is_read, is_hidden, created_at, updated_at,
                action_type, related_application_id, zone_or_area, admin_remarks, action_details
         FROM vendor_notifications
         WHERE ${conditions.join(" AND ")}
         ORDER BY created_at DESC`,
        params,
      );
    } catch (err) {
      // Fallback if new columns don't exist yet
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        console.log('New notification columns not found, using fallback query');
        try {
          rows = await pool.query(
            `SELECT id, category, title, message, link, is_read, is_hidden, created_at, updated_at
             FROM vendor_notifications
             WHERE ${conditions.join(" AND ")}
             ORDER BY created_at DESC`,
            params,
          );
        } catch (err2) {
          // Final fallback if is_hidden also doesn't exist
          if (err2.code === 'ER_BAD_FIELD_ERROR') {
            console.log('is_hidden column not found, using minimal query');
            rows = await pool.query(
              `SELECT id, category, title, message, link, is_read, created_at, updated_at
               FROM vendor_notifications
               WHERE ${conditions.join(" AND ").replace(" AND is_hidden = 0", "")}
               ORDER BY created_at DESC`,
              params.filter((_, i) => i !== 1), // Remove is_hidden param
            );
          } else {
            throw err2;
          }
        }
      } else {
        throw err;
      }
    }

    console.log(`Fetched ${rows.length} notifications for user ${userId}`);
    console.log('Notifications data:', JSON.stringify(rows, null, 2));
    res.json({ notifications: rows });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    // If table doesn't exist, return empty array instead of error
    if (err.code === 'ER_NO_SUCH_TABLE') {
      console.log('vendor_notifications table does not exist, returning empty array');
      return res.json({ notifications: [] });
    }
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

async function hideNotification(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const [result] = await pool.query(
      `UPDATE vendor_notifications
       SET is_hidden = 1
       WHERE id = ? AND user_id = ?`,
      [id, userId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification hidden successfully" });
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
    await ensureComplaintCommentsTable();

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

    const [comments] = await pool.query(
      `SELECT id, author_type, comment, created_at
       FROM complaint_comments
       WHERE complaint_id = ?
       ORDER BY created_at ASC`,
      [id],
    );

    res.json({ complaint, evidence, comments });
  } catch (err) {
    next(err);
  }
}

async function addComplaintFollowUp(req, res, next) {
  try {
    await ensureComplaintCommentsTable();

    const userId = req.user.id;
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment || comment.trim().length === 0) {
      throw new ApiError(400, "Follow-up comment is required");
    }

    const [[complaint]] = await pool.query(
      `SELECT id FROM vendor_complaints WHERE id = ? AND user_id = ?`,
      [id, userId],
    );

    if (!complaint) {
      throw new ApiError(404, "Complaint not found");
    }

    await pool.query(
      `INSERT INTO complaint_comments (complaint_id, author_type, author_id, comment)
       VALUES (?, 'vendor', ?, ?)`,
      [id, userId, comment.trim()],
    );

    res.status(201).json({ message: "Follow-up comment added successfully" });
  } catch (err) {
    next(err);
  }
}

async function closeComplaint(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [[complaint]] = await pool.query(
      `SELECT id, status FROM vendor_complaints WHERE id = ? AND user_id = ?`,
      [id, userId],
    );

    if (!complaint) {
      throw new ApiError(404, "Complaint not found");
    }

    if (complaint.status === "closed") {
      throw new ApiError(400, "Complaint is already closed");
    }

    await pool.query(
      `UPDATE vendor_complaints
       SET status = 'closed', resolved_at = NOW()
       WHERE id = ?`,
      [id],
    );

    res.json({ message: "Complaint closed successfully" });
  } catch (err) {
    next(err);
  }
}

async function escalateComplaint(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [[complaint]] = await pool.query(
      `SELECT id, status FROM vendor_complaints WHERE id = ? AND user_id = ?`,
      [id, userId],
    );

    if (!complaint) {
      throw new ApiError(404, "Complaint not found");
    }

    if (complaint.status === "closed") {
      throw new ApiError(400, "Closed complaints cannot be escalated");
    }

    await pool.query(
      `UPDATE vendor_complaints
       SET status = 'in_progress'
       WHERE id = ?`,
      [id],
    );

    res.json({ message: "Complaint has been escalated for review" });
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

async function getMyLicense(req, res, next) {
  try {
    const userId = req.user.id;

    // Get vendor profile
    const [[profile]] = await pool.query(
      `SELECT first_name, last_name, phone, address, business_name, business_type,
              vending_zone, profile_picture_url
       FROM vendor_profiles WHERE user_id = ?`,
      [userId],
    );

    // Get approved license application with license type name
    const [[license]] = await pool.query(
      `SELECT la.id, la.application_ref, la.license_number, la.desired_zone, la.stall_type,
              la.business_category, la.goods_authorized, la.license_category,
              la.license_type_id, lt.name as license_type_name,
              la.issued_at, la.expires_at, la.qr_code_data, la.status, la.reviewed_at
       FROM license_applications la
       LEFT JOIN license_types lt ON la.license_type_id = lt.id
       WHERE la.user_id = ? AND la.status = 'approved'
       ORDER BY la.reviewed_at DESC
       LIMIT 1`,
      [userId],
    );

    if (!license) {
      // Return 200 with null license instead of 404
      return res.json({
        profile: profile || null,
        license: null,
        message: "No approved license found. Please apply for a license first.",
      });
    }

    // Use vendor profile zone for allocated zone display
    license.allocated_zone = profile?.vending_zone || license.desired_zone || "Not assigned";

    // Fill missing goods_authorized from vendor profile
    if (!license.goods_authorized || license.goods_authorized === "To be selected" || license.goods_authorized === "") {
      license.goods_authorized = profile?.business_type || license.business_category || "General";
    }

    res.json({
      profile: profile || null,
      license,
    });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ApiError(400, "Current password and new password are required");
    }

    if (newPassword.length < 6) {
      throw new ApiError(400, "New password must be at least 6 characters");
    }

    // Get user's current password hash
    const [[user]] = await pool.query(
      "SELECT password_hash FROM users WHERE id = ?",
      [userId]
    );

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      throw new ApiError(401, "Current password is incorrect");
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      "UPDATE users SET password_hash = ? WHERE id = ?",
      [newPasswordHash, userId]
    );

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
}

async function deactivateAccount(req, res, next) {
  try {
    const userId = req.user.id;

    // Update user account status to suspended
    await pool.query(
      "UPDATE users SET account_status = 'suspended' WHERE id = ?",
      [userId]
    );

    res.json({ message: "Account deactivated successfully" });
  } catch (err) {
    next(err);
  }
}

async function deleteAccount(req, res, next) {
  try {
    const userId = req.user.id;

    // Delete vendor profile
    await pool.query("DELETE FROM vendor_profiles WHERE user_id = ?", [userId]);

    // Delete license applications
    await pool.query("DELETE FROM license_applications WHERE user_id = ?", [userId]);

    // Delete notifications
    await pool.query("DELETE FROM vendor_notifications WHERE user_id = ?", [userId]);

    // Delete notification preferences
    await pool.query("DELETE FROM vendor_notification_preferences WHERE user_id = ?", [userId]);

    // Delete settings
    await pool.query("DELETE FROM vendor_settings WHERE user_id = ?", [userId]);

    // Delete complaints
    await pool.query("DELETE FROM complaints WHERE user_id = ?", [userId]);

    // Delete user
    await pool.query("DELETE FROM users WHERE id = ?", [userId]);

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    next(err);
  }
}

async function downloadUserData(req, res, next) {
  try {
    const userId = req.user.id;

    // Get user data
    const [[user]] = await pool.query(
      "SELECT id, email, role, account_status, created_at FROM users WHERE id = ?",
      [userId],
    );

    // Get vendor profile
    const [[profile]] = await pool.query(
      "SELECT * FROM vendor_profiles WHERE user_id = ?",
      [userId],
    );

    // Get license applications
    const [applications] = await pool.query(
      "SELECT * FROM license_applications WHERE user_id = ?",
      [userId],
    );

    // Get complaints
    const [complaints] = await pool.query(
      "SELECT * FROM complaints WHERE user_id = ?",
      [userId],
    );

    // Get notifications
    const [notifications] = await pool.query(
      "SELECT * FROM vendor_notifications WHERE user_id = ?",
      [userId],
    );

    // Get settings
    const [[settings]] = await pool.query(
      "SELECT * FROM vendor_settings WHERE user_id = ?",
      [userId],
    );

    const userData = {
      user: user || null,
      profile: profile || null,
      applications: applications || [],
      complaints: complaints || [],
      notifications: notifications || [],
      settings: settings || null,
      exportDate: new Date().toISOString(),
    };

    res.json(userData);
  } catch (err) {
    console.error("Error downloading user data:", err);
    next(err);
  }
}

async function getActivityLog(req, res, next) {
  try {
    const userId = req.user.id;

    // Get recent activity from various tables
    let applications = [];
    let complaints = [];
    let notifications = [];

    try {
      [applications] = await pool.query(
        "SELECT 'application' as type, id, status, created_at, updated_at FROM license_applications WHERE user_id = ? ORDER BY updated_at DESC LIMIT 20",
        [userId],
      );
    } catch (err) {
      console.error("Error fetching applications for activity log:", err);
    }

    try {
      [complaints] = await pool.query(
        "SELECT 'complaint' as type, id, status, created_at, updated_at FROM complaints WHERE user_id = ? ORDER BY updated_at DESC LIMIT 20",
        [userId],
      );
    } catch (err) {
      console.error("Error fetching complaints for activity log:", err);
    }

    try {
      [notifications] = await pool.query(
        "SELECT 'notification' as type, id, is_read as status, created_at, updated_at FROM vendor_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
        [userId],
      );
    } catch (err) {
      console.error("Error fetching notifications for activity log:", err);
    }

    // Combine and sort by date
    const activities = [
      ...applications.map(a => ({ ...a, description: `License application ${a.status}` })),
      ...complaints.map(c => ({ ...c, description: `Complaint ${c.status}` })),
      ...notifications.map(n => ({ ...n, description: n.status ? 'Notification read' : 'New notification' })),
    ].sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));

    res.json({ activities });
  } catch (err) {
    console.error("Error fetching activity log:", err);
    next(err);
  }
}

async function getVendingZones(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT id, zone_code, name, location, area, total_spots, available_spots,
              latitude, longitude, zone_type, traffic_level
       FROM vending_zones
       ORDER BY name ASC`
    );

    console.log(`Fetched ${rows.length} vending zones`);
    res.json({ zones: rows });
  } catch (err) {
    console.error('Error fetching vending zones:', err);
    next(err);
  }
}

async function getMyZone(req, res, next) {
  try {
    const userId = req.user.id;

    // Get vendor's assigned zone from profile
    const [[profile]] = await pool.query(
      "SELECT vending_zone, assigned_spot_number FROM vendor_profiles WHERE user_id = ?",
      [userId]
    );

    if (!profile || !profile.vending_zone) {
      throw new ApiError(404, "No zone assigned to your profile. Please contact admin.");
    }

    // Get zone details
    const [[zone]] = await pool.query(
      `SELECT id, zone_code, name, location, area, dimensions, total_spots, available_spots,
              has_electricity, has_water, has_shade, nearby_landmarks, operating_hours,
              rules_regulations, zone_in_charge_contact, latitude, longitude, zone_type, traffic_level
       FROM vending_zones
       WHERE name = ? OR zone_code = ?`,
      [profile.vending_zone, profile.vending_zone]
    );

    if (!zone) {
      throw new ApiError(404, "Zone not found in database");
    }

    // Get other vendors in the same zone
    const [otherVendors] = await pool.query(
      `SELECT vp.business_name, vp.assigned_spot_number, u.email
       FROM vendor_profiles vp
       JOIN users u ON u.id = vp.user_id
       WHERE vp.vending_zone = ? AND vp.user_id != ?
       LIMIT 10`,
      [profile.vending_zone, userId]
    );

    res.json({
      zone: {
        ...zone,
        has_electricity: Boolean(zone.has_electricity),
        has_water: Boolean(zone.has_water),
        has_shade: Boolean(zone.has_shade),
      },
      assigned_spot: profile.assigned_spot_number || "Not assigned",
      other_vendors: otherVendors,
    });
  } catch (err) {
    next(err);
  }
}

async function updateMyZone(req, res, next) {
  try {
    const userId = req.user.id;
    const { operating_hours, rules_regulations, zone_in_charge_contact, nearby_landmarks } = req.body;

    // Get vendor's assigned zone from profile
    const [[profile]] = await pool.query(
      "SELECT vending_zone FROM vendor_profiles WHERE user_id = ?",
      [userId]
    );

    if (!profile || !profile.vending_zone) {
      throw new ApiError(404, "No zone assigned to your profile. Please contact admin.");
    }

    // Update zone details
    await pool.query(
      `UPDATE vending_zones
       SET operating_hours = COALESCE(?, operating_hours),
           rules_regulations = COALESCE(?, rules_regulations),
           zone_in_charge_contact = COALESCE(?, zone_in_charge_contact),
           nearby_landmarks = COALESCE(?, nearby_landmarks),
           updated_at = CURRENT_TIMESTAMP
       WHERE name = ? OR zone_code = ?`,
      [
        operating_hours || null,
        rules_regulations || null,
        zone_in_charge_contact || null,
        nearby_landmarks || null,
        profile.vending_zone,
        profile.vending_zone,
      ]
    );

    res.json({ message: "Zone details updated successfully" });
  } catch (err) {
    next(err);
  }
}

async function getProfilePicture(req, res, next) {
  try {
    const userId = req.user.id;

    const [[profile]] = await pool.query(
      `SELECT profile_picture_data, profile_picture_mime_type
       FROM vendor_profiles WHERE user_id = ?`,
      [userId],
    );

    if (!profile || !profile.profile_picture_data) {
      throw new ApiError(404, "Profile picture not found");
    }

    res.set('Content-Type', profile.profile_picture_mime_type);
    res.send(profile.profile_picture_data);
  } catch (err) {
    next(err);
  }
}

async function getSettings(req, res, next) {
  try {
    const userId = req.user.id;

    const [[settings]] = await pool.query(
      `SELECT theme, language, high_contrast_mode, large_text, screen_reader_support,
              profile_visibility, auto_renewal, save_payment_methods, email_receipts,
              two_factor_auth, marketing_communications
       FROM vendor_settings WHERE user_id = ?`,
      [userId],
    );

    if (!settings) {
      // Return default settings if none exist
      return res.json({
        theme: 'light',
        language: 'english',
        high_contrast_mode: 0,
        large_text: 0,
        screen_reader_support: 0,
        profile_visibility: 1,
        auto_renewal: 1,
        save_payment_methods: 1,
        email_receipts: 1,
        two_factor_auth: 0,
        marketing_communications: 0,
      });
    }

    res.json({
      theme: settings.theme,
      language: settings.language,
      high_contrast_mode: Boolean(settings.high_contrast_mode),
      large_text: Boolean(settings.large_text),
      screen_reader_support: Boolean(settings.screen_reader_support),
      profile_visibility: Boolean(settings.profile_visibility),
      auto_renewal: Boolean(settings.auto_renewal),
      save_payment_methods: Boolean(settings.save_payment_methods),
      email_receipts: Boolean(settings.email_receipts),
      two_factor_auth: Boolean(settings.two_factor_auth),
      marketing_communications: Boolean(settings.marketing_communications),
    });
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const userId = req.user.id;
    const {
      theme,
      language,
      high_contrast_mode,
      large_text,
      screen_reader_support,
      profile_visibility,
      auto_renewal,
      save_payment_methods,
      email_receipts,
      two_factor_auth,
      marketing_communications,
    } = req.body;

    await pool.query(
      `INSERT INTO vendor_settings
       (user_id, theme, language, high_contrast_mode, large_text, screen_reader_support,
        profile_visibility, auto_renewal, save_payment_methods, email_receipts,
        two_factor_auth, marketing_communications)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         theme = VALUES(theme),
         language = VALUES(language),
         high_contrast_mode = VALUES(high_contrast_mode),
         large_text = VALUES(large_text),
         screen_reader_support = VALUES(screen_reader_support),
         profile_visibility = VALUES(profile_visibility),
         auto_renewal = VALUES(auto_renewal),
         save_payment_methods = VALUES(save_payment_methods),
         email_receipts = VALUES(email_receipts),
         two_factor_auth = VALUES(two_factor_auth),
         marketing_communications = VALUES(marketing_communications)`,
      [
        userId,
        theme || 'light',
        language || 'english',
        high_contrast_mode ? 1 : 0,
        large_text ? 1 : 0,
        screen_reader_support ? 1 : 0,
        profile_visibility ? 1 : 0,
        auto_renewal ? 1 : 0,
        save_payment_methods ? 1 : 0,
        email_receipts ? 1 : 0,
        two_factor_auth ? 1 : 0,
        marketing_communications ? 1 : 0,
      ],
    );

    res.json({ message: "Settings updated successfully" });
  } catch (err) {
    next(err);
  }
}

// Women Vendor Support Functions
async function checkWomenSupportAccess(req, res, next) {
  try {
    const userId = req.user.id;

    const [[profile]] = await pool.query(
      "SELECT gender FROM vendor_profiles WHERE user_id = ?",
      [userId]
    );

    if (!profile || !profile.gender) {
      return res.json({
        canAccess: false,
        message: "Gender information not found in your profile. Please complete your profile first."
      });
    }

    if (profile.gender.toLowerCase() !== 'female') {
      return res.json({
        canAccess: false,
        message: "This feature is not applicable for you, please contact the authority."
      });
    }

    res.json({ canAccess: true });
  } catch (err) {
    next(err);
  }
}

async function getWomenSupportData(req, res, next) {
  try {
    const userId = req.user.id;

    // Check gender first
    const [[profile]] = await pool.query(
      "SELECT gender FROM vendor_profiles WHERE user_id = ?",
      [userId]
    );

    if (!profile || profile.gender.toLowerCase() !== 'female') {
      throw new ApiError(403, "This feature is not applicable for you, please contact the authority.");
    }

    // Get schemes and subsidies
    const [schemes] = await pool.query(
      `SELECT id, name, description, amount, eligibility_criteria, application_link, deadline, status
       FROM women_schemes_subsidies
       WHERE status = 'active'
       ORDER BY created_at DESC`
    );

    // Get mentors
    const [mentors] = await pool.query(
      `SELECT id, name, expertise, experience_years, bio, contact_email, contact_phone, profile_picture_url, available
       FROM women_mentors
       WHERE available = TRUE
       ORDER BY experience_years DESC`
    );

    // Get success stories
    const [successStories] = await pool.query(
      `SELECT id, vendor_name, business_category, earnings_monthly, story_title, story_content, profile_picture_url, featured
       FROM women_success_stories
       ORDER BY featured DESC, created_at DESC`
    );

    // Get community posts count
    const [[communityCount]] = await pool.query(
      "SELECT COUNT(*) as count FROM women_community_posts"
    );

    // Get safety guides
    const [safetyGuides] = await pool.query(
      `SELECT id, title, description, guide_content, pdf_url
       FROM women_safety_guides
       ORDER BY created_at DESC`
    );

    // Get emergency contacts
    const [emergencyContacts] = await pool.query(
      `SELECT id, contact_type, contact_name, phone_number, description, available_24_7
       FROM women_emergency_contacts
       ORDER BY available_24_7 DESC, contact_type ASC`
    );

    res.json({
      schemes,
      mentors,
      successStories,
      communityCount: communityCount.count || 0,
      safetyGuides,
      emergencyContacts,
    });
  } catch (err) {
    next(err);
  }
}

async function applyForWomenScheme(req, res, next) {
  try {
    const userId = req.user.id;
    const { schemeId } = req.params;
    const {
      business_description,
      current_income,
      business_years,
      employees_count,
      funding_purpose,
      additional_notes,
    } = req.body;

    // Check gender first
    const [[profile]] = await pool.query(
      "SELECT gender FROM vendor_profiles WHERE user_id = ?",
      [userId]
    );

    if (!profile || profile.gender.toLowerCase() !== 'female') {
      throw new ApiError(403, "This feature is not applicable for you, please contact the authority.");
    }

    // Check if already applied
    const [[existing]] = await pool.query(
      "SELECT id FROM women_scheme_applications WHERE user_id = ? AND scheme_id = ?",
      [userId, schemeId]
    );

    if (existing) {
      throw new ApiError(400, "You have already applied for this scheme");
    }

    const applicationRef = `WS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const [result] = await pool.query(
      `INSERT INTO women_scheme_applications 
       (user_id, scheme_id, application_ref, status, business_description, current_income, 
        business_years, employees_count, funding_purpose, additional_notes)
       VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        schemeId,
        applicationRef,
        business_description || null,
        current_income || null,
        business_years || null,
        employees_count || null,
        funding_purpose || null,
        additional_notes || null,
      ]
    );

    res.status(201).json({
      message: "Scheme application submitted successfully",
      application_ref: applicationRef,
      application_id: result.insertId,
    });
  } catch (err) {
    next(err);
  }
}

async function connectWithMentor(req, res, next) {
  try {
    const userId = req.user.id;
    const { mentorId } = req.params;

    // Check gender first
    const [[profile]] = await pool.query(
      "SELECT gender FROM vendor_profiles WHERE user_id = ?",
      [userId]
    );

    if (!profile || profile.gender.toLowerCase() !== 'female') {
      throw new ApiError(403, "This feature is not applicable for you, please contact the authority.");
    }

    // Check if already connected
    const [[existing]] = await pool.query(
      "SELECT id FROM women_mentor_connections WHERE user_id = ? AND mentor_id = ?",
      [userId, mentorId]
    );

    if (existing) {
      throw new ApiError(400, "You have already requested to connect with this mentor");
    }

    const [result] = await pool.query(
      `INSERT INTO women_mentor_connections (user_id, mentor_id, status)
       VALUES (?, ?, 'requested')`,
      [userId, mentorId]
    );

    res.status(201).json({
      message: "Mentor connection request sent successfully",
      connection_id: result.insertId,
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
  hideNotification,
  deleteNotification,
  createComplaint,
  listComplaints,
  getComplaintDetails,
  addComplaintFollowUp,
  closeComplaint,
  escalateComplaint,
  uploadComplaintEvidence,
  getMyLicense,
  changePassword,
  deactivateAccount,
  deleteAccount,
  downloadUserData,
  getActivityLog,
  getVendingZones,
  getMyZone,
  updateMyZone,
  getProfilePicture,
  getSettings,
  updateSettings,
  checkWomenSupportAccess,
  getWomenSupportData,
  applyForWomenScheme,
  connectWithMentor,
};