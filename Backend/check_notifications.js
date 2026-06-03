const mysql = require('mysql2/promise');

async function checkNotifications() {
  const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'hawker',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  try {
    // Check if table exists
    const [tables] = await pool.query("SHOW TABLES LIKE 'vendor_notifications'");
    console.log('Tables found:', tables.length > 0 ? 'vendor_notifications exists' : 'Table does not exist');

    if (tables.length > 0) {
      // Count notifications
      const [count] = await pool.query("SELECT COUNT(*) as count FROM vendor_notifications");
      console.log('Total notifications:', count[0].count);

      // Get sample data
      const [rows] = await pool.query("SELECT user_id, category, title, is_read, created_at FROM vendor_notifications LIMIT 5");
      console.log('Sample notifications:', JSON.stringify(rows, null, 2));

      // Get all vendor users
      const [users] = await pool.query("SELECT id, role FROM users WHERE role = 'vendor'");
      console.log('Vendor users:', JSON.stringify(users, null, 2));
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkNotifications();
