const express = require("express");
const {
  getDashboard,
  listVendors,
  listApplications,
  getApplicationDetails,
  reviewApplication,
  listAllNotifications,
  createNotification: createVendorNotification,
  deleteNotificationAdmin,
  createSystemNotification,
  getWomenSchemeApplications,
  getWomenSchemeApplicationDetails,
  reviewWomenSchemeApplication,
  getWomenMentorshipApplications,
  reviewWomenMentorshipApplication,
} = require("../controllers/adminController");
const inspectionController = require("../controllers/inspectionController");
const {
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
} = require("../controllers/adminFeaturesController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

router.get("/dashboard", getDashboard);
router.get("/vendors", listVendors);
router.get("/applications", listApplications);
router.get("/applications/:id", getApplicationDetails);
router.patch("/applications/:id/review", reviewApplication);

router.get("/reports/overview", getReportsOverview);
router.post("/reports/generate", generateReport);

router.get("/notifications", listNotifications);
router.post("/notifications", createNotification);

router.get("/vendor-notifications", listAllNotifications);
router.post("/vendor-notifications", createVendorNotification);
router.post("/vendor-notifications/system", createSystemNotification);
router.delete("/vendor-notifications/:id", deleteNotificationAdmin);

router.get("/complaints", listComplaints);
router.patch("/complaints/:id", updateComplaint);

router.get("/payments", getPaymentsOverview);
router.post("/payments/manual", createManualPayment);

// Inspection routes
router.get("/inspections/dashboard-metrics", inspectionController.getAdminDashboardMetrics);
router.get("/inspections/calendar-events", inspectionController.getCalendarEvents);
router.get("/inspections/today-schedule", inspectionController.getTodaySchedule);
router.post("/inspections/schedule", inspectionController.scheduleInspection);
router.put("/inspections/:id", inspectionController.updateInspectionStatus);
router.get("/inspections/history", inspectionController.getInspectionHistory);
router.get("/inspections/templates", inspectionController.getInspectionTemplates);
router.get("/inspections/inspectors", inspectionController.getInspectors);

router.get("/zones-management", getZonesManagement);
router.post("/zones-management", createZone);

// Women Vendor Support routes
router.get("/women-support/scheme-applications", getWomenSchemeApplications);
router.get("/women-support/scheme-applications/:id", getWomenSchemeApplicationDetails);
router.patch("/women-support/scheme-applications/:id/review", reviewWomenSchemeApplication);
router.get("/women-support/mentorship-applications", getWomenMentorshipApplications);
router.patch("/women-support/mentorship-applications/:id/review", reviewWomenMentorshipApplication);

module.exports = router;
