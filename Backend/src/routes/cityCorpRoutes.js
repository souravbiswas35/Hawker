const express = require("express");
const router = express.Router();
const {
  requireAuth,
  requireRole,
} = require("../middleware/auth");
const {
  getCityCorpDashboard,
  getPendingReviews,
  getApplicationDetails,
  finalReview,
  getCityCorpProfile,
} = require("../controllers/cityCorpAdminController");

// All routes require authentication and city_corporation_admin role
router.use(requireAuth);
router.use(requireRole("city_corporation_admin"));

// Dashboard
router.get("/dashboard", getCityCorpDashboard);

// Applications
router.get("/applications", getPendingReviews);
router.get("/applications/:id", getApplicationDetails);
router.post("/applications/:id/review", finalReview);

// Profile
router.get("/profile", getCityCorpProfile);

module.exports = router;
