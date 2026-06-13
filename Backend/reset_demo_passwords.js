const bcrypt = require("bcryptjs");
const pool = require("./src/config/db");

async function resetDemoPasswords() {
  try {
    console.log("Generating password hashes...");

    // Generate correct hashes
    const inspectorPassword = "Inspector123!";
    const cityCorpPassword = "CityCorp123!";

    const inspectorHash = await bcrypt.hash(inspectorPassword, 12);
    const cityCorpHash = await bcrypt.hash(cityCorpPassword, 12);

    console.log("Inspector password hash:", inspectorHash);
    console.log("City Corp password hash:", cityCorpHash);

    // Update inspector password
    await pool.query(
      "UPDATE users SET password_hash = ? WHERE email = 'inspector@hawker.com'",
      [inspectorHash]
    );
    console.log("✓ Updated inspector@hawker.com password");

    // Update city corp admin password
    await pool.query(
      "UPDATE users SET password_hash = ? WHERE email = 'citycorp@hawker.com'",
      [cityCorpHash]
    );
    console.log("✓ Updated citycorp@hawker.com password");

    console.log("\nDemo passwords have been reset:");
    console.log("  Inspector: inspector@hawker.com / Inspector123!");
    console.log("  City Corp Admin: citycorp@hawker.com / CityCorp123!");

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

resetDemoPasswords();
