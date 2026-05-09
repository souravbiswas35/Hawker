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

    const [result] = await pool.query(
      `UPDATE license_applications
       SET status = ?, admin_remarks = ?, reviewed_by = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [status, remarks || null, req.user.id, applicationId],
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
