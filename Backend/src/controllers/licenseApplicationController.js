const pool = require("../config/db");
const ApiError = require("../utils/apiError");

function buildTrackingNumber() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `LIC-${timestamp}-${random}`;
}

// Get all license types
async function getLicenseTypes(req, res, next) {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM license_types WHERE is_active = 1 ORDER BY duration_days"
    );
    res.json({ licenseTypes: rows });
  } catch (err) {
    next(err);
  }
}

// Get all vending zones
async function getVendingZones(req, res, next) {
  try {
    const { area, type } = req.query;
    let query = "SELECT * FROM vending_zones WHERE is_active = 1";
    const params = [];

    if (area) {
      query += " AND area = ?";
      params.push(area);
    }

    if (type) {
      query += " AND zone_type = ?";
      params.push(type);
    }

    query += " ORDER BY name";

    const [rows] = await pool.query(query, params);
    res.json({ zones: rows });
  } catch (err) {
    next(err);
  }
}

// Create new application (Step 1)
async function createApplication(req, res, next) {
  try {
    const userId = req.user.id;
    const { licenseTypeId } = req.body;

    if (!licenseTypeId) {
      throw new ApiError(400, "License type ID is required");
    }

    // Check if user has complete profile
    const [[profile]] = await pool.query(
      "SELECT id FROM vendor_profiles WHERE user_id = ?",
      [userId]
    );
    if (!profile) {
      throw new ApiError(400, "Please complete your vendor profile first");
    }

    const trackingNumber = buildTrackingNumber();

    const [result] = await pool.query(
      `INSERT INTO license_applications 
      (tracking_number, user_id, license_type_id, current_step, completed_steps, status)
      VALUES (?, ?, ?, 1, JSON_ARRAY('license_type'), 'draft')`,
      [trackingNumber, userId, licenseTypeId]
    );

    // Initialize step progress
    await pool.query(
      `INSERT INTO application_step_progress 
      (application_id, step_number, step_status, started_at)
      VALUES (?, 1, 'completed', NOW())`,
      [result.insertId]
    );

    await pool.query(
      `INSERT INTO application_step_progress 
      (application_id, step_number, step_status, started_at)
      VALUES (?, 2, 'in_progress', NOW())`,
      [result.insertId]
    );

    res.status(201).json({
      message: "Application started successfully",
      applicationId: result.insertId,
      trackingNumber,
      currentStep: 2
    });
  } catch (err) {
    next(err);
  }
}

// Update application step
async function updateApplicationStep(req, res, next) {
  try {
    const userId = req.user.id;
    const { applicationId } = req.params;
    const { step, data } = req.body;

    // Verify application belongs to user
    const [[application]] = await pool.query(
      "SELECT * FROM license_applications WHERE id = ? AND user_id = ?",
      [applicationId, userId]
    );

    if (!application) {
      throw new ApiError(404, "Application not found");
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update step-specific data
      switch (step) {
        case 2: // Zone Selection
          await connection.query(
            `UPDATE license_applications 
            SET primary_zone_id = ?, alternate_zone_id = ?, current_step = 3,
                completed_steps = JSON_ARRAY_APPEND(completed_steps, '$', 'zone_selection')
            WHERE id = ?`,
            [data.primaryZoneId, data.alternateZoneId, applicationId]
          );
          break;

        case 3: // Business Details
          await connection.query(
            `UPDATE license_applications 
            SET business_details = ?, current_step = 4,
                completed_steps = JSON_ARRAY_APPEND(completed_steps, '$', 'business_details')
            WHERE id = ?`,
            [JSON.stringify(data), applicationId]
          );
          break;

        case 4: // Document Verification
          await connection.query(
            `UPDATE license_applications 
            SET document_verification = ?, current_step = 5,
                completed_steps = JSON_ARRAY_APPEND(completed_steps, '$', 'document_verification')
            WHERE id = ?`,
            [JSON.stringify(data), applicationId]
          );
          break;

        case 5: // Fee Payment
          await connection.query(
            `UPDATE license_applications 
            SET payment_details = ?, current_step = 6,
                completed_steps = JSON_ARRAY_APPEND(completed_steps, '$', 'fee_payment')
            WHERE id = ?`,
            [JSON.stringify(data), applicationId]
          );

          // Create payment record if payment is made
          if (data.paymentMethod !== 'pay_later') {
            await connection.query(
              `INSERT INTO application_payments 
              (application_id, payment_method, amount, payment_status, paid_at)
              VALUES (?, ?, ?, 'completed', NOW())`,
              [applicationId, data.paymentMethod, data.totalAmount]
            );
          }
          break;

        case 6: // Final Submission
          await connection.query(
            `UPDATE license_applications 
            SET final_submission = ?, status = 'submitted', current_step = 6,
                completed_steps = JSON_ARRAY_APPEND(completed_steps, '$', 'final_submission')
            WHERE id = ?`,
            [JSON.stringify(data), applicationId]
          );
          break;
      }

      // Update step progress
      if (step < 6) {
        await connection.query(
          `UPDATE application_step_progress 
          SET step_status = 'completed', completed_at = NOW()
          WHERE application_id = ? AND step_number = ?`,
          [applicationId, step]
        );

        await connection.query(
          `INSERT INTO application_step_progress 
          (application_id, step_number, step_status, started_at)
          VALUES (?, ?, 'in_progress', NOW())
          ON DUPLICATE KEY UPDATE step_status = 'in_progress', started_at = NOW()`,
          [applicationId, step + 1]
        );
      }

      await connection.commit();

      res.json({
        message: `Step ${step} updated successfully`,
        currentStep: step < 6 ? step + 1 : 6
      });
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

// Get application details
async function getApplication(req, res, next) {
  try {
    const userId = req.user.id;
    const { applicationId } = req.params;

    const [[application]] = await pool.query(
      `SELECT la.*, lt.name as license_type_name, lt.duration_days, lt.base_price, 
              lt.security_deposit, lt.processing_fee,
              pz.name as primary_zone_name, pz.zone_code as primary_zone_code,
              az.name as alternate_zone_name, az.zone_code as alternate_zone_code
       FROM license_applications la
       LEFT JOIN license_types lt ON la.license_type_id = lt.id
       LEFT JOIN vending_zones pz ON la.primary_zone_id = pz.id
       LEFT JOIN vending_zones az ON la.alternate_zone_id = az.id
       WHERE la.id = ? AND la.user_id = ?`,
      [applicationId, userId]
    );

    if (!application) {
      throw new ApiError(404, "Application not found");
    }

    // Get step progress
    const [steps] = await pool.query(
      "SELECT * FROM application_step_progress WHERE application_id = ? ORDER BY step_number",
      [applicationId]
    );

    // Get payment records
    const [payments] = await pool.query(
      "SELECT * FROM application_payments WHERE application_id = ?",
      [applicationId]
    );

    res.json({
      application,
      steps,
      payments
    });
  } catch (err) {
    next(err);
  }
}

// Get user's applications
async function getUserApplications(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT la.id, la.tracking_number, la.status, la.current_step, la.submitted_at, la.reviewed_at,
              lt.name as license_type_name, pz.name as primary_zone_name
       FROM license_applications la
       LEFT JOIN license_types lt ON la.license_type_id = lt.id
       LEFT JOIN vending_zones pz ON la.primary_zone_id = pz.id
       WHERE la.user_id = ?
       ORDER BY la.created_at DESC`,
      [req.user.id]
    );

    res.json({ applications: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getLicenseTypes,
  getVendingZones,
  createApplication,
  updateApplicationStep,
  getApplication,
  getUserApplications
};
