const pool = require("../config/db");
const ApiError = require("../utils/apiError");

// Get city corporation admin dashboard
async function getCityCorpDashboard(req, res, next) {
  try {
    const [[counts]] = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM license_applications WHERE city_corp_review_status = 'pending' AND inspection_status = 'passed') AS pending_reviews,
        (SELECT COUNT(*) FROM license_applications WHERE city_corp_review_status = 'approved') AS approved_today,
        (SELECT COUNT(*) FROM license_applications WHERE city_corp_review_status = 'rejected') AS rejected_today,
        (SELECT COUNT(*) FROM license_applications WHERE inspection_status = 'passed' AND city_corp_review_status = 'pending') AS awaiting_final_review,
        (SELECT COUNT(*) FROM license_applications WHERE status = 'approved' AND city_corp_review_status = 'approved') AS total_licenses_issued`,
      [],
    );

    const [pendingReviews] = await pool.query(
      `SELECT la.id, la.application_ref, la.inspection_date, la.inspection_zone,
              u.email, vp.first_name, vp.last_name, vp.business_name,
              lt.name as license_type_name, pz.name as primary_zone_name,
              la.inspection_remarks, la.inspection_conducted_at
       FROM license_applications la
       JOIN users u ON u.id = la.user_id
       LEFT JOIN vendor_profiles vp ON vp.user_id = la.user_id
       LEFT JOIN license_types lt ON lt.id = la.license_type_id
       LEFT JOIN vending_zones pz ON pz.id = la.primary_zone_id
       WHERE la.city_corp_review_status = 'pending' AND la.inspection_status = 'passed'
       ORDER BY la.inspection_conducted_at DESC
       LIMIT 10`,
      [],
    );

    const [recentActivity] = await pool.query(
      `SELECT la.application_ref, la.city_corp_review_status, la.city_corp_reviewed_at,
              u.email, vp.first_name, vp.last_name
       FROM license_applications la
       JOIN users u ON u.id = la.user_id
       LEFT JOIN vendor_profiles vp ON vp.user_id = la.user_id
       WHERE la.city_corp_review_status IN ('approved', 'rejected')
       ORDER BY la.city_corp_reviewed_at DESC
       LIMIT 8`,
      [],
    );

    res.json({
      stats: counts,
      pendingReviews,
      recentActivity,
    });
  } catch (err) {
    next(err);
  }
}

// Get applications awaiting city corporation review
async function getPendingReviews(req, res, next) {
  try {
    const { status } = req.query;

    let query = `SELECT la.id, la.application_ref, la.inspection_date, la.inspection_zone,
                    la.inspection_status, la.inspection_remarks, la.inspection_conducted_at,
                    la.city_corp_review_status, la.city_corp_reviewed_at,
                    u.email, vp.first_name, vp.last_name, vp.business_name, vp.phone,
                    lt.name as license_type_name, pz.name as primary_zone_name,
                    la.admin_review_remarks, ip.employee_id as inspector_id
             FROM license_applications la
             JOIN users u ON u.id = la.user_id
             LEFT JOIN vendor_profiles vp ON vp.user_id = la.user_id
             LEFT JOIN license_types lt ON lt.id = la.license_type_id
             LEFT JOIN vending_zones pz ON pz.id = la.primary_zone_id
             LEFT JOIN inspector_profiles ip ON ip.user_id = la.inspection_assigned_to
             WHERE la.inspection_status = 'passed'`;

    const params = [];

    if (status) {
      query += " AND la.city_corp_review_status = ?";
      params.push(status);
    }

    query += " ORDER BY la.inspection_conducted_at DESC";

    const [rows] = await pool.query(query, params);
    res.json({ applications: rows });
  } catch (err) {
    next(err);
  }
}

// Get application details for review
async function getApplicationDetails(req, res, next) {
  try {
    const applicationId = Number(req.params.id);

    const [[application]] = await pool.query(
      `SELECT la.*, u.email, vp.first_name, vp.last_name, vp.phone, vp.address,
              vp.business_name as profile_business_name,
              lt.name as license_type_name, lt.duration_days, lt.base_price, lt.security_deposit, lt.processing_fee,
              pz.name as primary_zone_name, pz.zone_code as primary_zone_code,
              pz.location as primary_zone_location,
              az.name as alternate_zone_name,
              ip.employee_id as inspector_employee_id, ip.phone as inspector_phone,
              cc.employee_id as city_corp_employee_id
       FROM license_applications la
       JOIN users u ON u.id = la.user_id
       LEFT JOIN vendor_profiles vp ON vp.user_id = la.user_id
       LEFT JOIN license_types lt ON lt.id = la.license_type_id
       LEFT JOIN vending_zones pz ON pz.id = la.primary_zone_id
       LEFT JOIN vending_zones az ON az.id = la.alternate_zone_id
       LEFT JOIN inspector_profiles ip ON ip.user_id = la.inspection_assigned_to
       LEFT JOIN city_corp_admin_profiles cc ON cc.user_id = ?
       WHERE la.id = ?`,
      [req.user.id, applicationId],
    );

    if (!application) {
      throw new ApiError(404, "Application not found");
    }

    // Get business details
    let businessDetails = {};
    if (application.business_details) {
      try {
        businessDetails =
          typeof application.business_details === "string"
            ? JSON.parse(application.business_details)
            : application.business_details;
      } catch (e) {
        businessDetails = {};
      }
    }

    application.business_details_parsed = businessDetails;
    application.business_name =
      application.business_name ||
      application.profile_business_name ||
      "Not provided";

    // Get document verification data
    let documentVerification = {};
    if (application.document_verification) {
      try {
        documentVerification =
          typeof application.document_verification === "string"
            ? JSON.parse(application.document_verification)
            : application.document_verification;
      } catch (e) {
        documentVerification = {};
      }
    }
    application.document_verification_parsed = documentVerification;

    res.json({ application });
  } catch (err) {
    next(err);
  }
}

// Final review and approval/rejection
async function finalReview(req, res, next) {
  try {
    const applicationId = Number(req.params.id);
    const cityCorpAdminId = req.user.id;
    const { status, remarks } = req.body;

    const allowed = ["approved", "rejected"];
    if (!allowed.includes(status)) {
      throw new ApiError(400, "Invalid status. Use approved or rejected");
    }

    // Get application details
    const [[application]] = await pool.query(
      `SELECT la.*, lt.duration_days
       FROM license_applications la
       LEFT JOIN license_types lt ON lt.id = la.license_type_id
       WHERE la.id = ?`,
      [applicationId],
    );

    if (!application) {
      throw new ApiError(404, "Application not found");
    }

    if (application.inspection_status !== "passed") {
      throw new ApiError(
        400,
        "Application must have passed inspection before final review",
      );
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      let updateFields = {
        city_corp_review_status: status,
        city_corp_review_remarks: remarks || null,
        city_corp_reviewed_by: cityCorpAdminId,
        city_corp_reviewed_at: new Date(),
      };

      // If approved, generate license
      if (status === "approved") {
        const ref = application.application_ref.startsWith("LIC-")
          ? application.application_ref
          : `LIC-${application.application_ref}`;
        const licenseNumber = `${ref}-${new Date().getFullYear()}`;
        const issuedAt = new Date();
        const expiresAt = new Date(issuedAt);
        expiresAt.setDate(
          expiresAt.getDate() + (application.duration_days || 365),
        );

        // Fetch zone name if primary_zone_id is set
        let allocatedZone = application.desired_zone;
        if (application.primary_zone_id && !allocatedZone) {
          const [[zone]] = await connection.query(
            "SELECT name FROM vending_zones WHERE id = ?",
            [application.primary_zone_id],
          );
          if (zone) allocatedZone = zone.name;
        }

        // Extract goods_authorized from business_details JSON if available
        let goodsAuthorized = application.goods_authorized;
        if (!goodsAuthorized && application.business_details) {
          try {
            const businessDetails =
              typeof application.business_details === "string"
                ? JSON.parse(application.business_details)
                : application.business_details;
            goodsAuthorized =
              businessDetails.goods_authorized ||
              businessDetails.goods ||
              application.business_category ||
              "General";
          } catch (e) {
            goodsAuthorized = application.business_category || "General";
          }
        }

        updateFields.status = "approved";
        updateFields.license_number = licenseNumber;
        updateFields.issued_at = issuedAt;
        updateFields.expires_at = expiresAt;
        updateFields.desired_zone =
          allocatedZone || application.desired_zone || "N/A";
        updateFields.goods_authorized =
          goodsAuthorized || application.business_category || "General";
        updateFields.qr_code_data = JSON.stringify({
          license_number: licenseNumber,
          vendor_name: application.business_name || "N/A",
          zone: allocatedZone || application.desired_zone || "N/A",
          issued_at: issuedAt.toISOString(),
          expires_at: expiresAt.toISOString(),
        });
      } else {
        // If rejected, update overall status
        updateFields.status = "rejected";
      }

      // Build update query dynamically
      const updateFieldsList = [
        "city_corp_review_status = ?",
        "city_corp_review_remarks = ?",
        "city_corp_reviewed_by = ?",
        "city_corp_reviewed_at = ?",
      ];
      const queryParams = [
        updateFields.city_corp_review_status,
        updateFields.city_corp_review_remarks,
        updateFields.city_corp_reviewed_by,
        updateFields.city_corp_reviewed_at,
      ];

      if (updateFields.status) {
        updateFieldsList.push("status = ?");
        queryParams.push(updateFields.status);
      }
      if (updateFields.license_number) {
        updateFieldsList.push("license_number = ?");
        queryParams.push(updateFields.license_number);
      }
      if (updateFields.issued_at) {
        updateFieldsList.push("issued_at = ?");
        queryParams.push(updateFields.issued_at);
      }
      if (updateFields.expires_at) {
        updateFieldsList.push("expires_at = ?");
        queryParams.push(updateFields.expires_at);
      }
      if (updateFields.qr_code_data) {
        updateFieldsList.push("qr_code_data = ?");
        queryParams.push(updateFields.qr_code_data);
      }
      if (updateFields.desired_zone) {
        updateFieldsList.push("desired_zone = ?");
        queryParams.push(updateFields.desired_zone);
      }
      if (updateFields.goods_authorized) {
        updateFieldsList.push("goods_authorized = ?");
        queryParams.push(updateFields.goods_authorized);
      }

      queryParams.push(applicationId);

      await connection.query(
        `UPDATE license_applications
         SET ${updateFieldsList.join(", ")}
         WHERE id = ?`,
        queryParams,
      );

      // Add audit log
      await connection.query(
        `INSERT INTO application_audit_logs (application_id, action_by, action_type, comments)
         VALUES (?, ?, ?, ?)`,
        [
          applicationId,
          cityCorpAdminId,
          status === "approved" ? "approved" : "rejected",
          remarks || `City Corporation marked as ${status}`,
        ],
      );

      // Create notification for vendor
      const notificationTitle =
        status === "approved"
          ? `License Approved for ${application.application_ref}`
          : `Application Rejected for ${application.application_ref}`;
      const notificationMessage =
        status === "approved"
          ? `Your license application has been approved by the City Corporation. Your digital license is now ready to download.`
          : `Your license application has been rejected by the City Corporation. ${remarks ? `Reason: ${remarks}` : "Please contact support for more information."}`;

      await connection.query(
        `INSERT INTO vendor_notifications (user_id, category, title, message, link, action_type, related_application_id, admin_remarks)
         VALUES (?, 'License updates', ?, ?, CONCAT('/vendor/track/', ?), ?, ?, ?)`,
        [
          application.user_id,
          notificationTitle,
          notificationMessage,
          applicationId,
          status === "approved" ? "approve" : "reject",
          applicationId,
          remarks || null,
        ],
      );

      await connection.commit();
      res.json({ message: `Application ${status} successfully` });
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

// Get city corporation admin profile
async function getCityCorpProfile(req, res, next) {
  try {
    const cityCorpAdminId = req.user.id;

    const [[profile]] = await pool.query(
      `SELECT ccp.*, u.email, u.created_at
       FROM city_corp_admin_profiles ccp
       JOIN users u ON u.id = ccp.user_id
       WHERE ccp.user_id = ?`,
      [cityCorpAdminId],
    );

    if (!profile) {
      throw new ApiError(404, "City Corporation admin profile not found");
    }

    res.json({ profile });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCityCorpDashboard,
  getPendingReviews,
  getApplicationDetails,
  finalReview,
  getCityCorpProfile,
};
