const pool = require("./src/config/db");

async function checkActionTypes() {
  try {
    console.log("Checking current action_type values in vendor_notifications...");

    const [rows] = await pool.query(
      "SELECT DISTINCT action_type FROM vendor_notifications"
    );

    console.log("Current action_type values:");
    rows.forEach(row => {
      console.log(`  - ${row.action_type}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

checkActionTypes();
