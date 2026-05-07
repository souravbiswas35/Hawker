const express = require("express");
const authRoutes = require("./authRoutes");
const vendorRoutes = require("./vendorRoutes");
const applicationRoutes = require("./applicationRoutes");
const adminRoutes = require("./adminRoutes");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok", service: "hawker-api" });
});

router.use("/auth", authRoutes);
router.use("/vendor", vendorRoutes);
router.use("/applications", applicationRoutes);
router.use("/admin", adminRoutes);

module.exports = router;
