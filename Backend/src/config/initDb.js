const pool = require("./db");

async function initializeDatabase() {
  try {
    console.log("Checking users table...");
    
    // Check if users table exists and has data
    const [users] = await pool.query("SELECT COUNT(*) as count FROM users");
    console.log(`Total users in database: ${users[0].count}`);

    // If no users, insert demo data
    if (users[0].count === 0) {
      console.log("No users found, inserting demo data...");
      
      await pool.query(`
        INSERT INTO users (id, email, password_hash, role, is_email_verified, account_status)
        VALUES 
          (1, 'admin@hawker.gov', '$2b$12$8E0BmN5nuE0hHFmkggTNI.PI6yJ7uzBNoKb3L7lnagUt0j/ElGT1S', 'admin', 1, 'active'),
          (2, 'vendor1@hawker.app', '$2b$12$xL8/ort9VXbFCfH6KgHphuZKgSOm.yvjkcyy0N7oB59/mEVHsw1qu', 'vendor', 1, 'active'),
          (3, 'vendor2@hawker.app', '$2b$12$Ep37CQc/s3lyTcpmW4OceObIUAPTbboE1jkZSO9pjSkOkbfIm1/5e', 'vendor', 1, 'active')
      `);
      
      await pool.query(`
        INSERT INTO vendor_profiles (user_id, first_name, last_name, phone, national_id, date_of_birth, address, business_name, business_type, vending_zone)
        VALUES 
          (2, 'Rahim', 'Khan', '+8801711111111', 'NID-1000001', '1993-04-16', 'Road 12, Dhaka', 'Rahim Fast Bites', 'Street Food', 'Zone-A'),
          (3, 'Sadia', 'Akter', '+8801811111111', 'NID-1000002', '1996-08-11', 'Road 2, Chattogram', 'Sadia Fresh Juice', 'Beverage', 'Zone-B')
      `);
      
      console.log("Demo users inserted successfully");
    }

    console.log("Checking vendor_notifications table...");
    
    // Check if table exists
    const [tables] = await pool.query("SHOW TABLES LIKE 'vendor_notifications'");
    
    if (tables.length === 0) {
      console.log("Creating vendor_notifications table...");
      await pool.query(`
        CREATE TABLE vendor_notifications (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          user_id BIGINT UNSIGNED NOT NULL,
          category ENUM(
            'License updates',
            'Payment reminders',
            'Renewal alerts',
            'Zone changes',
            'Inspection notices',
            'System announcements'
          ) NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          link VARCHAR(255) NULL,
          is_read TINYINT(1) NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY idx_vendor_notifications_user (user_id),
          KEY idx_vendor_notifications_category (category),
          KEY idx_vendor_notifications_read (is_read),
          CONSTRAINT fk_vendor_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        ) ENGINE = InnoDB
      `);
      console.log("vendor_notifications table created successfully");
    } else {
      console.log("vendor_notifications table already exists");
    }

    // Check if there are any notifications
    const [count] = await pool.query("SELECT COUNT(*) as count FROM vendor_notifications");
    console.log(`Total notifications in database: ${count[0].count}`);

    // If no notifications, add sample data for all vendor users
    if (count[0].count === 0) {
      console.log("No notifications found, adding sample data...");
      
      const [vendorUsers] = await pool.query("SELECT id FROM users WHERE role = 'vendor'");
      console.log(`Found ${vendorUsers.length} vendor users`);

      for (const user of vendorUsers) {
        await pool.query(`
          INSERT INTO vendor_notifications (user_id, category, title, message, link, is_read, created_at)
          VALUES (?, 'System announcements', 'Welcome to Hawker System', 
          'Welcome to the Hawker Urban Vending System! Your account has been successfully created.', 
          '/vendor/dashboard', 0, NOW())
        `, [user.id]);

        await pool.query(`
          INSERT INTO vendor_notifications (user_id, category, title, message, link, is_read, created_at)
          VALUES (?, 'License updates', 'License Application Status', 
          'Your license application has been received and is under review. You will be notified once it is approved.', 
          '/vendor/applications', 0, NOW() - INTERVAL 1 DAY)
        `, [user.id]);

        await pool.query(`
          INSERT INTO vendor_notifications (user_id, category, title, message, link, is_read, created_at)
          VALUES (?, 'Payment reminders', 'Payment Confirmation', 
          'Your payment has been successfully processed. Thank you for your payment.', 
          '/vendor/applications', 1, NOW() - INTERVAL 2 DAY)
        `, [user.id]);

        await pool.query(`
          INSERT INTO vendor_notifications (user_id, category, title, message, link, is_read, created_at)
          VALUES (?, 'Renewal alerts', 'License Renewal Reminder', 
          'Your license will expire soon. Please renew your license to continue operating without interruption.', 
          '/vendor/license-renewal', 0, NOW() - INTERVAL 3 DAY)
        `, [user.id]);

        await pool.query(`
          INSERT INTO vendor_notifications (user_id, category, title, message, link, is_read, created_at)
          VALUES (?, 'Zone changes', 'Zone Update Notice', 
          'There have been updates to your vending zone regulations. Please review the new guidelines.', 
          '/vendor/my-zone', 0, NOW() - INTERVAL 4 DAY)
        `, [user.id]);
      }

      console.log("Sample notifications added successfully");
    }

    console.log("Database initialization complete");
  } catch (err) {
    console.error("Error initializing database:", err);
    throw err;
  }
}

module.exports = initializeDatabase;
