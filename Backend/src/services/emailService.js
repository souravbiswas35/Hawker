const crypto = require("crypto");
const pool = require("../config/db");
const { transporter, isSmtpConfigured } = require("../config/mailer");
const { smtp } = require("../config/env");

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

async function createEmailVerification(userId, email) {
  const code = generateCode();
  const codeHash = hashCode(code);

  await pool.query(
    `INSERT INTO email_verifications (user_id, email, code_hash, expires_at)
     VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))`,
    [userId, email, codeHash],
  );

  return code;
}

async function sendVerificationCode(email, code) {
  const subject = "Verify your Hawker account";
  const text = `Your Hawker verification code is ${code}. It will expire in 15 minutes.`;

  if (!isSmtpConfigured) {
    console.log(`[EMAIL_SIMULATION] To: ${email} | Code: ${code}`);
    console.log(`[EMAIL_SIMULATION] SMTP not configured. Configure SMTP_HOST, SMTP_USER, SMTP_PASS in .env file to send real emails.`);
    return { simulated: true, code };
  }

  try {
    await transporter.sendMail({
      from: smtp.from,
      to: email,
      subject,
      text,
    });
    console.log(`[EMAIL_SENT] Verification code sent to ${email}`);
    return { simulated: false };
  } catch (error) {
    console.error(`[EMAIL_ERROR] Failed to send email to ${email}:`, error.message);
    console.log(`[EMAIL_FALLBACK] Code for ${email}: ${code}`);
    return { simulated: true, error: error.message, code };
  }
}

module.exports = {
  createEmailVerification,
  sendVerificationCode,
  hashCode,
};
