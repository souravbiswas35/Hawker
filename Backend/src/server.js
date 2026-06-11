const app = require("./app");
const pool = require("./config/db");
const { port } = require("./config/env");
const initializeDatabase = require("./config/initDb");

async function start() {
  try {
    await pool.query("SELECT 1");
    
    // Initialize database tables and data
    await initializeDatabase();
    
    app.listen(port, () => {
      console.log(`Hawker backend is running on port ${port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
