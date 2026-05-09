const express = require("express");
const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/register", authController.register);
router.post("/verify-email", authController.verifyEmail);
router.post("/resend-code", authController.resendCode);
router.post("/login", authController.login);
router.get("/me", requireAuth, authController.me);

module.exports = router;
