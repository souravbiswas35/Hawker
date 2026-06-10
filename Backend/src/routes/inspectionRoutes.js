const express = require("express");
const router = express.Router();
const inspectionController = require("../controllers/inspectionController");
const { authenticateToken } = require("../middleware/auth");

// Vendor routes
router.get("/vendor/history", authenticateToken, inspectionController.getVendorInspectionHistory);
router.get("/vendor/inspections/:id", authenticateToken, inspectionController.getInspectionById);

// Admin routes
router.get("/admin/dashboard-metrics", authenticateToken, inspectionController.getAdminDashboardMetrics);
router.get("/admin/calendar-events", authenticateToken, inspectionController.getCalendarEvents);
router.get("/admin/today-schedule", authenticateToken, inspectionController.getTodaySchedule);
router.post("/admin/schedule", authenticateToken, inspectionController.scheduleInspection);
router.put("/admin/inspections/:id", authenticateToken, inspectionController.updateInspectionStatus);
router.get("/admin/history", authenticateToken, inspectionController.getInspectionHistory);
router.get("/admin/templates", authenticateToken, inspectionController.getInspectionTemplates);
router.get("/admin/inspectors", authenticateToken, inspectionController.getInspectors);

module.exports = router;
