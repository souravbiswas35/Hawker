const express = require("express");
const router = express.Router();
const {
  requireAuth,
  requireRole,
} = require("../middleware/auth");
const {
  getInspectorDashboard,
  getAssignedInspections,
  getInspectionDetails,
  conductInspection,
  passToCityCorp,
  getInspectorProfile,
} = require("../controllers/inspectorController");

// All routes require authentication and inspector role
router.use(requireAuth);
router.use(requireRole("inspector"));

// Dashboard
router.get("/dashboard", getInspectorDashboard);

// Inspections
router.get("/inspections", getAssignedInspections);
router.get("/inspections/:id", getInspectionDetails);
router.post("/inspections/:id/conduct", conductInspection);
router.post("/inspections/:id/pass-to-city-corp", passToCityCorp);

// Profile
router.get("/profile", getInspectorProfile);

module.exports = router;
