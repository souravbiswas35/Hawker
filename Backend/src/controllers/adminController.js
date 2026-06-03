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

      updateFields.license_number = licenseNumber;
      updateFields.issued_at = issuedAt;
      updateFields.expires_at = expiresAt;
      updateFields.qr_code_data = JSON.stringify({
        license_number: licenseNumber,
        vendor_name: application.business_name || "N/A",
        zone: application.desired_zone || "N/A",
        issued_at: issuedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      });
    }

    const [result] = await pool.query(
      `UPDATE license_applications
       SET status = ?, admin_remarks = ?, reviewed_by = ?, reviewed_at = ?,
           license_number = ?,
           issued_at = ?,
           expires_at = ?,
           qr_code_data = ?
       WHERE id = ?`,
      [
        updateFields.status,
        updateFields.admin_remarks,
        updateFields.reviewed_by,
        updateFields.reviewed_at,
        updateFields.license_number || null,
        updateFields.issued_at || null,
        updateFields.expires_at || null,
        updateFields.qr_code_data || null,
        applicationId,
      ],
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

    res.json({ message: "Application review submitted" });
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
};
