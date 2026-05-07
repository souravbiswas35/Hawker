const express = require("express");
const adminController = require("../controllers/adminController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

router.get("/dashboard", adminController.getDashboard);
router.get("/vendors", adminController.listVendors);
router.get("/applications", adminController.listApplications);
router.patch("/applications/:id/review", adminController.reviewApplication);

module.exports = router;
