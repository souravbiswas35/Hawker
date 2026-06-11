const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedbackController");
const { requireAuth } = require("../middleware/auth");

// Submit feedback (vendor)
router.post("/", requireAuth, feedbackController.submitFeedback);

// Get feedback statistics (public/vendor)
router.get("/stats", feedbackController.getFeedbackStats);

// Get all feedback (admin only)
router.get("/all", requireAuth, feedbackController.getAllFeedback);

// Get feedback by ID (admin only)
router.get("/:id", requireAuth, feedbackController.getFeedbackById);

// Update feedback status (admin only)
router.put("/:id", requireAuth, feedbackController.updateFeedbackStatus);

// Get improvements (public/vendor)
router.get("/improvements/list", feedbackController.getImprovements);

module.exports = router;
