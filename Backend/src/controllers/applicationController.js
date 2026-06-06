const pool = require("../config/db");
const ApiError = require("../utils/apiError");

function buildRef() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(100 + Math.random() * 900);
  return `HWK-${timestamp}-${random}`;
}

async function createApplication(req, res, next) {
  try {
    const userId = req.user.id;
    const { desiredZone, stallType, businessCategory, notes, primaryZoneId, alternateZoneId } = req.body;

    // Get vendor profile data
    const [[profile]] = await pool.query(
      "SELECT id, business_name, business_type, vending_zone, first_name, last_name, phone, address FROM vendor_profiles WHERE user_id = ?",
      [userId],
    );
    if (!profile) {
      throw new ApiError(
        400,
        "Please complete your vendor profile before applying",
      );
    }

    const [docs] = await pool.query(
      "SELECT id FROM vendor_documents WHERE user_id = ? LIMIT 1",
      [userId],
    );
    if (docs.length === 0) {
      throw new ApiError(
        400,
        "Please upload required documents before applying",
      );
    }

    const applicationRef = buildRef();

    // Use profile data if not provided in request
    const finalDesiredZone = desiredZone || profile.vending_zone;
    const finalBusinessCategory = businessCategory || profile.business_type || "General";
    const finalStallType = stallType || "Standard";
    const finalBusinessName = profile.business_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim();

    const [result] = await pool.query(
      `INSERT INTO license_applications
      (application_ref, user_id, desired_zone, stall_type, business_category, business_name, notes, status, primary_zone_id, alternate_zone_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?)`,
      [
        applicationRef,
        userId,
        finalDesiredZone,
        finalStallType,
        finalBusinessCategory,
        finalBusinessName,
        notes || null,
        primaryZoneId || null,
        alternateZoneId || null,
      ],
    );

    await pool.query(
      `INSERT INTO application_audit_logs (application_id, action_by, action_type, comments)
       VALUES (?, ?, 'submitted', 'Application submitted by vendor')`,
      [result.insertId, userId],
    );

    res.status(201).json({
      message: "License application submitted successfully",
      applicationRef,
    });
  } catch (err) {
    next(err);
  }
}

async function listMyApplications(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT id, application_ref, desired_zone, stall_type, business_category,
              status, admin_remarks, submitted_at, reviewed_at
       FROM license_applications
       WHERE user_id = ?
       ORDER BY submitted_at DESC`,
      [req.user.id],
    );

    res.json({ applications: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createApplication,
  listMyApplications,
};
