const express = require("express");
const {
  getDashboard,
  listVendors,
  listApplications,
  getApplicationDetails,
  reviewApplication,
} = require("../controllers/adminController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

router.get("/dashboard", getDashboard);
router.get("/vendors", listVendors);
router.get("/applications", listApplications);
router.get("/applications/:id", getApplicationDetails);
router.patch("/applications/:id/review", reviewApplication);

module.exports = router;
