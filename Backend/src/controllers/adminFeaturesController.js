const pool = require("../config/db");
const ApiError = require("../utils/apiError");

async function getReportsOverview(req, res, next) {
  try {
    const [[stats]] = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'vendor') AS total_vendors,
        (SELECT COALESCE(SUM(amount), 0) FROM application_payments WHERE payment_status = 'completed') AS total_revenue,
        (SELECT COUNT(*) FROM license_applications WHERE status = 'approved') AS active_licenses,
        (SELECT COUNT(*) FROM generated_reports) AS total_reports`,
    );

    const [reports] = await pool.query(
      `SELECT id, report_name, report_type, report_period, file_size_kb, status, created_at
       FROM generated_reports
       ORDER BY created_at DESC
       LIMIT 12`,
    );

    res.json({ stats, reports });
  } catch (err) {
    next(err);
  }
}

async function generateReport(req, res, next) {
  try {
    const { reportType, reportPeriod, visualType, filters } = req.body;

    if (!reportType || !reportPeriod || !visualType) {
      throw new ApiError(
        400,
        "reportType, reportPeriod and visualType are required",
      );
    }

    const reportName = `${reportType} report (${reportPeriod})`;
    const fileSize = Math.floor(600 + Math.random() * 2400);

    const [result] = await pool.query(
      `INSERT INTO generated_reports
       (report_name, report_type, report_period, visual_type, filters_json, status, generated_by, file_size_kb)
       VALUES (?, ?, ?, ?, ?, 'ready', ?, ?)`,
      [
        reportName,
        reportType,
        reportPeriod,
        visualType,
        JSON.stringify(filters || {}),
        req.user.id,
        fileSize,
      ],
    );

    const [[report]] = await pool.query(
      `SELECT id, report_name, report_type, report_period, visual_type, file_size_kb, status, created_at
       FROM generated_reports
       WHERE id = ?`,
      [result.insertId],
    );

    res.status(201).json({ message: "Report generated", report });
  } catch (err) {
    next(err);
  }
}

async function listNotifications(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT id, title, message, type, audience_type, channels, priority, scheduled_at, sent_at, recipient_count, created_at
       FROM admin_notifications
       ORDER BY created_at DESC
       LIMIT 20`,
    );
    res.json({ notifications: rows });
  } catch (err) {
    next(err);
  }
}

async function createNotification(req, res, next) {
  try {
    const {
      title,
      message,
      type = "info",
      audienceType = "all_vendors",
      channels = ["in-app"],
      priority = "normal",
      scheduledAt = null,
    } = req.body;

    if (!title || !message) {
      throw new ApiError(400, "title and message are required");
    }

    const [result] = await pool.query(
      `INSERT INTO admin_notifications
       (admin_id, title, message, type, audience_type, channels, priority, scheduled_at, sent_at, recipient_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(),
               (SELECT COUNT(*) FROM users WHERE role = 'vendor'))`,
      [
        req.user.id,
        title,
        message,
        type,
        audienceType,
        JSON.stringify(channels),
        priority,
        scheduledAt,
      ],
    );

    const [[notification]] = await pool.query(
      `SELECT id, title, message, type, audience_type, channels, priority, scheduled_at, sent_at, recipient_count, created_at
       FROM admin_notifications WHERE id = ?`,
      [result.insertId],
    );

    res.status(201).json({ message: "Notification sent", notification });
  } catch (err) {
    next(err);
  }
}

async function listComplaints(req, res, next) {
  try {
    const status = req.query.status;
    const priority = req.query.priority;

    let query = `SELECT vc.id, vc.complaint_ref, vc.subject, vc.category, vc.priority, vc.status,
                        vc.description, vc.created_at, vc.updated_at,
                        u.email, vp.first_name, vp.last_name
                 FROM vendor_complaints vc
                 JOIN users u ON u.id = vc.user_id
                 LEFT JOIN vendor_profiles vp ON vp.user_id = vc.user_id`;

    const where = [];
    const params = [];

    if (status && status !== "all") {
      where.push("vc.status = ?");
      params.push(status);
    }
    if (priority && priority !== "all") {
      where.push("vc.priority = ?");
      params.push(priority);
    }

    if (where.length) {
      query += ` WHERE ${where.join(" AND ")}`;
    }

    query += " ORDER BY vc.created_at DESC";

    const [rows] = await pool.query(query, params);
    res.json({ complaints: rows });
  } catch (err) {
    next(err);
  }
}

async function updateComplaint(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { status, resolutionNote } = req.body;

    const allowed = ["new", "in_progress", "resolved", "closed"];
    if (!allowed.includes(status)) {
      throw new ApiError(400, "Invalid complaint status");
    }

    const [result] = await pool.query(
      `UPDATE vendor_complaints
       SET status = ?, resolution_note = ?, resolved_by = ?, resolved_at = CASE WHEN ? IN ('resolved','closed') THEN NOW() ELSE NULL END
       WHERE id = ?`,
      [status, resolutionNote || null, req.user.id, status, id],
    );

    if (result.affectedRows === 0) {
      throw new ApiError(404, "Complaint not found");
    }

    res.json({ message: "Complaint updated" });
  } catch (err) {
    next(err);
  }
}

async function getPaymentsOverview(req, res, next) {
  try {
    const [[stats]] = await pool.query(
      `SELECT
        (
          (SELECT COALESCE(SUM(amount), 0)
           FROM application_payments
           WHERE payment_status = 'completed'
             AND MONTH(paid_at) = MONTH(NOW())
             AND YEAR(paid_at) = YEAR(NOW()))
          +
          (SELECT COALESCE(SUM(payable_amount), 0)
           FROM license_renewals
           WHERE payment_status = 'paid'
             AND MONTH(COALESCE(submitted_at, created_at)) = MONTH(NOW())
             AND YEAR(COALESCE(submitted_at, created_at)) = YEAR(NOW()))
        ) AS revenue_this_month,
        (
          (SELECT COALESCE(SUM(amount), 0)
           FROM application_payments
           WHERE payment_status = 'completed'
             AND DATE(paid_at) = CURDATE())
          +
          (SELECT COALESCE(SUM(payable_amount), 0)
           FROM license_renewals
           WHERE payment_status = 'paid'
             AND DATE(COALESCE(submitted_at, created_at)) = CURDATE())
        ) AS collected_today,
        (
          (SELECT COUNT(*) FROM application_payments WHERE payment_status = 'pending')
          +
          (SELECT COUNT(*) FROM license_renewals WHERE payment_status = 'pending')
        ) AS pending_count,
        (
          (SELECT COALESCE(SUM(amount), 0) FROM application_payments WHERE payment_status = 'pending')
          +
          (SELECT COALESCE(SUM(payable_amount), 0) FROM license_renewals WHERE payment_status = 'pending')
        ) AS pending_amount`,
    );

    const [payments] = await pool.query(
      `SELECT * FROM (
         SELECT
           ap.id,
           ap.application_id,
           NULL AS renewal_id,
           ap.payment_method,
           ap.amount,
           ap.transaction_id,
           ap.payment_status,
           ap.paid_at,
           ap.created_at,
           la.application_ref,
           NULL AS renewal_ref,
           u.email,
           'application' AS source_type,
           0 AS is_demo_payment
         FROM application_payments ap
         LEFT JOIN license_applications la ON la.id = ap.application_id
         LEFT JOIN users u ON u.id = la.user_id

         UNION ALL

         SELECT
           lr.id,
           NULL AS application_id,
           lr.id AS renewal_id,
           lr.payment_method,
           lr.payable_amount AS amount,
           NULL AS transaction_id,
           lr.payment_status,
           CASE
             WHEN lr.payment_status = 'paid' THEN COALESCE(lr.submitted_at, lr.created_at)
             ELSE NULL
           END AS paid_at,
           lr.created_at,
           NULL AS application_ref,
           lr.renewal_ref,
           u.email,
           'renewal' AS source_type,
           1 AS is_demo_payment
         FROM license_renewals lr
         LEFT JOIN users u ON u.id = lr.user_id
       ) unified_payments
       ORDER BY COALESCE(unified_payments.paid_at, unified_payments.created_at) DESC
       LIMIT 50`,
    );

    res.json({ stats, payments });
  } catch (err) {
    next(err);
  }
}

async function createManualPayment(req, res, next) {
  try {
    const { applicationId, amount, method = "cash", transactionId } = req.body;
    if (!applicationId || !amount) {
      throw new ApiError(400, "applicationId and amount are required");
    }

    const [result] = await pool.query(
      `INSERT INTO application_payments
       (application_id, payment_method, amount, transaction_id, payment_status, paid_at)
       VALUES (?, ?, ?, ?, 'completed', NOW())`,
      [Number(applicationId), method, Number(amount), transactionId || null],
    );

    res
      .status(201)
      .json({ message: "Manual payment created", paymentId: result.insertId });
  } catch (err) {
    next(err);
  }
}

async function getInspections(req, res, next) {
  try {
    const [[stats]] = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM inspections WHERE DATE(scheduled_at) = CURDATE()) AS today_count,
        (SELECT COUNT(*) FROM inspections WHERE status = 'completed') AS completed_count,
        (SELECT COUNT(*) FROM inspections WHERE status = 'scheduled') AS upcoming_count,
        (SELECT COUNT(*) FROM inspections WHERE violations_found = 1) AS violations_found`,
    );

    const [schedule] = await pool.query(
      `SELECT i.id, i.scheduled_at, i.status, i.zone_code, i.notes, i.inspector_name,
              u.email, vp.first_name, vp.last_name
       FROM inspections i
       LEFT JOIN users u ON u.id = i.vendor_user_id
       LEFT JOIN vendor_profiles vp ON vp.user_id = i.vendor_user_id
       ORDER BY i.scheduled_at ASC
       LIMIT 40`,
    );

    res.json({ stats, schedule });
  } catch (err) {
    next(err);
  }
}

async function createInspection(req, res, next) {
  try {
    const { vendorUserId, zoneCode, inspectorName, scheduledAt, notes } =
      req.body;
    if (!vendorUserId || !zoneCode || !inspectorName || !scheduledAt) {
      throw new ApiError(
        400,
        "vendorUserId, zoneCode, inspectorName, scheduledAt are required",
      );
    }

    const [result] = await pool.query(
      `INSERT INTO inspections
       (vendor_user_id, zone_code, inspector_name, scheduled_at, status, notes)
       VALUES (?, ?, ?, ?, 'scheduled', ?)`,
      [
        Number(vendorUserId),
        zoneCode,
        inspectorName,
        scheduledAt,
        notes || null,
      ],
    );

    res
      .status(201)
      .json({ message: "Inspection scheduled", inspectionId: result.insertId });
  } catch (err) {
    next(err);
  }
}

async function getZonesManagement(req, res, next) {
  try {
    const [zones] = await pool.query(
      `SELECT id, zone_code, name, location, area, total_spots, available_spots,
              has_electricity, has_water, has_shade, zone_type, traffic_level,
              latitude, longitude, is_active, created_at
       FROM vending_zones
       ORDER BY created_at DESC`,
    );

    const [[stats]] = await pool.query(
      `SELECT
         COUNT(*) AS total_zones,
         COALESCE(SUM(total_spots - available_spots), 0) AS occupied_spots,
         COALESCE(SUM(available_spots), 0) AS available_spots,
         CASE
           WHEN COALESCE(SUM(total_spots), 0) = 0 THEN 0
           ELSE ROUND((COALESCE(SUM(total_spots - available_spots), 0) / SUM(total_spots)) * 100, 1)
         END AS avg_occupancy
       FROM vending_zones
       WHERE is_active = 1`,
    );

    res.json({ stats, zones });
  } catch (err) {
    next(err);
  }
}

async function createZone(req, res, next) {
  try {
    const {
      zoneCode,
      name,
      location,
      area,
      totalSpots,
      zoneType = "mixed",
      trafficLevel = "medium",
      hasElectricity = 0,
      hasWater = 0,
      hasShade = 0,
      latitude = null,
      longitude = null,
    } = req.body;

    if (!zoneCode || !name || !location || !area || !totalSpots) {
      throw new ApiError(
        400,
        "zoneCode, name, location, area, totalSpots are required",
      );
    }

    const [result] = await pool.query(
      `INSERT INTO vending_zones
       (zone_code, name, location, area, total_spots, available_spots,
        has_electricity, has_water, has_shade, zone_type, traffic_level, latitude, longitude)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        zoneCode,
        name,
        location,
        area,
        Number(totalSpots),
        Number(totalSpots),
        hasElectricity ? 1 : 0,
        hasWater ? 1 : 0,
        hasShade ? 1 : 0,
        zoneType,
        trafficLevel,
        latitude,
        longitude,
      ],
    );

    res.status(201).json({ message: "Zone created", zoneId: result.insertId });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getReportsOverview,
  generateReport,
  listNotifications,
  createNotification,
  listComplaints,
  updateComplaint,
  getPaymentsOverview,
  createManualPayment,
  getInspections,
  createInspection,
  getZonesManagement,
  createZone,
};
