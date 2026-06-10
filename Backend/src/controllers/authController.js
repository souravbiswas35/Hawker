const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const ApiError = require("../utils/apiError");
const { signToken } = require("../utils/token");
const {
  createEmailVerification,
  sendVerificationCode,
  hashCode,
} = require("../services/emailService");

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return typeof password === "string" && password.length >= 8;
}

async function register(req, res, next) {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    if (!validateEmail(email)) {
      throw new ApiError(400, "Please provide a valid email address");
    }

    if (!validatePassword(password)) {
      throw new ApiError(400, "Password must be at least 8 characters long");
    }

    const [existingRows] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email],
    );
    if (existingRows.length > 0) {
      throw new ApiError(409, "Email is already registered");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await pool.query(
      `INSERT INTO users (email, password_hash, role, is_email_verified, account_status)
       VALUES (?, ?, 'vendor', 0, 'active')`,
      [email, passwordHash],
    );

    const code = await createEmailVerification(result.insertId, email);
    const emailResult = await sendVerificationCode(email, code);

    let message = "Registration successful. Verification code sent to email.";
    if (emailResult.simulated) {
      message = "Registration successful. Check console for verification code (SMTP not configured).";
    }

    res.status(201).json({
      message,
      simulated: emailResult.simulated,
    });
  } catch (err) {
    next(err);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const email = normalizeEmail(req.body.email);
    const code = String(req.body.code || "").trim();

    if (!validateEmail(email) || code.length !== 6) {
      throw new ApiError(400, "Invalid email or verification code format");
    }

    const [userRows] = await pool.query(
      "SELECT id, role FROM users WHERE email = ?",
      [email],
    );
    if (userRows.length === 0) {
      throw new ApiError(404, "Account not found");
    }

    const user = userRows[0];

    const [codeRows] = await pool.query(
      `SELECT id, code_hash, expires_at, is_used
       FROM email_verifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [user.id],
    );

    if (codeRows.length === 0) {
      throw new ApiError(400, "No verification request found");
    }

    const latest = codeRows[0];
    if (latest.is_used) {
      throw new ApiError(400, "This verification code is already used");
    }

    if (new Date(latest.expires_at) < new Date()) {
      throw new ApiError(400, "Verification code has expired");
    }

    if (hashCode(code) !== latest.code_hash) {
      throw new ApiError(400, "Incorrect verification code");
    }

    await pool.query(
      "UPDATE email_verifications SET is_used = 1 WHERE id = ?",
      [latest.id],
    );
    await pool.query("UPDATE users SET is_email_verified = 1 WHERE id = ?", [
      user.id,
    ]);

    const token = signToken({ id: user.id, role: user.role, email });

    res.json({
      message: "Email verified successfully",
      token,
      user: { id: user.id, role: user.role, email },
    });
  } catch (err) {
    next(err);
  }
}

async function resendCode(req, res, next) {
  try {
    const email = normalizeEmail(req.body.email);

    const [userRows] = await pool.query(
      "SELECT id, is_email_verified FROM users WHERE email = ?",
      [email],
    );

    if (userRows.length === 0) {
      throw new ApiError(404, "Account not found");
    }

    if (userRows[0].is_email_verified) {
      throw new ApiError(400, "Email is already verified");
    }

    const code = await createEmailVerification(userRows[0].id, email);
    const emailResult = await sendVerificationCode(email, code);

    let message = "New verification code sent to email.";
    if (emailResult.simulated) {
      message = "New verification code generated. Check console for code (SMTP not configured).";
    }

    res.json({ message, simulated: emailResult.simulated });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    const [rows] = await pool.query(
      "SELECT id, email, password_hash, role, is_email_verified, account_status FROM users WHERE email = ?",
      [email],
    );

    if (rows.length === 0) {
      throw new ApiError(401, "Invalid email or password");
    }

    const user = rows[0];

    if (user.account_status !== "active") {
      throw new ApiError(403, "Your account is not active");
    }

    const passwordMatch = await bcrypt.compare(
      password || "",
      user.password_hash || "",
    );
    if (!passwordMatch) {
      throw new ApiError(401, "Invalid email or password");
    }

    if (user.role === "vendor" && !user.is_email_verified) {
      throw new ApiError(403, "Please verify your email before login");
    }

    const token = signToken({
      id: user.id,
      role: user.role,
      email: user.email,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isEmailVerified: Boolean(user.is_email_verified),
      },
    });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const [rows] = await pool.query(
      "SELECT id, email, role, is_email_verified, created_at FROM users WHERE id = ?",
      [req.user.id],
    );

    if (rows.length === 0) {
      throw new ApiError(404, "User not found");
    }

    const user = rows[0];
    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isEmailVerified: Boolean(user.is_email_verified),
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  verifyEmail,
  resendCode,
  login,
  me,
};
