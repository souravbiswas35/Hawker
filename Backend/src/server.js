const app = require("./app");
const pool = require("./config/db");
const { port } = require("./config/env");

async function start() {
  try {
    await pool.query("SELECT 1");
    app.listen(port, () => {
      console.log(`Hawker backend is running on port ${port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

start();
