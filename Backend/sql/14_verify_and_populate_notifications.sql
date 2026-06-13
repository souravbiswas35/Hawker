-- Verify vendor_notifications table exists and populate with sample data if needed
-- BEFORE: 17_update_existing_notifications.sql
-- AFTER: 09_vendor_notifications_schema.sql, 11_complaint_comments.sql (Required)

USE hawker;

-- Check if table exists, create if not
CREATE TABLE IF NOT EXISTS vendor_notifications (
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
) ENGINE = InnoDB;

-- Insert sample notifications for all vendor users
-- First, get all vendor users and insert notifications for them
INSERT IGNORE INTO
    vendor_notifications (
        user_id,
        category,
        title,
        message,
        link,
        is_read,
        created_at
    )
SELECT
    id as user_id,
    'System announcements' as category,
    'Welcome to Hawker System' as title,
    'Welcome to the Hawker Urban Vending System! Your account has been successfully created.' as message,
    '/vendor/dashboard' as link,
    0 as is_read,
    NOW() as created_at
FROM users
WHERE
    role = 'vendor';

INSERT IGNORE INTO
    vendor_notifications (
        user_id,
        category,
        title,
        message,
        link,
        is_read,
        created_at
    )
SELECT
    id as user_id,
    'License updates' as category,
    'License Application Status' as title,
    'Your license application has been received and is under review. You will be notified once it is approved.' as message,
    '/vendor/applications' as link,
    0 as is_read,
    NOW() - INTERVAL 1 DAY as created_at
FROM users
WHERE
    role = 'vendor';

INSERT IGNORE INTO
    vendor_notifications (
        user_id,
        category,
        title,
        message,
        link,
        is_read,
        created_at
    )
SELECT
    id as user_id,
    'Payment reminders' as category,
    'Payment Confirmation' as title,
    'Your payment has been successfully processed. Thank you for your payment.' as message,
    '/vendor/applications' as link,
    1 as is_read,
    NOW() - INTERVAL 2 DAY as created_at
FROM users
WHERE
    role = 'vendor';

INSERT IGNORE INTO
    vendor_notifications (
        user_id,
        category,
        title,
        message,
        link,
        is_read,
        created_at
    )
SELECT
    id as user_id,
    'Renewal alerts' as category,
    'License Renewal Reminder' as title,
    'Your license will expire soon. Please renew your license to continue operating without interruption.' as message,
    '/vendor/license-renewal' as link,
    0 as is_read,
    NOW() - INTERVAL 3 DAY as created_at
FROM users
WHERE
    role = 'vendor';

INSERT IGNORE INTO
    vendor_notifications (
        user_id,
        category,
        title,
        message,
        link,
        is_read,
        created_at
    )
SELECT
    id as user_id,
    'Zone changes' as category,
    'Zone Update Notice' as title,
    'There have been updates to your vending zone regulations. Please review the new guidelines.' as message,
    '/vendor/my-zone' as link,
    0 as is_read,
    NOW() - INTERVAL 4 DAY as created_at
FROM users
WHERE
    role = 'vendor';

-- Verify the data was inserted
SELECT COUNT(*) as total_notifications FROM vendor_notifications;

SELECT
    user_id,
    category,
    title,
    is_read,
    created_at
FROM vendor_notifications
ORDER BY created_at DESC
LIMIT 10;