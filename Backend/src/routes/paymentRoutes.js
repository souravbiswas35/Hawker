const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const paymentController = require("../controllers/paymentController");

const router = express.Router();

// Vendor routes (with vendor middleware)
const vendorRouter = express.Router();
vendorRouter.use(requireAuth, requireRole("vendor"));

vendorRouter.get("/dashboard", paymentController.getPaymentDashboard);
vendorRouter.get("/options", paymentController.getPaymentOptions);
vendorRouter.get("/discount/:code/validate", paymentController.validateDiscountCode);
vendorRouter.post("/", paymentController.createPayment);
vendorRouter.get("/history", paymentController.getPaymentHistory);
vendorRouter.get("/receipt/:id", paymentController.getPaymentReceipt);
vendorRouter.get("/statement/download", paymentController.downloadStatement);

// Admin routes (with admin middleware)
const adminRouter = express.Router();
adminRouter.use(requireAuth, requireRole("admin"));

adminRouter.get("/all", paymentController.getAllPayments);
adminRouter.get("/stats", paymentController.getPaymentStats);
adminRouter.post("/manual", paymentController.createAdminPayment);

// Mount routers
router.use("/vendor", vendorRouter);
router.use("/admin", adminRouter);

module.exports = router;
