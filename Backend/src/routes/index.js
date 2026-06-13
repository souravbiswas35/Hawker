const express = require("express");
const authRoutes = require("./authRoutes");
const vendorRoutes = require("./vendorRoutes");
const applicationRoutes = require("./applicationRoutes");
const adminRoutes = require("./adminRoutes");
const licenseApplicationRoutes = require("./licenseApplicationRoutes");
const paymentRoutes = require("./paymentRoutes");
const feedbackRoutes = require("./feedbackRoutes");
const announcementRoutes = require("./announcementRoutes");
const womenSupportRoutes = require("./womenSupportRoutes");
const inspectorRoutes = require("./inspectorRoutes");
const cityCorpRoutes = require("./cityCorpRoutes");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok", service: "hawker-api" });
});

router.use("/auth", authRoutes);
router.use("/vendor", vendorRoutes);
router.use("/applications", applicationRoutes);
router.use("/license", licenseApplicationRoutes);
router.use("/admin", adminRoutes);
router.use("/payments", paymentRoutes);
router.use("/feedback", feedbackRoutes);
router.use("/announcements", announcementRoutes);
router.use("/women-support", womenSupportRoutes);
router.use("/inspector", inspectorRoutes);
router.use("/city-corp", cityCorpRoutes);

module.exports = router;
