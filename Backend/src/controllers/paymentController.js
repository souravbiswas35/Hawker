const pool = require("../config/db");
const ApiError = require("../utils/apiError");

// Generate unique transaction ID
function generateTransactionId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `TXN-${timestamp}-${random}`.toUpperCase();
}

// Get payment dashboard data (outstanding dues, payment history, upcoming payments)
async function getPaymentDashboard(req, res, next) {
  try {
    const userId = req.user.id;

    // Get outstanding dues
    const [outstandingDues] = await pool.query(
      `SELECT id, due_type, description, amount, due_date 
       FROM vendor_dues 
       WHERE user_id = ? AND is_paid = 0 
       ORDER BY due_date ASC`,
      [userId]
    );

    // Get payment history (last 10 payments) with license info
    const [paymentHistory] = await pool.query(
      `SELECT vp.id, vp.transaction_id, vp.amount, vp.discount_amount, vp.final_amount, 
              vp.status, vp.payment_date, vp.receipt_url, vp.license_application_id,
              pt.name as payment_type, pm.display_name as payment_method,
              la.application_ref, la.desired_zone
       FROM vendor_payments vp
       JOIN payment_types pt ON vp.payment_type_id = pt.id
       JOIN payment_methods pm ON vp.payment_method_id = pm.id
       LEFT JOIN license_applications la ON la.id = vp.license_application_id
       WHERE vp.user_id = ?
       ORDER BY vp.payment_date DESC
       LIMIT 10`,
      [userId]
    );

    // Get upcoming payments
    const [upcomingPayments] = await pool.query(
      `SELECT up.id, up.title, up.description, up.amount, up.due_date, pt.name as payment_type
       FROM upcoming_payments up
       JOIN payment_types pt ON up.payment_type_id = pt.id
       WHERE up.user_id = ? AND up.is_paid = 0 AND up.due_date >= CURDATE()
       ORDER BY up.due_date ASC
       LIMIT 5`,
      [userId]
    );

    // Calculate total outstanding amount
    const [[{ total_outstanding }]] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total_outstanding
       FROM vendor_dues 
       WHERE user_id = ? AND is_paid = 0`,
      [userId]
    );

    res.json({
      outstanding_dues: outstandingDues,
      payment_history: paymentHistory,
      upcoming_payments: upcomingPayments,
      total_outstanding: total_outstanding || 0,
    });
  } catch (error) {
    next(error);
  }
}

// Get payment types and methods
async function getPaymentOptions(req, res, next) {
  try {
    const [paymentTypes] = await pool.query(
      `SELECT id, name, description FROM payment_types WHERE is_active = 1`
    );

    const [paymentMethods] = await pool.query(
      `SELECT id, name, display_name FROM payment_methods WHERE is_active = 1`
    );

    res.json({
      payment_types: paymentTypes,
      payment_methods: paymentMethods,
    });
  } catch (error) {
    next(error);
  }
}

// Validate discount code
async function validateDiscountCode(req, res, next) {
  try {
    const { code } = req.params;

    const [[discount]] = await pool.query(
      `SELECT id, code, discount_percent, max_uses, used_count, 
              valid_from, valid_until, is_active
       FROM discount_codes 
       WHERE code = ? AND is_active = 1`,
      [code]
    );

    if (!discount) {
      throw new ApiError(404, "Invalid discount code");
    }

    // Check if code is still valid
    const now = new Date();
    const validFrom = new Date(discount.valid_from);
    const validUntil = new Date(discount.valid_until);

    if (now < validFrom || now > validUntil) {
      throw new ApiError(400, "Discount code has expired");
    }

    // Check if max uses reached
    if (discount.used_count >= discount.max_uses) {
      throw new ApiError(400, "Discount code has reached maximum uses");
    }

    res.json({
      valid: true,
      discount_percent: discount.discount_percent,
    });
  } catch (error) {
    next(error);
  }
}

// Create a new payment
async function createPayment(req, res, next) {
  try {
    const userId = req.user.id;
    const { payment_type_id, payment_method_id, amount, discount_code, notes, license_application_id } = req.body;

    // Validate payment type and method
    const [[paymentType]] = await pool.query(
      `SELECT id FROM payment_types WHERE id = ? AND is_active = 1`,
      [payment_type_id]
    );

    if (!paymentType) {
      throw new ApiError(400, "Invalid payment type");
    }

    const [[paymentMethod]] = await pool.query(
      `SELECT id FROM payment_methods WHERE id = ? AND is_active = 1`,
      [payment_method_id]
    );

    if (!paymentMethod) {
      throw new ApiError(400, "Invalid payment method");
    }

    // Validate license application if provided
    if (license_application_id) {
      const [[licenseApp]] = await pool.query(
        `SELECT id, user_id, status FROM license_applications WHERE id = ? AND user_id = ?`,
        [license_application_id, userId]
      );

      if (!licenseApp) {
        throw new ApiError(404, "License application not found");
      }

      if (licenseApp.status === 'approved') {
        throw new ApiError(400, "License application is already approved");
      }
    }

    let discountAmount = 0;
    let discountCodeId = null;

    // Validate and apply discount code if provided
    if (discount_code) {
      const [[discount]] = await pool.query(
        `SELECT id, discount_percent, max_uses, used_count, valid_from, valid_until
         FROM discount_codes 
         WHERE code = ? AND is_active = 1`,
        [discount_code]
      );

      if (discount) {
        const now = new Date();
        const validFrom = new Date(discount.valid_from);
        const validUntil = new Date(discount.valid_until);

        if (now >= validFrom && now <= validUntil && discount.used_count < discount.max_uses) {
          discountAmount = (amount * discount.discount_percent) / 100;
          discountCodeId = discount.id;

          // Increment used count
          await pool.query(
            `UPDATE discount_codes SET used_count = used_count + 1 WHERE id = ?`,
            [discount.id]
          );
        }
      }
    }

    const finalAmount = amount - discountAmount;
    const transactionId = generateTransactionId();

    // Create payment record
    const [result] = await pool.query(
      `INSERT INTO vendor_payments 
       (user_id, license_application_id, payment_type_id, payment_method_id, transaction_id, amount, 
        discount_amount, final_amount, discount_code_id, status, payment_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', NOW(), ?)`,
      [userId, license_application_id || null, payment_type_id, payment_method_id, transactionId, amount, discountAmount, finalAmount, discountCodeId, notes]
    );

    // Update any related dues
    await pool.query(
      `UPDATE vendor_dues SET is_paid = 1, payment_id = ? WHERE user_id = ? AND is_paid = 0 LIMIT 1`,
      [result.insertId, userId]
    );

    // Update any related upcoming payments
    await pool.query(
      `UPDATE upcoming_payments SET is_paid = 1, payment_id = ? WHERE user_id = ? AND is_paid = 0 LIMIT 1`,
      [result.insertId, userId]
    );

    // Update license application payment status if provided
    if (license_application_id) {
      await pool.query(
        `UPDATE license_applications SET payment_status = 'completed', payment_id = ? WHERE id = ?`,
        [result.insertId, license_application_id]
      );
    }

    res.status(201).json({
      id: result.insertId,
      transaction_id: transactionId,
      amount,
      discount_amount: discountAmount,
      final_amount: finalAmount,
      status: "completed",
      payment_date: new Date().toISOString(),
      license_application_id,
    });
  } catch (error) {
    next(error);
  }
}

// Get payment history with filters
async function getPaymentHistory(req, res, next) {
  try {
    const userId = req.user.id;
    const { start_date, end_date, transaction_id } = req.query;

    let query = `
      SELECT vp.id, vp.transaction_id, vp.amount, vp.discount_amount, vp.final_amount, 
             vp.status, vp.payment_date, vp.receipt_url, vp.notes,
             pt.name as payment_type, pm.display_name as payment_method
      FROM vendor_payments vp
      JOIN payment_types pt ON vp.payment_type_id = pt.id
      JOIN payment_methods pm ON vp.payment_method_id = pm.id
      WHERE vp.user_id = ?
    `;
    const params = [userId];

    if (start_date) {
      query += ` AND vp.payment_date >= ?`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND vp.payment_date <= ?`;
      params.push(end_date);
    }

    if (transaction_id) {
      query += ` AND vp.transaction_id LIKE ?`;
      params.push(`%${transaction_id}%`);
    }

    query += ` ORDER BY vp.payment_date DESC`;

    const [payments] = await pool.query(query, params);

    res.json(payments);
  } catch (error) {
    next(error);
  }
}

// Get payment receipt details
async function getPaymentReceipt(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [[payment]] = await pool.query(
      `SELECT vp.*, pt.name as payment_type, pm.display_name as payment_method,
              vprof.first_name, vprof.last_name, vprof.business_name
       FROM vendor_payments vp
       JOIN payment_types pt ON vp.payment_type_id = pt.id
       JOIN payment_methods pm ON vp.payment_method_id = pm.id
       LEFT JOIN vendor_profiles vprof ON vprof.user_id = vp.user_id
       WHERE vp.id = ? AND vp.user_id = ?`,
      [id, userId]
    );

    if (!payment) {
      throw new ApiError(404, "Payment not found");
    }

    res.json(payment);
  } catch (error) {
    next(error);
  }
}

// Download payment statement
async function downloadStatement(req, res, next) {
  try {
    const userId = req.user.id;
    const { start_date, end_date } = req.query;

    let query = `
      SELECT vp.transaction_id, vp.amount, vp.discount_amount, vp.final_amount, 
             vp.status, vp.payment_date, pt.name as payment_type, 
             pm.display_name as payment_method
      FROM vendor_payments vp
      JOIN payment_types pt ON vp.payment_type_id = pt.id
      JOIN payment_methods pm ON vp.payment_method_id = pm.id
      WHERE vp.user_id = ?
    `;
    const params = [userId];

    if (start_date) {
      query += ` AND vp.payment_date >= ?`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND vp.payment_date <= ?`;
      params.push(end_date);
    }

    query += ` ORDER BY vp.payment_date DESC`;

    const [payments] = await pool.query(query, params);

    // Generate CSV content
    let csv = "Transaction ID,Payment Type,Payment Method,Amount,Discount,Final Amount,Status,Payment Date\n";
    payments.forEach(p => {
      csv += `${p.transaction_id},${p.payment_type},${p.payment_method},${p.amount},${p.discount_amount},${p.final_amount},${p.status},${p.payment_date}\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=payment-statement.csv");
    res.send(csv);
  } catch (error) {
    next(error);
  }
}

// Admin: Get all payments with filters
async function getAllPayments(req, res, next) {
  try {
    const { start_date, end_date, status, payment_type_id } = req.query;

    let query = `
      SELECT vp.id, vp.transaction_id, vp.amount, vp.discount_amount, vp.final_amount, 
             vp.status, vp.payment_date, vp.receipt_url, vp.notes,
             pt.name as payment_type, pm.display_name as payment_method,
             u.email, vprof.first_name, vprof.last_name, vprof.business_name
      FROM vendor_payments vp
      JOIN payment_types pt ON vp.payment_type_id = pt.id
      JOIN payment_methods pm ON vp.payment_method_id = pm.id
      JOIN users u ON u.id = vp.user_id
      LEFT JOIN vendor_profiles vprof ON vprof.user_id = vp.user_id
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      query += ` AND vp.payment_date >= ?`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND vp.payment_date <= ?`;
      params.push(end_date);
    }

    if (status) {
      query += ` AND vp.status = ?`;
      params.push(status);
    }

    if (payment_type_id) {
      query += ` AND vp.payment_type_id = ?`;
      params.push(payment_type_id);
    }

    query += ` ORDER BY vp.payment_date DESC`;

    const [payments] = await pool.query(query, params);

    // Get statistics
    const [[stats]] = await pool.query(
      `SELECT 
        COUNT(*) as total_payments,
        COALESCE(SUM(final_amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN final_amount ELSE 0 END), 0) as collected_amount,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN final_amount ELSE 0 END), 0) as pending_amount,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
       FROM vendor_payments`
    );

    res.json({
      payments,
      stats,
    });
  } catch (error) {
    next(error);
  }
}

// Admin: Get payment statistics
async function getPaymentStats(req, res, next) {
  try {
    const [[stats]] = await pool.query(
      `SELECT 
        COUNT(*) as total_payments,
        COALESCE(SUM(final_amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN final_amount ELSE 0 END), 0) as collected_amount,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN final_amount ELSE 0 END), 0) as pending_amount,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COALESCE(SUM(CASE WHEN MONTH(payment_date) = MONTH(NOW()) AND YEAR(payment_date) = YEAR(NOW()) AND status = 'completed' THEN final_amount ELSE 0 END), 0) as revenue_this_month,
        COALESCE(SUM(CASE WHEN DATE(payment_date) = CURDATE() AND status = 'completed' THEN final_amount ELSE 0 END), 0) as collected_today
       FROM vendor_payments`
    );

    res.json(stats);
  } catch (error) {
    next(error);
  }
}

// Admin: Create manual payment for a vendor
async function createAdminPayment(req, res, next) {
  try {
    const { user_id, payment_type_id, payment_method_id, amount, notes } = req.body;

    // Validate user exists
    const [[user]] = await pool.query(
      `SELECT id FROM users WHERE id = ? AND role = 'vendor'`,
      [user_id]
    );

    if (!user) {
      throw new ApiError(404, "Vendor not found");
    }

    const transactionId = generateTransactionId();

    // Create payment record
    const [result] = await pool.query(
      `INSERT INTO vendor_payments 
       (user_id, payment_type_id, payment_method_id, transaction_id, amount, 
        discount_amount, final_amount, status, payment_date, notes)
       VALUES (?, ?, ?, ?, ?, 0, ?, 'completed', NOW(), ?)`,
      [user_id, payment_type_id, payment_method_id, transactionId, amount, amount, notes]
    );

    res.status(201).json({
      id: result.insertId,
      transaction_id: transactionId,
      amount,
      final_amount: amount,
      status: "completed",
      payment_date: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPaymentDashboard,
  getPaymentOptions,
  validateDiscountCode,
  createPayment,
  getPaymentHistory,
  getPaymentReceipt,
  downloadStatement,
  getAllPayments,
  getPaymentStats,
  createAdminPayment,
};
