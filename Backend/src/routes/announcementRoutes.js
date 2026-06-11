const express = require("express");
const router = express.Router();
const announcementController = require("../controllers/announcementController");
const { requireAuth } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../../uploads/announcements");
    const fs = require("fs");
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow common file types
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/png",
      "image/gif",
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, Word, Excel, and image files are allowed."));
    }
  },
});

// Create announcement (admin only)
router.post("/", requireAuth, upload.array("attachments", 5), announcementController.createAnnouncement);

// Get all announcements (public/vendor/admin)
router.get("/", announcementController.getAllAnnouncements);

// Get announcement statistics (admin only)
router.get("/stats", requireAuth, announcementController.getAnnouncementStats);

// Get announcement by ID (public/vendor/admin)
router.get("/:id", announcementController.getAnnouncementById);

// Update announcement (admin only)
router.put("/:id", requireAuth, upload.array("attachments", 5), announcementController.updateAnnouncement);

// Archive announcement (admin only)
router.patch("/:id/archive", requireAuth, announcementController.archiveAnnouncement);

// Delete announcement (admin only)
router.delete("/:id", requireAuth, announcementController.deleteAnnouncement);

module.exports = router;
