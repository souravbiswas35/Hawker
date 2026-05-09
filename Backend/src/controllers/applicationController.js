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
    const { desiredZone, stallType, businessCategory, notes } = req.body;

    if (!desiredZone || !stallType || !businessCategory) {
      throw new ApiError(
        400,
        "desiredZone, stallType, and businessCategory are required",
      );
    }

    const [[profile]] = await pool.query(
      "SELECT id FROM vendor_profiles WHERE user_id = ?",
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

    const [result] = await pool.query(
      `INSERT INTO license_applications
      (application_ref, user_id, desired_zone, stall_type, business_category, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, 'submitted')`,
      [
        applicationRef,
        userId,
        desiredZone,
        stallType,
        businessCategory,
        notes || null,
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
