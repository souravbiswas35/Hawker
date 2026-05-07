const express = require("express");
const path = require("path");
const multer = require("multer");
const { requireAuth, requireRole } = require("../middleware/auth");
const vendorController = require("../controllers/vendorController");

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../../uploads/documents"),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname.replace(/\s+/g, "_")}`);
  },
});

const allowedMimes = ["application/pdf", "image/jpeg", "image/png"];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error("Only PDF, JPG and PNG files are allowed"));
    }
    cb(null, true);
  },
});

router.use(requireAuth, requireRole("vendor"));

router.get("/dashboard", vendorController.getDashboard);
router.put("/profile", vendorController.upsertProfile);
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

module.exports = router;
