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

    console.log("Checking women_success_stories table...");

    // Disable foreign key checks to allow dropping tables
    await pool.query("SET FOREIGN_KEY_CHECKS = 0");

    // Drop and recreate women_success_stories table to ensure correct schema
    await pool.query("DROP TABLE IF EXISTS women_success_stories");
    console.log("Dropped existing women_success_stories table");
    
    console.log("Creating women_success_stories table...");
    await pool.query(`
      CREATE TABLE women_success_stories (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        vendor_name VARCHAR(255) NOT NULL,
        business_category VARCHAR(255) NOT NULL,
        earnings_monthly VARCHAR(255) NOT NULL,
        story_title VARCHAR(255) NOT NULL,
        full_story TEXT NOT NULL,
        business_journey TEXT NOT NULL,
        is_approved TINYINT(1) NOT NULL DEFAULT 0,
        created_by BIGINT UNSIGNED NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_stories_approved (is_approved),
        KEY idx_stories_created_by (created_by),
        CONSTRAINT fk_stories_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE = InnoDB
    `);
    console.log("women_success_stories table created successfully");

    // Insert sample success stories if none exist
    const [storiesCount] = await pool.query("SELECT COUNT(*) as count FROM women_success_stories");
    if (storiesCount[0].count === 0) {
      console.log("Adding sample success stories...");
      await pool.query(`
        INSERT INTO women_success_stories (vendor_name, business_category, earnings_monthly, story_title, full_story, business_journey, is_approved, created_by)
        VALUES 
          ('Afifa Tasnim', 'Handicrafts', '৳ 1 Lac/month', 'From Home to Market', 'Afifa started her handicraft business from her small home in Dhaka. With the help of the women vendor support program, she got a subsidy for her materials and training on business management. Today she runs a successful stall at Central Market Plaza.', 'Started with homemade crafts, received training and subsidy, expanded to market stall, now earning stable income.', 1, 2),
          ('Rashida Akter', 'Food & Beverages', '৳ 80,000/month', 'Street Food Success', 'Rashida began selling traditional snacks from her home. After getting her vending license through Hawker, she secured a prime location at Jatra Bari Bus Stand. Her authentic recipes have made her a local favorite.', 'Home-based food business, got license through Hawker, secured prime location, became local favorite.', 1, 2),
          ('Fatima Rahman', 'Clothing', '৳ 1.2 Lac/month', 'Fashion Forward', 'Fatima had a passion for fashion but no capital. The women vendor mentorship program connected her with experienced mentors who guided her business planning. She now operates a successful clothing stall.', 'Passion for fashion, joined mentorship program, got business guidance, successful clothing stall.', 1, 3)
      `);
      console.log("Sample success stories added successfully");
    }

    console.log("Checking women_community_posts table...");

    // Drop and recreate women_community_posts table to ensure correct schema
    await pool.query("DROP TABLE IF EXISTS women_community_posts");
    console.log("Dropped existing women_community_posts table");
    
    console.log("Creating women_community_posts table...");
    await pool.query(`
      CREATE TABLE women_community_posts (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        author_id BIGINT UNSIGNED NOT NULL,
        author_name VARCHAR(255) NOT NULL,
        business_category VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category ENUM('general', 'business', 'support', 'success', 'events') NOT NULL DEFAULT 'general',
        likes_count INT NOT NULL DEFAULT 0,
        comments_count INT NOT NULL DEFAULT 0,
        is_approved TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_posts_author (author_id),
        KEY idx_posts_category (category),
        KEY idx_posts_approved (is_approved),
        CONSTRAINT fk_posts_author FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE = InnoDB
    `);
    console.log("women_community_posts table created successfully");

    // Insert sample community posts if none exist
    const [postsCount] = await pool.query("SELECT COUNT(*) as count FROM women_community_posts");
    if (postsCount[0].count === 0) {
      console.log("Adding sample community posts...");
      await pool.query(`
        INSERT INTO women_community_posts (author_id, author_name, business_category, content, category, likes_count, comments_count, is_approved)
        VALUES 
          (2, 'Fatima Rahman', 'Food & Beverages', 'Just got my first vending license! Thanks to the Hawker platform, the process was so smooth. Any tips for a beginner?', 'success', 24, 8, 1),
          (3, 'Ayesha Begum', 'Handicrafts', 'Does anyone know which zones have the best foot traffic for handicrafts? Looking to expand to a new location.', 'business', 15, 12, 1),
          (2, 'Rashida Akter', 'Clothing', 'Great news! The women vendor support program helped me get a subsidy for my new stall. Highly recommend applying!', 'success', 42, 5, 1),
          (3, 'Nusrat Jahan', 'Food & Beverages', 'Looking for advice on managing inventory during peak hours. How do you handle the rush?', 'support', 18, 9, 1),
          (2, 'Shamima Akter', 'Handicrafts', 'Joining this community has been amazing! Learned so much from fellow women entrepreneurs. Let us support each other! 💪', 'general', 56, 14, 1)
      `);
      console.log("Sample community posts added successfully");
    }

    // Re-enable foreign key checks
    await pool.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("Database initialization complete");
  } catch (err) {
    console.error("Error initializing database:", err);
    throw err;
  }
}

module.exports = initializeDatabase;
