require('dotenv').config();
const pool = require("../src/config/db");

async function fixApprovedLicenses() {
  try {
    console.log("Starting license fix script...");
    console.log("Database config:", {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME
    });

    // Test connection
    console.log("Testing database connection...");
    await pool.getConnection();
    console.log("✅ Database connection successful");

    console.log("Fixing approved licenses...");

    // Update approved licenses with missing license numbers and dates
    const [result] = await pool.query(
      `UPDATE license_applications
       SET 
         license_number = CONCAT(
           CASE 
             WHEN application_ref LIKE 'LIC-%' THEN application_ref
             ELSE CONCAT('LIC-', application_ref)
           END,
           '-',
           YEAR(COALESCE(reviewed_at, submitted_at, NOW()))
         ),
         issued_at = COALESCE(reviewed_at, submitted_at, NOW()),
         expires_at = DATE_ADD(COALESCE(reviewed_at, submitted_at, NOW()), INTERVAL 365 DAY),
         qr_code_data = JSON_OBJECT(
           'license_number', CONCAT(
             CASE 
               WHEN application_ref LIKE 'LIC-%' THEN application_ref
               ELSE CONCAT('LIC-', application_ref)
             END,
             '-',
             YEAR(COALESCE(reviewed_at, submitted_at, NOW()))
           ),
           'zone', desired_zone,
           'issued_at', COALESCE(reviewed_at, submitted_at, NOW()),
           'expires_at', DATE_ADD(COALESCE(reviewed_at, submitted_at, NOW()), INTERVAL 365 DAY)
         )
       WHERE status = 'approved' 
         AND (license_number IS NULL OR license_number = '')`
    );

    console.log(`✅ Updated ${result.affectedRows} approved licenses`);

    // Verify the update
    const [rows] = await pool.query(
      `SELECT 
        id,
        application_ref,
        license_number,
        issued_at,
        expires_at,
        status
       FROM license_applications
       WHERE status = 'approved'
       ORDER BY reviewed_at DESC`
    );

    console.log("\n📋 Updated licenses:");
    console.table(rows);

    console.log("\n✅ Fix completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error fixing approved licenses:", err.message);
    console.error("Full error:", err);
    process.exit(1);
  }
}

fixApprovedLicenses();
