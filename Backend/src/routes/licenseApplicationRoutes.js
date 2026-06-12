const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  getLicenseTypes,
  getVendingZones,
  createApplication,
  updateApplicationStep,
  getApplication,
  getUserApplications,
  uploadApplicationDocument
} = require("../controllers/licenseApplicationController");
const { requireAuth } = require("../middleware/auth");

// Multer configuration for license application documents
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads/license-documents");
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname.replace(/\s+/g, "_")}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error("Only PDF, JPG and PNG files are allowed"));
    }
    cb(null, true);
  },
});

// Get license types and zones (public routes)
router.get("/license-types", getLicenseTypes);
router.get("/vending-zones", getVendingZones);

// Protected routes
router.use(requireAuth);

// Application management
router.post("/applications", createApplication);
router.get("/applications", getUserApplications);
router.get("/applications/:applicationId", getApplication);
router.put("/applications/:applicationId/steps/:step", updateApplicationStep);

// Document upload
router.post(
  "/applications/:applicationId/documents",
  upload.single("document"),
  uploadApplicationDocument
);

module.exports = router;
