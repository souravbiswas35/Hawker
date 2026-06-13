const pool = require("../config/db");
const ApiError = require("../utils/apiError");

// Get inspector dashboard
async function getInspectorDashboard(req, res, next) {
  try {
    const inspectorId = req.user.id;

    const [[counts]] = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM license_applications WHERE inspection_assigned_to = ? AND inspection_status = 'scheduled') AS scheduled_inspections,
        (SELECT COUNT(*) FROM license_applications WHERE inspection_assigned_to = ? AND inspection_status = 'pending') AS pending_inspections,
        (SELECT COUNT(*) FROM license_applications WHERE inspection_assigned_to = ? AND inspection_status = 'conducted') AS conducted_inspections,
        (SELECT COUNT(*) FROM license_applications WHERE inspection_assigned_to = ? AND inspection_status = 'passed') AS passed_inspections,
        (SELECT COUNT(*) FROM license_applications WHERE inspection_assigned_to = ? AND inspection_status = 'failed') AS failed_inspections`,
      [inspectorId, inspectorId, inspectorId, inspectorId, inspectorId]
    );

    const [scheduledInspections] = await pool.query(
      `SELECT la.id, la.application_ref, la.inspection_date, la.inspection_zone,
              u.email, vp.first_name, vp.last_name, vp.business_name,
              lt.name as license_type_name, pz.name as primary_zone_name
       FROM license_applications la
       JOIN users u ON u.id = la.user_id
       LEFT JOIN vendor_profiles vp ON vp.user_id = la.user_id
       LEFT JOIN license_types lt ON lt.id = la.license_type_id
       LEFT JOIN vending_zones pz ON pz.id = la.primary_zone_id
       WHERE la.inspection_assigned_to = ? AND la.inspection_status = 'scheduled'
       ORDER BY la.inspection_date ASC
       LIMIT 10`,
      [inspectorId]
    );

    const [recentActivity] = await pool.query(
      `SELECT la.application_ref, la.inspection_status, la.inspection_conducted_at,
              u.email, vp.first_name, vp.last_name
       FROM license_applications la
       JOIN users u ON u.id = la.user_id
       LEFT JOIN vendor_profiles vp ON vp.user_id = la.user_id
       WHERE la.inspection_assigned_to = ? AND la.inspection_status IN ('conducted', 'passed', 'failed')
       ORDER BY la.inspection_conducted_at DESC
       LIMIT 8`,
      [inspectorId]
    );

    res.json({
      stats: counts,
      scheduledInspections,
      recentActivity,
    });
  } catch (err) {
    next(err);
  }
}

// Get assigned inspections
async function getAssignedInspections(req, res, next) {
  try {
    const inspectorId = req.user.id;
    const { status } = req.query;

    let query = `SELECT la.id, la.application_ref, la.inspection_date, la.inspection_zone,
                    la.inspection_status, la.inspection_remarks, la.inspection_assigned_at,
                    u.email, vp.first_name, vp.last_name, vp.business_name, vp.phone,
                    lt.name as license_type_name, pz.name as primary_zone_name,
                    la.admin_review_remarks
             FROM license_applications la
             JOIN users u ON u.id = la.user_id
             LEFT JOIN vendor_profiles vp ON vp.user_id = la.user_id
             LEFT JOIN license_types lt ON lt.id = la.license_type_id
             LEFT JOIN vending_zones pz ON pz.id = la.primary_zone_id
             WHERE la.inspection_assigned_to = ?`;

    const params = [inspectorId];

    if (status) {
      query += " AND la.inspection_status = ?";
      params.push(status);
    }

    query += " ORDER BY la.inspection_date DESC";

    const [rows] = await pool.query(query, params);
    res.json({ inspections: rows });
  } catch (err) {
    next(err);
  }
}

// Get inspection details
async function getInspectionDetails(req, res, next) {
  try {
    const inspectionId = Number(req.params.id);
    const inspectorId = req.user.id;

    const [[inspection]] = await pool.query(
      `SELECT la.*, u.email, vp.first_name, vp.last_name, vp.phone, vp.address,
              vp.business_name as profile_business_name,
              lt.name as license_type_name, lt.base_price, lt.security_deposit, lt.processing_fee,
              pz.name as primary_zone_name, pz.zone_code as primary_zone_code,
              pz.location as primary_zone_location,
              az.name as alternate_zone_name,
              ip.employee_id as inspector_employee_id
       FROM license_applications la
       JOIN users u ON u.id = la.user_id
       LEFT JOIN vendor_profiles vp ON vp.user_id = la.user_id
       LEFT JOIN license_types lt ON lt.id = la.license_type_id
       LEFT JOIN vending_zones pz ON pz.id = la.primary_zone_id
       LEFT JOIN vending_zones az ON az.id = la.alternate_zone_id
       LEFT JOIN inspector_profiles ip ON ip.user_id = la.inspection_assigned_to
       WHERE la.id = ? AND la.inspection_assigned_to = ?`,
      [inspectionId, inspectorId]
    );

    if (!inspection) {
      throw new ApiError(404, "Inspection not found or not assigned to you");
    }

    // Get business details
    let businessDetails = {};
    if (inspection.business_details) {
      try {
        businessDetails = typeof inspection.business_details === 'string'
          ? JSON.parse(inspection.business_details)
          : inspection.business_details;
      } catch (e) {
        businessDetails = {};
      }
    }

    inspection.business_details_parsed = businessDetails;
    inspection.business_name = inspection.business_name || inspection.profile_business_name || "Not provided";

    res.json({ inspection });
  } catch (err) {
    next(err);
  }
}

// Conduct inspection
async function conductInspection(req, res, next) {
  try {
    const inspectionId = Number(req.params.id);
    const inspectorId = req.user.id;
    const { status, remarks, inspection_photos, compliance_score } = req.body;

    const allowed = ['passed', 'failed'];
    if (!allowed.includes(status)) {
      throw new ApiError(400, "Invalid status. Use passed or failed");
    }

    // Verify inspection is assigned to this inspector
    const [[inspection]] = await pool.query(
      "SELECT * FROM license_applications WHERE id = ? AND inspection_assigned_to = ?",
      [inspectionId, inspectorId]
    );

    if (!inspection) {
      throw new ApiError(404, "Inspection not found or not assigned to you");
    }

    if (inspection.inspection_status !== 'scheduled') {
      throw new ApiError(400, "Inspection must be scheduled before conducting");
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update inspection status to conducted
      await connection.query(
        `UPDATE license_applications
         SET inspection_status = 'conducted',
             inspection_conducted_at = NOW(),
             inspection_remarks = ?
         WHERE id = ?`,
        [remarks || null, inspectionId]
      );

      // Add audit log
      await connection.query(
        `INSERT INTO application_audit_logs (application_id, action_by, action_type, comments)
         VALUES (?, ?, ?, ?)`,
        [inspectionId, inspectorId, `inspection_${status}`, remarks || `Inspection marked as ${status}`]
      );

      // Create notification for vendor
      await connection.query(
        `INSERT INTO vendor_notifications (user_id, category, title, message, link, action_type, related_application_id)
         VALUES (?, 'Inspection notices', ?, ?, CONCAT('/vendor/track/', ?), 'inspection_conducted', ?)`,
        [
          inspection.user_id,
          `Inspection Conducted for ${inspection.application_ref}`,
          `Your field inspection has been conducted. ${status === 'passed' ? 'The inspector has marked it as passed. It will be reviewed by the City Corporation.' : 'The inspector has marked it as failed. Please review the remarks.'}`,
          inspectionId,
          inspectionId
        ]
      );

      await connection.commit();
      res.json({ message: `Inspection ${status} successfully` });
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

// Pass inspection to city corporation admin
async function passToCityCorp(req, res, next) {
  try {
    const inspectionId = Number(req.params.id);
    const inspectorId = req.user.id;

    // Verify inspection is assigned to this inspector
    const [[inspection]] = await pool.query(
      "SELECT * FROM license_applications WHERE id = ? AND inspection_assigned_to = ?",
      [inspectionId, inspectorId]
    );

    if (!inspection) {
      throw new ApiError(404, "Inspection not found or not assigned to you");
    }

    if (inspection.inspection_status !== 'conducted') {
      throw new ApiError(400, "Inspection must be conducted before passing to city corporation");
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update inspection status to passed
      await connection.query(
        `UPDATE license_applications
         SET inspection_status = 'passed',
             city_corp_review_status = 'pending'
         WHERE id = ?`,
        [inspectionId]
      );

      // Add audit log
      await connection.query(
        `INSERT INTO application_audit_logs (application_id, action_by, action_type, comments)
         VALUES (?, ?, ?, ?)`,
        [inspectionId, inspectorId, 'passed_to_city_corp', 'Inspection passed to City Corporation for final review']
      );

      // Create notification for city corporation admin
      try {
        const [cityCorpAdmins] = await connection.query(
          "SELECT user_id FROM city_corp_admin_profiles WHERE is_active = 1"
        );

        for (const admin of cityCorpAdmins) {
          await connection.query(
            `INSERT INTO vendor_notifications (user_id, category, title, message, link, action_type, related_application_id)
             VALUES (?, 'Inspection notices', ?, ?, '/city-corp/applications', 'inspection_passed', ?)`,
            [
              admin.user_id,
              `Inspection Passed for ${inspection.application_ref}`,
              `Field inspection for application ${inspection.application_ref} has been passed. Ready for final review.`,
              inspectionId
            ]
          );
        }
      } catch (notifErr) {
        console.error('Failed to create notification:', notifErr);
      }

      // Create notification for vendor
      await connection.query(
        `INSERT INTO vendor_notifications (user_id, category, title, message, link, action_type, related_application_id)
         VALUES (?, 'Inspection notices', ?, ?, CONCAT('/vendor/track/', ?), 'inspection_passed', ?)`,
        [
          inspection.user_id,
          `Inspection Passed for ${inspection.application_ref}`,
          `Your field inspection has been passed successfully. Your application is now with the City Corporation for final approval.`,
          inspectionId,
          inspectionId
        ]
      );

      await connection.commit();
      res.json({ message: "Inspection passed to City Corporation successfully" });
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

// Get inspector profile
async function getInspectorProfile(req, res, next) {
  try {
    const inspectorId = req.user.id;

    const [[profile]] = await pool.query(
      `SELECT ip.*, u.email, u.created_at
       FROM inspector_profiles ip
       JOIN users u ON u.id = ip.user_id
       WHERE ip.user_id = ?`,
      [inspectorId]
    );

    if (!profile) {
      throw new ApiError(404, "Inspector profile not found");
    }

    res.json({ profile });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getInspectorDashboard,
  getAssignedInspections,
  getInspectionDetails,
  conductInspection,
  passToCityCorp,
  getInspectorProfile,
};
