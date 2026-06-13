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
        (SELECT COALESCE(SUM(vp.final_amount), 0)
           FROM vendor_payments vp
           WHERE vp.status = 'completed'
             AND MONTH(vp.payment_date) = MONTH(NOW())
             AND YEAR(vp.payment_date) = YEAR(NOW())) AS revenue_this_month,
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
      `SELECT la.id, la.application_ref, la.status, la.submitted_at, la.payment_status,
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

    // Get payment statistics
    const [[paymentStats]] = await pool.query(
      `SELECT 
        COUNT(*) as total_payments,
        COALESCE(SUM(final_amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN final_amount ELSE 0 END), 0) as collected_amount,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN final_amount ELSE 0 END), 0) as pending_amount,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
       FROM vendor_payments`
    );

    // Get recent payments
    const [recentPayments] = await pool.query(
      `SELECT vp.id, vp.transaction_id, vp.amount, vp.final_amount, vp.status, vp.payment_date,
              pt.name as payment_type, pm.display_name as payment_method,
              u.email, vp2.first_name, vp2.last_name
       FROM vendor_payments vp
       JOIN payment_types pt ON vp.payment_type_id = pt.id
       JOIN payment_methods pm ON vp.payment_method_id = pm.id
       JOIN users u ON u.id = vp.user_id
       LEFT JOIN vendor_profiles vp2 ON vp2.user_id = vp.user_id
       ORDER BY vp.payment_date DESC
       LIMIT 8`
    );

    res.json({
      stats: counts,
      recentApplications: recentApps,
      recentActivity,
      paymentStats: paymentStats || { total_payments: 0, total_revenue: 0, collected_amount: 0, pending_amount: 0, pending_count: 0 },
      recentPayments,
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
                        la.document_verification_status, la.admin_review_status, la.inspection_status,
                        la.city_corp_review_status, la.inspection_assigned_to, la.inspection_date,
                        u.email, vp.first_name, vp.last_name, vp.business_name
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

// Women Vendor Support Admin Functions
async function getWomenSchemeApplications(req, res, next) {
  try {
    const { status } = req.query;
    let query = `
      SELECT wsa.id, wsa.application_ref, wsa.status, wsa.submitted_at, wsa.reviewed_at,
             wsa.business_description, wsa.current_income, wsa.business_years,
             wsa.employees_count, wsa.funding_purpose, wsa.additional_notes,
             wsa.remarks,
             ws.name as scheme_name, ws.amount as scheme_amount, ws.description as scheme_description,
             u.email, vp.first_name, vp.last_name, vp.business_name, vp.business_type, vp.phone
      FROM women_scheme_applications wsa
      JOIN women_schemes_subsidies ws ON ws.id = wsa.scheme_id
      JOIN users u ON u.id = wsa.user_id
      LEFT JOIN vendor_profiles vp ON vp.user_id = wsa.user_id
    `;
    const params = [];

    if (status) {
      query += " WHERE wsa.status = ?";
      params.push(status);
    }

    query += " ORDER BY wsa.submitted_at DESC";

    const [applications] = await pool.query(query, params);
    res.json({ applications });
  } catch (err) {
    next(err);
  }
}

async function getWomenSchemeApplicationDetails(req, res, next) {
  try {
    const { id } = req.params;

    const [[application]] = await pool.query(
      `SELECT wsa.id, wsa.application_ref, wsa.status, wsa.submitted_at, wsa.reviewed_at,
              wsa.business_description, wsa.current_income, wsa.business_years,
              wsa.employees_count, wsa.funding_purpose, wsa.documents_attached, wsa.additional_notes,
              wsa.remarks,
              ws.name as scheme_name, ws.amount as scheme_amount, ws.description as scheme_description,
              ws.eligibility_criteria, ws.deadline,
              u.email, u.id as user_id,
              vp.first_name, vp.last_name, vp.business_name, vp.business_type, vp.phone,
              vp.address, vp.vending_zone
       FROM women_scheme_applications wsa
       JOIN women_schemes_subsidies ws ON ws.id = wsa.scheme_id
       JOIN users u ON u.id = wsa.user_id
       LEFT JOIN vendor_profiles vp ON vp.user_id = wsa.user_id
       WHERE wsa.id = ?`,
      [id]
    );

    if (!application) {
      throw new ApiError(404, "Scheme application not found");
    }

    res.json({ application });
  } catch (err) {
    next(err);
  }
}

async function reviewWomenSchemeApplication(req, res, next) {
  try {
    const { id } = req.params;
    const { action, remarks } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      throw new ApiError(400, "Action must be 'approve' or 'reject'");
    }

    const [[application]] = await pool.query(
      "SELECT user_id, scheme_id FROM women_scheme_applications WHERE id = ?",
      [id]
    );

    if (!application) {
      throw new ApiError(404, "Scheme application not found");
    }

    await pool.query(
      `UPDATE women_scheme_applications
       SET status = ?, remarks = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [action === 'approve' ? 'approved' : 'rejected', remarks || null, id]
    );

    // Create notification for vendor
    const notificationTitle = action === 'approve' 
      ? "Scheme Application Approved" 
      : "Scheme Application Rejected";
    const notificationMessage = action === 'approve'
      ? "Your scheme application has been approved. You will receive further instructions."
      : `Your scheme application has been rejected. Remarks: ${remarks || 'No remarks provided'}`;

    await pool.query(
      `INSERT INTO vendor_notifications (user_id, category, title, message, link)
       VALUES (?, 'Scheme updates', ?, ?, '/vendor/women-support')`,
      [application.user_id, notificationTitle, notificationMessage]
    );

    res.json({
      message: `Scheme application ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
    });
  } catch (err) {
    next(err);
  }
}

async function getWomenMentorshipApplications(req, res, next) {
  try {
    const { status } = req.query;
    let query = `
      SELECT wmc.id, wmc.status, wmc.requested_at, wmc.accepted_at, wmc.completed_at, wmc.remarks,
             wm.name as mentor_name, wm.expertise, wm.experience_years, wm.contact_email,
             u.email, vp.first_name, vp.last_name, vp.business_name, vp.business_type
      FROM women_mentor_connections wmc
      JOIN women_mentors wm ON wm.id = wmc.mentor_id
      JOIN users u ON u.id = wmc.user_id
      LEFT JOIN vendor_profiles vp ON vp.user_id = wmc.user_id
    `;
    const params = [];

    if (status) {
      query += " WHERE wmc.status = ?";
      params.push(status);
    }

    query += " ORDER BY wmc.requested_at DESC";

    const [applications] = await pool.query(query, params);
    res.json({ applications });
  } catch (err) {
    next(err);
  }
}

async function reviewWomenMentorshipApplication(req, res, next) {
  try {
    const { id } = req.params;
    const { action, remarks } = req.body;

    if (!action || !['accept', 'reject', 'complete'].includes(action)) {
      throw new ApiError(400, "Action must be 'accept', 'reject', or 'complete'");
    }

    const [[application]] = await pool.query(
      "SELECT user_id FROM women_mentor_connections WHERE id = ?",
      [id]
    );

    if (!application) {
      throw new ApiError(404, "Mentorship application not found");
    }

    const statusMap = {
      'accept': 'accepted',
      'reject': 'rejected',
      'complete': 'completed'
    };

    const updateFields = {
      status: statusMap[action],
      remarks: remarks || null
    };

    if (action === 'accept') {
      updateFields.accepted_at = 'NOW()';
    } else if (action === 'complete') {
      updateFields.completed_at = 'NOW()';
    }

    const setClause = Object.entries(updateFields)
      .map(([key, value]) => `${key} = ${value === 'NOW()' ? 'NOW()' : '?'}`)
      .join(', ');
    
    const values = Object.values(updateFields).filter(v => v !== 'NOW()');
    values.push(id);

    await pool.query(
      `UPDATE women_mentor_connections SET ${setClause} WHERE id = ?`,
      values
    );

    // Create notification for vendor
    const notificationTitle = action === 'accept'
      ? "Mentorship Request Accepted"
      : action === 'reject'
      ? "Mentorship Request Rejected"
      : "Mentorship Program Completed";
    const notificationMessage = action === 'accept'
      ? "Your mentorship request has been accepted. You will be contacted by your mentor soon."
      : action === 'reject'
      ? `Your mentorship request has been rejected. Remarks: ${remarks || 'No remarks provided'}`
      : "Your mentorship program has been completed successfully.";

    await pool.query(
      `INSERT INTO vendor_notifications (user_id, category, title, message, link)
       VALUES (?, 'Mentorship updates', ?, ?, '/vendor/women-support')`,
      [application.user_id, notificationTitle, notificationMessage]
    );

    res.json({
      message: `Mentorship application ${action === 'complete' ? 'marked as completed' : action + 'ed'} successfully`,
    });
  } catch (err) {
    next(err);
  }
}

// Multi-step approval workflow functions

// Get available inspectors
async function getInspectors(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT ip.id, ip.user_id, ip.employee_id, ip.phone, ip.assigned_zones, ip.is_active,
              u.email
       FROM inspector_profiles ip
       JOIN users u ON u.id = ip.user_id
       WHERE ip.is_active = 1
       ORDER BY ip.employee_id`
    );

    res.json({ inspectors: rows });
  } catch (err) {
    next(err);
  }
}

// Document verification step
async function verifyDocuments(req, res, next) {
  try {
    const applicationId = Number(req.params.id);
    const { status, remarks } = req.body;

    const allowed = ['approved', 'rejected'];
    if (!allowed.includes(status)) {
      throw new ApiError(400, "Invalid status. Use approved or rejected");
    }

    const [[application]] = await pool.query(
      "SELECT * FROM license_applications WHERE id = ?",
      [applicationId]
    );

    if (!application) {
      throw new ApiError(404, "Application not found");
    }

    await pool.query(
      `UPDATE license_applications
       SET document_verification_status = ?,
           document_verified_by = ?,
           document_verified_at = NOW(),
           document_verification_remarks = ?
       WHERE id = ?`,
      [status, req.user.id, remarks || null, applicationId]
    );

    // Add audit log
    await pool.query(
      `INSERT INTO application_audit_logs (application_id, action_by, action_type, comments)
       VALUES (?, ?, ?, ?)`,
      [applicationId, req.user.id, `document_${status}`, remarks || `Documents ${status}`]
    );

    // Create notification for vendor
    const notificationTitle = status === 'approved'
      ? `Documents Verified for ${application.application_ref}`
      : `Documents Rejected for ${application.application_ref}`;
    const notificationMessage = status === 'approved'
      ? "Your submitted documents have been verified and approved. Your application is now under admin review."
      : `Your submitted documents have been rejected. ${remarks ? `Reason: ${remarks}` : 'Please contact support for more information.'}`;

    await pool.query(
      `INSERT INTO vendor_notifications (user_id, category, title, message, link, action_type, related_application_id, admin_remarks)
       VALUES (?, 'License updates', ?, ?, CONCAT('/vendor/track/', ?), ?, ?, ?)`,
      [
        application.user_id,
        notificationTitle,
        notificationMessage,
        applicationId,
        status === 'approved' ? 'document_approved' : 'document_rejected',
        applicationId,
        remarks || null
      ]
    );

    res.json({ message: `Documents ${status} successfully` });
  } catch (err) {
    next(err);
  }
}

// Admin review step with inspector assignment
async function adminReviewWithInspection(req, res, next) {
  try {
    const applicationId = Number(req.params.id);
    const { status, remarks, inspectorId, inspectionDate, inspectionZone } = req.body;

    const allowed = ['approved', 'rejected'];
    if (!allowed.includes(status)) {
      throw new ApiError(400, "Invalid status. Use approved or rejected");
    }

    const [[application]] = await pool.query(
      "SELECT * FROM license_applications WHERE id = ?",
      [applicationId]
    );

    if (!application) {
      throw new ApiError(404, "Application not found");
    }

    if (application.document_verification_status !== 'approved') {
      throw new ApiError(400, "Documents must be verified before admin review");
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      if (status === 'approved') {
        // Assign to inspector
        if (!inspectorId) {
          throw new ApiError(400, "Inspector ID is required when approving admin review");
        }

        // Verify inspector exists
        const [[inspector]] = await connection.query(
          "SELECT * FROM inspector_profiles WHERE user_id = ? AND is_active = 1",
          [inspectorId]
        );

        if (!inspector) {
          throw new ApiError(404, "Inspector not found or not active");
        }

        await connection.query(
          `UPDATE license_applications
           SET admin_review_status = 'approved',
               admin_reviewed_by = ?,
               admin_reviewed_at = NOW(),
               admin_review_remarks = ?,
               inspection_assigned_to = ?,
               inspection_assigned_by = ?,
               inspection_assigned_at = NOW(),
               inspection_date = ?,
               inspection_zone = ?,
               inspection_status = 'scheduled'
           WHERE id = ?`,
          [req.user.id, remarks || null, inspectorId, req.user.id, inspectionDate || null, inspectionZone || application.desired_zone, applicationId]
        );

        // Add audit log
        await connection.query(
          `INSERT INTO application_audit_logs (application_id, action_by, action_type, comments)
           VALUES (?, ?, ?, ?)`,
          [applicationId, req.user.id, 'admin_review_approved', `Admin review approved. Assigned to inspector ${inspector.employee_id}`]
        );

        // Create notification for inspector
        await connection.query(
          `INSERT INTO vendor_notifications (user_id, category, title, message, link, action_type, related_application_id)
           VALUES (?, 'Inspection notices', ?, ?, '/inspector/inspections', 'inspection_assigned', ?)`,
          [
            inspectorId,
            `New Inspection Assigned: ${application.application_ref}`,
            `You have been assigned to conduct a field inspection for application ${application.application_ref}. ${inspectionDate ? `Date: ${inspectionDate}` : ''}`,
            applicationId
          ]
        );

        // Create notification for vendor
        await connection.query(
          `INSERT INTO vendor_notifications (user_id, category, title, message, link, action_type, related_application_id)
           VALUES (?, 'Inspection notices', ?, ?, CONCAT('/vendor/track/', ?), 'inspection_scheduled', ?)`,
          [
            application.user_id,
            `Field Inspection Scheduled for ${application.application_ref}`,
            `Your application has passed admin review. A field inspection has been scheduled. ${inspectionDate ? `Date: ${inspectionDate}` : 'You will be notified of the date soon.'}`,
            applicationId,
            applicationId
          ]
        );
      } else {
        // Reject at admin review
        await connection.query(
          `UPDATE license_applications
           SET admin_review_status = 'rejected',
               admin_reviewed_by = ?,
               admin_reviewed_at = NOW(),
               admin_review_remarks = ?,
               status = 'rejected'
           WHERE id = ?`,
          [req.user.id, remarks || null, applicationId]
        );

        // Add audit log
        await connection.query(
          `INSERT INTO application_audit_logs (application_id, action_by, action_type, comments)
           VALUES (?, ?, ?, ?)`,
          [applicationId, req.user.id, 'admin_review_rejected', remarks || 'Admin review rejected']
        );

        // Create notification for vendor
        await connection.query(
          `INSERT INTO vendor_notifications (user_id, category, title, message, link, action_type, related_application_id, admin_remarks)
           VALUES (?, 'License updates', ?, ?, '/vendor/track/' || ?, 'admin_rejected', ?, ?)`,
          [
            application.user_id,
            `Application Rejected at Admin Review: ${application.application_ref}`,
            `Your application has been rejected during admin review. ${remarks ? `Reason: ${remarks}` : 'Please contact support for more information.'}`,
            applicationId,
            applicationId,
            remarks || null
          ]
        );
      }

      await connection.commit();
      res.json({ message: `Admin review ${status} successfully` });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
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
  getWomenSchemeApplications,
  getWomenSchemeApplicationDetails,
  reviewWomenSchemeApplication,
  getWomenMentorshipApplications,
  reviewWomenMentorshipApplication,
  getInspectors,
  verifyDocuments,
  adminReviewWithInspection,
};
