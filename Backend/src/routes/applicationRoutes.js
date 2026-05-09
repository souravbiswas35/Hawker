const express = require("express");
const applicationController = require("../controllers/applicationController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireRole("vendor"));
router.post("/", applicationController.createApplication);
router.get("/mine", applicationController.listMyApplications);

module.exports = router;
