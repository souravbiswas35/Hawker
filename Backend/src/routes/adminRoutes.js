const express = require("express");
const {
  getDashboard,
  listVendors,
  listApplications,
  getApplicationDetails,
  reviewApplication,
} = require("../controllers/adminController");
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

router.get("/complaints", listComplaints);
router.patch("/complaints/:id", updateComplaint);

router.get("/payments", getPaymentsOverview);
router.post("/payments/manual", createManualPayment);

router.get("/inspections", getInspections);
router.post("/inspections", createInspection);

router.get("/zones-management", getZonesManagement);
router.post("/zones-management", createZone);

module.exports = router;
