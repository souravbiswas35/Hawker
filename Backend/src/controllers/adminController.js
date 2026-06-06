const pool = require("../config/db");
const ApiError = require("../utils/apiError");

async function getDashboard(req, res, next) {
  try {
    const [[counts]] = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'vendor') AS total_vendors,
        (SELECT COUNT(*) FROM license_applications WHERE status IN ('submitted','under-review')) AS pending_applications,
        (SELECT COUNT(*) FROM license_applications WHERE status = 'approved') AS approved_licenses,
        (SELECT COUNT(*) FROM license_applications WHERE status = 'needs-info') AS needs_info_count,
        (SELECT COALESCE(SUM(ap.amount), 0)
           FROM application_payments ap
           WHERE ap.payment_status = 'completed'
             AND MONTH(ap.paid_at) = MONTH(NOW())
             AND YEAR(ap.paid_at) = YEAR(NOW())) AS revenue_this_month,
        (SELECT COUNT(*)
           FROM license_applications la
           JOIN license_types lt ON lt.id = la.license_type_id
           WHERE la.status = 'approved'
             AND la.reviewed_at IS NOT NULL
             AND DATE_ADD(la.reviewed_at, INTERVAL lt.duration_days DAY) < NOW()) AS expired_licenses,
        (SELECT COUNT(*) FROM vending_zones WHERE is_active = 1 AND available_spots > 0) AS available_zones,
        (SELECT COUNT(*) FROM vending_zones WHERE is_active = 1) AS total_zones`,
    );

    const [recentApps] = await pool.query(
      `SELECT la.id, la.application_ref, la.status, la.submitted_at,
              u.email, vp.first_name, vp.last_name
       FROM license_applications la
       JOIN users u ON u.id = la.user_id
       LEFT JOIN vendor_profiles vp ON vp.user_id = la.user_id
       ORDER BY la.submitted_at DESC
       LIMIT 10`,
    );

    const [recentActivity] = await pool.query(
      `SELECT aal.action_type, aal.comments, aal.created_at,
              la.application_ref,
              u.email, vp.first_name, vp.last_name
       FROM application_audit_logs aal
       JOIN license_applications la ON la.id = aal.application_id
       JOIN users u ON u.id = la.user_id
       LEFT JOIN vendor_profiles vp ON vp.user_id = la.user_id
       ORDER BY aal.created_at DESC
       LIMIT 8`,
    );

    res.json({
      stats: counts,
      recentApplications: recentApps,
      recentActivity,
    });
  } catch (err) {
    next(err);
  }
}

async function listVendors(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.email, u.is_email_verified, u.created_at,
              vp.first_name, vp.last_name, vp.phone, vp.business_name, vp.vending_zone
       FROM users u
       LEFT JOIN vendor_profiles vp ON vp.user_id = u.id
       WHERE u.role = 'vendor'
       ORDER BY u.created_at DESC`,
    );

    res.json({ vendors: rows });
  } catch (err) {
    next(err);
  }
}

async function listApplications(req, res, next) {
  try {
    const status = req.query.status;

    let query = `SELECT la.id, la.application_ref, la.status, la.desired_zone, la.stall_type,
                        la.business_category, la.admin_remarks, la.submitted_at, la.reviewed_at,
                        u.email, vp.business_name
                 FROM license_applications la
                 JOIN users u ON u.id = la.user_id
                 LEFT JOIN vendor_profiles vp ON vp.user_id = la.user_id`;

    const params = [];
    if (status) {
      query += " WHERE la.status = ?";
      params.push(status);
    }

    query += " ORDER BY la.submitted_at DESC";

    const [rows] = await pool.query(query, params);
    res.json({ applications: rows });
  } catch (err) {
    next(err);
  }
}

async function getApplicationDetails(req, res, next) {
  try {
    const applicationId = Number(req.params.id);

    const [[application]] = await pool.query(
      `SELECT la.*, u.email, vp.first_name, vp.last_name, vp.phone, vp.address,
              vp.business_name as profile_business_name, vp.business_type as profile_business_type,
              vp.vending_zone as profile_vending_zone,
              lt.name as license_type_name, lt.base_price, lt.security_deposit, lt.processing_fee,
              pz.name as primary_zone_name, pz2.name as alternate_zone_name
       FROM license_applications la
       JOIN users u ON u.id = la.user_id
       LEFT JOIN vendor_profiles vp ON vp.user_id = la.user_id
       LEFT JOIN license_types lt ON lt.id = la.license_type_id
       LEFT JOIN vending_zones pz ON pz.id = la.primary_zone_id
       LEFT JOIN vending_zones pz2 ON pz2.id = la.alternate_zone_id
       WHERE la.id = ?`,
      [applicationId],
    );

    if (!application) {
      throw new ApiError(404, "Application not found");
    }

    // Fill missing fields from vendor profile
    application.business_name = application.business_name || application.profile_business_name || "Not provided";
    application.business_category = application.business_category || application.profile_business_type || "General";
    application.stall_type = application.stall_type || "Standard";
    application.desired_zone = application.desired_zone || application.profile_vending_zone || application.primary_zone_name || "Not selected";

    res.json({ application });
  } catch (err) {
    next(err);
  }
}

async function reviewApplication(req, res, next) {
  try {
    const applicationId = Number(req.params.id);
    const { status, remarks } = req.body;

    const allowed = ["approved", "rejected", "needs-info"];
    if (!allowed.includes(status)) {
      throw new ApiError(
        400,
        "Invalid status. Use approved, rejected, or needs-info",
      );
    }

    // Get application details
    const [[application]] = await pool.query(
      `SELECT la.*, lt.duration_days
       FROM license_applications la
       LEFT JOIN license_types lt ON la.license_type_id = lt.id
       WHERE la.id = ?`,
      [applicationId]
    );

    if (!application) {
      throw new ApiError(404, "Application not found");
    }

    let updateFields = {
      status,
      admin_remarks: remarks || null,
      reviewed_by: req.user.id,
      reviewed_at: new Date(),
    };

    // Generate license details if approved
    if (status === "approved") {
      const ref = application.application_ref.startsWith('LIC-')
        ? application.application_ref
        : `LIC-${application.application_ref}`;
      const licenseNumber = `${ref}-${new Date().getFullYear()}`;
      const issuedAt = new Date();
      const expiresAt = new Date(issuedAt);
      expiresAt.setDate(expiresAt.getDate() + (application.duration_days || 365));

      // Fetch zone name if primary_zone_id is set
      let allocatedZone = application.desired_zone;
      if (application.primary_zone_id && !allocatedZone) {
        const [[zone]] = await pool.query(
          "SELECT name FROM vending_zones WHERE id = ?",
          [application.primary_zone_id]
        );
        if (zone) allocatedZone = zone.name;
      }

      // Extract goods_authorized from business_details JSON if available
      let goodsAuthorized = application.goods_authorized;
      if (!goodsAuthorized && application.business_details) {
        try {
          const businessDetails = typeof application.business_details === 'string'
            ? JSON.parse(application.business_details)
            : application.business_details;
          goodsAuthorized = businessDetails.goods_authorized || businessDetails.goods || application.business_category || "General";
        } catch (e) {
          goodsAuthorized = application.business_category || "General";
        }
      }

      updateFields.license_number = licenseNumber;
      updateFields.issued_at = issuedAt;
      updateFields.expires_at = expiresAt;
      updateFields.desired_zone = allocatedZone || application.desired_zone || "N/A";
      updateFields.goods_authorized = goodsAuthorized || application.business_category || "General";
      updateFields.qr_code_data = JSON.stringify({
        license_number: licenseNumber,
        vendor_name: application.business_name || "N/A",
        zone: allocatedZone || application.desired_zone || "N/A",
        issued_at: issuedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      });
    }

    // Build update query dynamically based on what fields are set
    const updateFieldsList = ['status = ?', 'admin_remarks = ?', 'reviewed_by = ?', 'reviewed_at = ?'];
    const queryParams = [
      updateFields.status,
      updateFields.admin_remarks,
      updateFields.reviewed_by,
      updateFields.reviewed_at,
    ];

    if (updateFields.license_number) {
      updateFieldsList.push('license_number = ?');
      queryParams.push(updateFields.license_number);
    }
    if (updateFields.issued_at) {
      updateFieldsList.push('issued_at = ?');
      queryParams.push(updateFields.issued_at);
    }
    if (updateFields.expires_at) {
      updateFieldsList.push('expires_at = ?');
      queryParams.push(updateFields.expires_at);
    }
    if (updateFields.qr_code_data) {
      updateFieldsList.push('qr_code_data = ?');
      queryParams.push(updateFields.qr_code_data);
    }
    if (updateFields.desired_zone) {
      updateFieldsList.push('desired_zone = ?');
      queryParams.push(updateFields.desired_zone);
    }
    if (updateFields.goods_authorized) {
      updateFieldsList.push('goods_authorized = ?');
      queryParams.push(updateFields.goods_authorized);
    }

    queryParams.push(applicationId);

    const [result] = await pool.query(
      `UPDATE license_applications
       SET ${updateFieldsList.join(', ')}
       WHERE id = ?`,
      queryParams,
    );

    if (result.affectedRows === 0) {
      throw new ApiError(404, "Application not found");
    }

    await pool.query(
      `INSERT INTO application_audit_logs (application_id, action_by, action_type, comments)
       VALUES (?, ?, ?, ?)`,
      [
        applicationId,
        req.user.id,
        status,
        remarks || `Application marked as ${status}`,
      ],
    );

    // Create notification for vendor based on admin action
    try {
      let notificationCategory = 'License updates';
      let notificationTitle = '';
      let notificationMessage = '';
      let actionType = '';
      let zoneOrArea = updateFields.desired_zone || application.desired_zone || 'N/A';

      if (status === 'approved') {
        actionType = 'approve';
        notificationTitle = `Application ${application.application_ref} Approved`;
        notificationMessage = `Your license application for ${zoneOrArea} has been approved. Your digital license is now ready to download.`;
      } else if (status === 'rejected') {
        actionType = 'reject';
        notificationTitle = `Application ${application.application_ref} Rejected`;
        notificationMessage = `Your license application for ${zoneOrArea} was rejected. ${remarks ? `Reason: ${remarks}` : 'Please contact support for more information.'}`;
      } else if (status === 'needs-info') {
        actionType = 'need_info';
        notificationTitle = `Application ${application.application_ref} Needs More Information`;
        notificationMessage = `Your license application for ${zoneOrArea} requires additional information. ${remarks ? `Details: ${remarks}` : 'Please check your application and provide the required documents.'}`;
      }

      console.log('Creating notification for user:', application.user_id, 'with action:', actionType);
      console.log('Notification title:', notificationTitle);
      console.log('Notification message:', notificationMessage);
      console.log('Zone/Area:', zoneOrArea);

      const [notifResult] = await pool.query(
        `INSERT INTO vendor_notifications (user_id, category, title, message, link, action_type, related_application_id, zone_or_area, admin_remarks, action_details)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          application.user_id,
          notificationCategory,
          notificationTitle,
          notificationMessage,
          `/vendor/applications`,
          actionType,
          applicationId,
          zoneOrArea,
          remarks || null,
          JSON.stringify({
            application_ref: application.application_ref,
            status: status,
            reviewed_by: req.user.id,
            reviewed_at: new Date().toISOString(),
          }),
        ],
      );
      console.log('Notification created successfully with ID:', notifResult.insertId);
    } catch (notifErr) {
      console.error('Failed to create notification (columns may not exist yet):', notifErr);
      console.error('Error code:', notifErr.code);
      console.error('Error message:', notifErr.message);
      console.error('Error stack:', notifErr.stack);
      // Don't fail the review process if notification creation fails
    }

    res.json({ message: "Application review submitted" });
  } catch (err) {
    next(err);
  }
}

async function listAllNotifications(req, res, next) {
  try {
    const { userId, category, status } = req.query;
    const conditions = [];
    const params = [];

    if (userId) {
      conditions.push("vn.user_id = ?");
      params.push(userId);
    }

    if (category && category !== "All") {
      conditions.push("vn.category = ?");
      params.push(category);
    }

    if (status === "read") {
      conditions.push("vn.is_read = 1");
    } else if (status === "unread") {
      conditions.push("vn.is_read = 0");
    } else if (status === "hidden") {
      conditions.push("vn.is_hidden = 1");
    } else if (status === "visible") {
      conditions.push("vn.is_hidden = 0");
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await pool.query(
      `SELECT vn.id, vn.user_id, vn.category, vn.title, vn.message, vn.link,
              vn.is_read, vn.is_hidden, vn.created_at, vn.updated_at,
              u.email, vp.first_name, vp.last_name, vp.business_name
       FROM vendor_notifications vn
       JOIN users u ON u.id = vn.user_id
       LEFT JOIN vendor_profiles vp ON vp.user_id = vn.user_id
       ${whereClause}
       ORDER BY vn.created_at DESC`,
      params,
    );

    res.json({ notifications: rows });
  } catch (err) {
    next(err);
  }
}

async function createNotification(req, res, next) {
  try {
    const { userId, category, title, message, link } = req.body;

    if (!userId || !category || !title || !message) {
      throw new ApiError(400, "userId, category, title, and message are required");
    }

    const allowedCategories = [
      'License updates',
      'Payment reminders',
      'Renewal alerts',
      'Zone changes',
      'Inspection notices',
      'System announcements'
    ];

    if (!allowedCategories.includes(category)) {
      throw new ApiError(400, "Invalid category");
    }

    const [result] = await pool.query(
      `INSERT INTO vendor_notifications (user_id, category, title, message, link)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, category, title, message, link || null],
    );

    res.status(201).json({
      message: "Notification created successfully",
      notificationId: result.insertId,
    });
  } catch (err) {
    next(err);
  }
}

async function deleteNotificationAdmin(req, res, next) {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      `DELETE FROM vendor_notifications WHERE id = ?`,
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted successfully" });
  } catch (err) {
    next(err);
  }
}

async function createSystemNotification(req, res, next) {
  try {
    const { userId, type, title, message, link, relatedData } = req.body;

    if (!userId || !type || !title || !message) {
      throw new ApiError(400, "userId, type, title, and message are required");
    }

    const actionTypes = ['approve', 'reject', 'need_info', 'system', 'payment', 'renewal', 'zone_change', 'inspection'];
    if (!actionTypes.includes(type)) {
      throw new ApiError(400, "Invalid notification type");
    }

    const categories = {
      'approve': 'License updates',
      'reject': 'License updates',
      'need_info': 'License updates',
      'system': 'System announcements',
      'payment': 'Payment reminders',
      'renewal': 'Renewal alerts',
      'zone_change': 'Zone changes',
      'inspection': 'Inspection notices'
    };

    const [result] = await pool.query(
      `INSERT INTO vendor_notifications (user_id, category, title, message, link, action_type, action_details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        categories[type] || 'System announcements',
        title,
        message,
        link || null,
        type,
        relatedData ? JSON.stringify(relatedData) : null,
      ],
    );

    res.status(201).json({
      message: "System notification created successfully",
      notificationId: result.insertId,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboard,
  listVendors,
  listApplications,
  getApplicationDetails,
  reviewApplication,
  listAllNotifications,
  createNotification,
  deleteNotificationAdmin,
  createSystemNotification,
};
