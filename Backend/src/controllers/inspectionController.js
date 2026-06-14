const pool = require("../config/db");

async function getVendorInspectionHistory(req, res, next) {
  try {
    const userId = req.user.id;

    const [inspections] = await pool.query(
      `SELECT i.*, ins.name as inspector_name, ins.inspector_rank as inspector_rank, 
              ins.contact_number as inspector_contact, ins.badge_number
       FROM inspections i
       LEFT JOIN inspectors ins ON i.inspector_id = ins.id
       WHERE i.user_id = ?
       ORDER BY i.scheduled_date DESC`,
      [userId],
    );

    res.json({ inspections });
  } catch (err) {
    // Handle case where tables don't exist yet
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.json({ inspections: [] });
    }
    console.error("Error fetching vendor inspection history:", err);
    next(err);
  }
}

async function getInspectionById(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [[inspection]] = await pool.query(
      `SELECT i.*, ins.name as inspector_name, ins.inspector_rank as inspector_rank, 
              ins.contact_number as inspector_contact, ins.badge_number,
              vp.first_name, vp.last_name, vp.business_name
       FROM inspections i
       LEFT JOIN inspectors ins ON i.inspector_id = ins.id
       LEFT JOIN vendor_profiles vp ON i.user_id = vp.user_id
       WHERE i.id = ? AND i.user_id = ?`,
      [id, userId],
    );

    if (!inspection) {
      return res.status(404).json({ message: "Inspection not found" });
    }

    res.json({ inspection });
  } catch (err) {
    // Handle case where tables don't exist yet
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.status(404).json({ message: "Inspection not found" });
    }
    console.error("Error fetching inspection by id:", err);
    next(err);
  }
}

async function getAdminDashboardMetrics(req, res, next) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [[todayCount]] = await pool.query(
      "SELECT COUNT(*) as count FROM inspections WHERE DATE(scheduled_date) = ?",
      [today],
    );

    const [[completedCount]] = await pool.query(
      "SELECT COUNT(*) as count FROM inspections WHERE status = 'completed'",
      [],
    );

    const [[upcomingCount]] = await pool.query(
      "SELECT COUNT(*) as count FROM inspections WHERE status = 'scheduled' AND scheduled_date > NOW()",
      [],
    );

    const [[violationsCount]] = await pool.query(
      "SELECT COUNT(*) as count FROM inspections WHERE outcome IN ('warnings', 'failed')",
      [],
    );

    res.json({
      todayInspections: todayCount.count,
      completed: completedCount.count,
      upcoming: upcomingCount.count,
      violations: violationsCount.count,
    });
  } catch (err) {
    // Handle case where tables don't exist yet
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.json({
        todayInspections: 0,
        completed: 0,
        upcoming: 0,
        violations: 0,
      });
    }
    console.error("Error fetching admin dashboard metrics:", err);
    next(err);
  }
}

async function getCalendarEvents(req, res, next) {
  try {
    const { viewType = 'month' } = req.query;
    const today = new Date();
    let startDate, endDate;

    if (viewType === 'today') {
      startDate = today.toISOString().split('T')[0];
      endDate = startDate;
    } else if (viewType === 'week') {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      startDate = weekStart.toISOString().split('T')[0];
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      endDate = weekEnd.toISOString().split('T')[0];
    } else {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      startDate = monthStart.toISOString().split('T')[0];
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endDate = monthEnd.toISOString().split('T')[0];
    }

    const [events] = await pool.query(
      `SELECT DATE(scheduled_date) as date, COUNT(*) as count
       FROM inspections
       WHERE scheduled_date BETWEEN ? AND ?
       GROUP BY DATE(scheduled_date)
       ORDER BY date ASC`,
      [startDate, endDate],
    );

    res.json({ events });
  } catch (err) {
    // Handle case where tables don't exist yet
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.json({ events: [] });
    }
    console.error("Error fetching calendar events:", err);
    next(err);
  }
}

async function getTodaySchedule(req, res, next) {
  try {
    const [schedule] = await pool.query(
      `SELECT i.*, ip.employee_id as inspector_name, u.email as inspector_email, vp.business_name, vp.first_name, vp.last_name, vz.name as zone_name,
              la.zone_rectangle
       FROM inspections i
       LEFT JOIN inspector_profiles ip ON ip.user_id = i.inspector_id
       LEFT JOIN users u ON u.id = i.inspector_id
       LEFT JOIN vendor_profiles vp ON i.user_id = vp.user_id
       LEFT JOIN vending_zones vz ON vp.vending_zone = vz.name
       LEFT JOIN license_applications la ON la.user_id = i.user_id AND la.status = 'approved'
       WHERE i.status = 'scheduled'
       ORDER BY i.scheduled_date ASC`,
      [],
    );

    // Parse zone_rectangle JSON for each schedule item
    const scheduleWithRectangles = schedule.map(item => {
      if (item.zone_rectangle) {
        try {
          item.zone_rectangle = JSON.parse(item.zone_rectangle);
        } catch (e) {
          item.zone_rectangle = null;
        }
      }
      return item;
    });

    res.json({ schedule: scheduleWithRectangles });
  } catch (err) {
    // Handle case where tables don't exist yet
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.json({ schedule: [] });
    }
    console.error("Error fetching today's schedule:", err);
    next(err);
  }
}

async function scheduleInspection(req, res, next) {
  try {
    const { vendorId, inspectorId, scheduledDate, templateId, type } = req.body;

    // Get inspector user_id from inspector_profiles
    const [[inspector]] = await pool.query(
      "SELECT user_id FROM inspector_profiles WHERE id = ?",
      [inspectorId]
    );

    if (!inspector) {
      return res.status(404).json({ message: "Inspector not found" });
    }

    const [result] = await pool.query(
      `INSERT INTO inspections (user_id, inspector_id, scheduled_date, template_id, type, status)
       VALUES (?, ?, ?, ?, ?, 'scheduled')`,
      [vendorId, inspector.user_id, scheduledDate, templateId || null, type || 'routine'],
    );

    res.json({ message: "Inspection scheduled successfully", id: result.insertId });
  } catch (err) {
    // Handle case where tables don't exist yet
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ message: "Inspection tables not created yet" });
    }
    console.error("Error scheduling inspection:", err);
    next(err);
  }
}

async function updateInspectionStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, outcome, checklistResults, photos, gpsCoordinates, violations, comments, actionRequired, followUpDate, vendorSignature } = req.body;

    await pool.query(
      `UPDATE inspections 
       SET status = ?, outcome = ?, checklist_results = ?, photos = ?, 
           gps_coordinates = ?, violations = ?, comments = ?, action_required = ?, 
           follow_up_date = ?, vendor_signature = ?, completed_date = ?
       WHERE id = ?`,
      [
        status,
        outcome || null,
        JSON.stringify(checklistResults) || null,
        JSON.stringify(photos) || null,
        gpsCoordinates || null,
        violations || null,
        comments || null,
        actionRequired || null,
        followUpDate || null,
        vendorSignature || null,
        status === 'completed' ? new Date() : null,
        id,
      ],
    );

    res.json({ message: "Inspection updated successfully" });
  } catch (err) {
    next(err);
  }
}

async function getInspectionHistory(req, res, next) {
  try {
    const { date, inspectorId, zone, outcome } = req.query;

    let query = `
      SELECT i.*, ins.name as inspector_name, vp.business_name, vz.name as zone_name
      FROM inspections i
      LEFT JOIN inspectors ins ON i.inspector_id = ins.id
      LEFT JOIN vendor_profiles vp ON i.user_id = vp.user_id
      LEFT JOIN vending_zones vz ON vp.vending_zone = vz.name
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      query += " AND DATE(i.scheduled_date) = ?";
      params.push(date);
    }

    if (inspectorId) {
      query += " AND i.inspector_id = ?";
      params.push(inspectorId);
    }

    if (zone) {
      query += " AND vp.vending_zone = ?";
      params.push(zone);
    }

    if (outcome) {
      query += " AND i.outcome = ?";
      params.push(outcome);
    }

    query += " ORDER BY i.scheduled_date DESC";

    const [inspections] = await pool.query(query, params);

    res.json({ inspections });
  } catch (err) {
    // Handle case where tables don't exist yet
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.json({ inspections: [] });
    }
    console.error("Error fetching inspection history:", err);
    next(err);
  }
}

async function getInspectionTemplates(req, res, next) {
  try {
    const [templates] = await pool.query("SELECT * FROM inspection_templates ORDER BY name ASC");
    res.json({ templates });
  } catch (err) {
    // Handle case where tables don't exist yet
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.json({ templates: [] });
    }
    console.error("Error fetching inspection templates:", err);
    next(err);
  }
}

async function getInspectors(req, res, next) {
  try {
    const [inspectors] = await pool.query(
      `SELECT ip.id, ip.user_id, ip.employee_id, ip.phone, ip.assigned_zones, ip.is_active,
              u.email
       FROM inspector_profiles ip
       JOIN users u ON u.id = ip.user_id
       WHERE ip.is_active = 1
       ORDER BY ip.employee_id ASC`
    );
    res.json({ inspectors });
  } catch (err) {
    // Handle case where tables don't exist yet
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.json({ inspectors: [] });
    }
    console.error("Error fetching inspectors:", err);
    next(err);
  }
}

module.exports = {
  getVendorInspectionHistory,
  getInspectionById,
  getAdminDashboardMetrics,
  getCalendarEvents,
  getTodaySchedule,
  scheduleInspection,
  updateInspectionStatus,
  getInspectionHistory,
  getInspectionTemplates,
  getInspectors,
};
