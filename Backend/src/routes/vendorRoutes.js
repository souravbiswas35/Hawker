const express = require("express");
const path = require("path");
const multer = require("multer");
const { requireAuth, requireRole } = require("../middleware/auth");
const vendorController = require("../controllers/vendorController");
const licenseRenewalController = require("../controllers/licenseRenewalController");
const inspectionController = require("../controllers/inspectionController");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (req.path.includes("profile-picture")) {
      cb(null, path.join(__dirname, "../../uploads/profile-pictures"));
    } else if (req.path.includes("complaints") || req.path.includes("evidence")) {
      cb(null, path.join(__dirname, "../../uploads/complaints"));
    } else {
      cb(null, path.join(__dirname, "../../uploads/documents"));
    }
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname.replace(/\s+/g, "_")}`);
  },
});

const allowedMimes = ["application/pdf", "image/jpeg", "image/png", "video/mp4", "video/quicktime"];
const allowedImageMimes = ["image/jpeg", "image/png"];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (req.path.includes("profile-picture")) {
      if (!allowedImageMimes.includes(file.mimetype)) {
        return cb(
          new Error("Only JPG and PNG images are allowed for profile picture"),
        );
      }
    } else {
      if (!allowedMimes.includes(file.mimetype)) {
        return cb(new Error("Only PDF, JPG and PNG files are allowed"));
      }
    }
    cb(null, true);
  },
});

router.use(requireAuth, requireRole("vendor"));

router.get("/dashboard", vendorController.getDashboard);
router.get("/profile", vendorController.getDashboard);
router.put("/profile", vendorController.upsertProfile);
router.get("/license-renewal", licenseRenewalController.getRenewalDetails);
router.post("/license-renewal/quote", licenseRenewalController.getRenewalQuote);
router.patch(
  "/license-renewal/auto-renew",
  licenseRenewalController.toggleAutoRenew,
);
router.post(
  "/license-renewal/submit",
  upload.single("renewal_document"),
  licenseRenewalController.submitRenewal,
);
router.get("/notifications", vendorController.listNotifications);
router.get("/notifications/preferences", vendorController.getNotificationPreferences);
router.put("/notifications/preferences", vendorController.updateNotificationPreferences);
router.patch("/notifications/:id/read", vendorController.markNotificationRead);
router.patch("/notifications/:id/unread", vendorController.markNotificationUnread);
router.patch("/notifications/:id/hide", vendorController.hideNotification);
router.delete("/notifications/:id", vendorController.deleteNotification);
router.post(
  "/profile-picture",
  upload.single("profile_picture"),
  vendorController.uploadProfilePicture,
);
router.post(
  "/documents",
  upload.fields([
    { name: "national_id_copy", maxCount: 1 },
    { name: "trade_license", maxCount: 1 },
    { name: "profile_photo", maxCount: 1 },
    { name: "other_document", maxCount: 3 },
  ]),
  (req, res, next) => {
    req.files = Object.values(req.files || {}).flat();
    vendorController.uploadDocuments(req, res, next);
  },
);
router.post("/complaints", vendorController.createComplaint);
router.get("/complaints", vendorController.listComplaints);
router.get("/complaints/:id", vendorController.getComplaintDetails);
router.post("/complaints/:id/follow-up", vendorController.addComplaintFollowUp);
router.patch("/complaints/:id/close", vendorController.closeComplaint);
router.patch("/complaints/:id/escalate", vendorController.escalateComplaint);
router.post(
  "/complaints/:complaintId/evidence",
  upload.array("evidence", 5),
  (req, res, next) => {
    req.files = req.files || [];
    vendorController.uploadComplaintEvidence(req, res, next);
  },
);
router.get("/my-license", vendorController.getMyLicense);
router.get("/my-zone", vendorController.getMyZone);
router.put("/my-zone", vendorController.updateMyZone);
router.get("/zones", vendorController.getVendingZones);
router.get("/profile-picture", vendorController.getProfilePicture);
router.put("/change-password", vendorController.changePassword);
router.put("/deactivate-account", vendorController.deactivateAccount);
router.delete("/delete-account", vendorController.deleteAccount);
router.get("/download-data", vendorController.downloadUserData);
router.get("/activity-log", vendorController.getActivityLog);
router.get("/settings", vendorController.getSettings);
router.put("/settings", vendorController.updateSettings);

// Inspection routes
router.get("/inspection-history", requireAuth, inspectionController.getVendorInspectionHistory);
router.get("/inspections/:id", requireAuth, inspectionController.getInspectionById);

module.exports = router;
