const pool = require("../config/db");
const ApiError = require("../utils/apiError");

const ALLOWED_PERIODS = [1, 3, 6, 12];
const PAYMENT_OPTIONS = [
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "visa", label: "Visa" },
  { value: "mastercard", label: "Mastercard" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
];

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function parseBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return ["true", "1", "yes", "on"].includes(value.toLowerCase());
  }
  return false;
}

function getDayDiff(dateValue) {
  if (!dateValue) return null;
  const now = new Date();
  const target = new Date(dateValue);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

function buildRenewalRef() {
  const stamp = Date.now().toString().slice(-7);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `RNL-${stamp}-${random}`;
}

async function ensureVendorLicense(userId) {
  const [licenseRows] = await pool.query(
    `SELECT id, user_id, source_application_id, license_number, current_zone,
            issued_at, expires_at, status, auto_renew_enabled
     FROM vendor_licenses
     WHERE user_id = ?
     ORDER BY expires_at DESC
     LIMIT 1`,
    [userId],
  );

  if (licenseRows.length > 0) {
    const license = licenseRows[0];
    const daysUntilExpiry = getDayDiff(license.expires_at);

    if (
      license.status !== "expired" &&
      daysUntilExpiry !== null &&
      daysUntilExpiry < 0
    ) {
      await pool.query(
        "UPDATE vendor_licenses SET status = 'expired' WHERE id = ?",
        [license.id],
      );
      return { ...license, status: "expired" };
    }

    return license;
  }

  const [approvedApps] = await pool.query(
    `SELECT id, application_ref, desired_zone, submitted_at, reviewed_at
     FROM license_applications
     WHERE user_id = ? AND status = 'approved'
     ORDER BY COALESCE(reviewed_at, submitted_at) DESC
     LIMIT 1`,
    [userId],
  );

  if (approvedApps.length === 0) {
    return null;
  }

  const approvedApp = approvedApps[0];
  const issuedAt =
    approvedApp.reviewed_at || approvedApp.submitted_at || new Date();
  const expiresAt = new Date(issuedAt);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  const isExpired = getDayDiff(expiresAt) < 0;

  const [insertResult] = await pool.query(
    `INSERT INTO vendor_licenses
     (user_id, source_application_id, license_number, current_zone, issued_at, expires_at, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      approvedApp.id,
      `LIC-${approvedApp.application_ref}`,
      approvedApp.desired_zone,
      issuedAt,
      expiresAt,
      isExpired ? "expired" : "active",
    ],
  );

  const [newRows] = await pool.query(
    `SELECT id, user_id, source_application_id, license_number, current_zone,
            issued_at, expires_at, status, auto_renew_enabled
     FROM vendor_licenses
     WHERE id = ?
     LIMIT 1`,
    [insertResult.insertId],
  );

  return newRows[0] || null;
}

async function getPricingMeta(userId) {
  const [rows] = await pool.query(
    `SELECT lt.base_price, lt.duration_days, lt.processing_fee
     FROM license_applications la
     LEFT JOIN license_types lt ON la.license_type_id = lt.id
     WHERE la.user_id = ? AND la.status = 'approved'
     ORDER BY COALESCE(la.reviewed_at, la.submitted_at) DESC
     LIMIT 1`,
    [userId],
  );

  const row = rows[0] || {};
  const durationDays = toNumber(row.duration_days);
  const basePrice = toNumber(row.base_price);

  let monthlyBaseRate = 1200;
  if (durationDays > 0 && basePrice > 0) {
    monthlyBaseRate = basePrice / (durationDays / 30);
  }

  const processingFee = Number.isFinite(toNumber(row.processing_fee))
    ? toNumber(row.processing_fee)
    : 100;

  return {
    monthlyBaseRate,
    processingFee,
  };
}

function calculateQuote({
  periodMonths,
  daysUntilExpiry,
  monthlyBaseRate,
  processingFee,
}) {
  const baseAmount = monthlyBaseRate * periodMonths;

  let discountRate = 0;
  let discountLabel = null;

  // Early-bird discount applies when renewing with at least 30 days left.
  if (daysUntilExpiry !== null && daysUntilExpiry >= 30) {
    if (periodMonths === 3) {
      discountRate = 0.05;
      discountLabel = "Early-bird 5%";
    } else if (periodMonths === 6) {
      discountRate = 0.1;
      discountLabel = "Early-bird 10%";
    } else if (periodMonths === 12) {
      discountRate = 0.15;
      discountLabel = "Early-bird 15%";
    }
  }

  const discountAmount = baseAmount * discountRate;
  const payableAmount = baseAmount + processingFee - discountAmount;

  return {
    periodMonths,
    baseAmount: Number(baseAmount.toFixed(2)),
    processingFee: Number(processingFee.toFixed(2)),
    discountRate,
    discountLabel,
    discountAmount: Number(discountAmount.toFixed(2)),
    payableAmount: Number(payableAmount.toFixed(2)),
  };
}

function formatLicense(license) {
  if (!license) {
    return null;
  }

  const daysUntilExpiry = getDayDiff(license.expires_at);
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;

  return {
    id: license.id,
    licenseNumber: license.license_number,
    currentZone: license.current_zone,
    issuedAt: license.issued_at,
    expiresAt: license.expires_at,
    status: isExpired ? "expired" : license.status,
    daysUntilExpiry,
    isExpiringSoon:
      daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry < 30,
    isExpired,
    autoRenewEnabled: Boolean(license.auto_renew_enabled),
  };
}

function addMonths(dateValue, months) {
  const date = new Date(dateValue);
  date.setMonth(date.getMonth() + months);
  return date;
}

async function getRenewalDetails(req, res, next) {
  try {
    const userId = req.user.id;
    const license = await ensureVendorLicense(userId);
    const formattedLicense = formatLicense(license);

    if (!formattedLicense) {
      return res.json({
        currentLicense: null,
        periods: ALLOWED_PERIODS,
        paymentOptions: PAYMENT_OPTIONS,
        quotes: [],
        message: "No active or historical approved license found for renewal.",
      });
    }

    const { monthlyBaseRate, processingFee } = await getPricingMeta(userId);

    const quotes = ALLOWED_PERIODS.map((periodMonths) =>
      calculateQuote({
        periodMonths,
        daysUntilExpiry: formattedLicense.daysUntilExpiry,
        monthlyBaseRate,
        processingFee,
      }),
    );

    res.json({
      currentLicense: formattedLicense,
      periods: ALLOWED_PERIODS,
      paymentOptions: PAYMENT_OPTIONS,
      pricingMeta: {
        monthlyBaseRate: Number(monthlyBaseRate.toFixed(2)),
        processingFee: Number(processingFee.toFixed(2)),
      },
      quotes,
      requiresDocumentReupload: formattedLicense.isExpired,
    });
  } catch (err) {
    next(err);
  }
}

async function getRenewalQuote(req, res, next) {
  try {
    const periodMonths = toNumber(req.body?.periodMonths);
    if (!ALLOWED_PERIODS.includes(periodMonths)) {
      throw new ApiError(400, "periodMonths must be one of: 1, 3, 6, 12");
    }

    const license = await ensureVendorLicense(req.user.id);
    const formattedLicense = formatLicense(license);

    if (!formattedLicense) {
      throw new ApiError(404, "No license found for renewal");
    }

    const { monthlyBaseRate, processingFee } = await getPricingMeta(
      req.user.id,
    );
    const quote = calculateQuote({
      periodMonths,
      daysUntilExpiry: formattedLicense.daysUntilExpiry,
      monthlyBaseRate,
      processingFee,
    });

    res.json({
      currentLicense: formattedLicense,
      quote,
      requiresDocumentReupload: formattedLicense.isExpired,
    });
  } catch (err) {
    next(err);
  }
}

async function toggleAutoRenew(req, res, next) {
  try {
    const enableAutoRenew = parseBoolean(req.body?.enableAutoRenew);
    const license = await ensureVendorLicense(req.user.id);

    if (!license) {
      throw new ApiError(404, "No license found for renewal settings");
    }

    await pool.query(
      "UPDATE vendor_licenses SET auto_renew_enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [enableAutoRenew ? 1 : 0, license.id],
    );

    res.json({
      message: `Auto-renewal ${enableAutoRenew ? "enabled" : "disabled"}`,
      autoRenewEnabled: enableAutoRenew,
    });
  } catch (err) {
    next(err);
  }
}

async function submitRenewal(req, res, next) {
  try {
    const userId = req.user.id;
    const periodMonths = toNumber(req.body?.periodMonths);
    const paymentMethod = req.body?.paymentMethod;
    const notes = req.body?.notes || null;
    const enableAutoRenew = parseBoolean(req.body?.enableAutoRenew);

    if (!ALLOWED_PERIODS.includes(periodMonths)) {
      throw new ApiError(400, "Please select a valid renewal period");
    }

    if (!PAYMENT_OPTIONS.some((option) => option.value === paymentMethod)) {
      throw new ApiError(400, "Please select a valid payment method");
    }

    const license = await ensureVendorLicense(userId);
    const formattedLicense = formatLicense(license);

    if (!formattedLicense) {
      throw new ApiError(404, "No license found for renewal");
    }

    const { monthlyBaseRate, processingFee } = await getPricingMeta(userId);
    const quote = calculateQuote({
      periodMonths,
      daysUntilExpiry: formattedLicense.daysUntilExpiry,
      monthlyBaseRate,
      processingFee,
    });

    const renewalRef = buildRenewalRef();

    const [insertResult] = await pool.query(
      `INSERT INTO license_renewals
      (renewal_ref, vendor_license_id, user_id, period_months, base_amount,
       processing_fee, discount_amount, discount_label, payable_amount,
       payment_method, requires_document_reupload, document_original_name,
       document_stored_name, document_mime_type, document_size, notes,
       payment_status, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', 'approved')`,
      [
        renewalRef,
        formattedLicense.id,
        userId,
        periodMonths,
        quote.baseAmount,
        quote.processingFee,
        quote.discountAmount,
        quote.discountLabel,
        quote.payableAmount,
        paymentMethod,
        formattedLicense.isExpired ? 1 : 0,
        req.file?.originalname || null,
        req.file?.filename || null,
        req.file?.mimetype || null,
        req.file?.size || null,
        notes,
      ],
    );

    const now = new Date();
    const currentExpiry = new Date(formattedLicense.expiresAt);
    const renewalStart = currentExpiry > now ? currentExpiry : now;
    const renewedExpiry = addMonths(renewalStart, periodMonths);

    await pool.query(
      `UPDATE vendor_licenses
       SET auto_renew_enabled = ?,
           status = 'active',
           last_renewed_at = CURRENT_TIMESTAMP,
           expires_at = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [enableAutoRenew ? 1 : 0, renewedExpiry, formattedLicense.id],
    );

    res.status(201).json({
      message: "License renewed successfully with demo payment",
      renewal: {
        id: insertResult.insertId,
        renewalRef,
        periodMonths,
        payableAmount: quote.payableAmount,
        paymentMethod,
        paymentStatus: "paid",
        status: "approved",
        autoRenewEnabled: enableAutoRenew,
        renewedUntil: renewedExpiry,
        requiresDocumentReupload: false,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getRenewalDetails,
  getRenewalQuote,
  toggleAutoRenew,
  submitRenewal,
};
