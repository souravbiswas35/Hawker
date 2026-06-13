const pool = require("./src/config/db");

async function runMigration() {
  try {
    console.log("Running notification action types migration...");

    // First, update NULL values to 'approve'
    await pool.query(
      "UPDATE vendor_notifications SET action_type = 'approve' WHERE action_type IS NULL"
    );
    console.log("✓ Updated NULL action_type values to 'approve'");

    // Then, update any existing action_type values that might not be in the new ENUM
    await pool.query(
      "UPDATE vendor_notifications SET action_type = 'approve' WHERE action_type NOT IN ('approve', 'reject', 'need_info')"
    );
    console.log("✓ Updated existing action_type values");

    // Modify the action_type column to include new action types
    await pool.query(
      `ALTER TABLE vendor_notifications
       MODIFY COLUMN action_type ENUM(
         'approve',
         'reject',
         'need_info',
         'document_approved',
         'document_rejected',
         'inspection_assigned',
         'inspection_scheduled',
         'inspection_conducted',
         'inspection_passed',
         'inspection_failed',
         'city_corp_approved',
         'city_corp_rejected'
       ) NOT NULL DEFAULT 'approve'`
    );
    console.log("✓ Updated action_type ENUM");

    console.log("\nMigration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

runMigration();
