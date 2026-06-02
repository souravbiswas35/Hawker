-- Vendor notifications schema and defaults
-- Run this file after 08_final_admin_setup.sql

USE hawker;

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

CREATE TABLE IF NOT EXISTS vendor_notification_preferences (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    email_notifications TINYINT(1) NOT NULL DEFAULT 1,
    sms_notifications TINYINT(1) NOT NULL DEFAULT 1,
    push_notifications TINYINT(1) NOT NULL DEFAULT 0,
    license_updates TINYINT(1) NOT NULL DEFAULT 1,
    payment_alerts TINYINT(1) NOT NULL DEFAULT 1,
    renewal_reminders TINYINT(1) NOT NULL DEFAULT 1,
    zone_changes TINYINT(1) NOT NULL DEFAULT 1,
    inspection_notices TINYINT(1) NOT NULL DEFAULT 1,
    system_announcements TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_vendor_notification_preferences_user (user_id),
    CONSTRAINT fk_vendor_notification_preferences_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB;

INSERT INTO vendor_notification_preferences (
    user_id,
    email_notifications,
    sms_notifications,
    push_notifications,
    license_updates,
    payment_alerts,
    renewal_reminders,
    zone_changes,
    inspection_notices,
    system_announcements
)
VALUES
    (2, 1, 1, 0, 1, 1, 1, 1, 1, 1),
    (3, 1, 1, 0, 1, 1, 1, 1, 1, 1);

INSERT INTO vendor_notifications (user_id, category, title, message, link, is_read, created_at)
VALUES
    (2, 'Renewal alerts', 'License Renewal Reminder', 'Your license expires in 15 days on January 25, 2026. Renew now to avoid interruption and get an early renewal discount of 5%.', '/vendor/applications', 0, NOW() - INTERVAL 2 DAY),
    (2, 'Payment reminders', 'Payment Successful', 'Your payment of ৳2,850 for License Application Fee has been successfully processed. Transaction ID: TXN261001.', '/vendor/applications', 1, NOW() - INTERVAL 1 DAY),
    (2, 'Inspection notices', 'Inspection Scheduled', 'Field inspection has been scheduled for January 12, 2026 at 10:00 AM. Inspector Rajesh Singh will visit your vending location.', '/vendor/applications', 0, NOW() - INTERVAL 3 DAY),
    (2, 'License updates', 'Application Approved', 'Great news! Your license application (APP25001234) has been approved. Your digital license is now ready to download.', '/vendor/applications', 0, NOW() - INTERVAL 4 DAY),
    (2, 'System announcements', 'New Feature: Mobile App Available', 'Download our new mobile app for easier access to your license, quick payments, and instant notifications. Available on iOS and Android.', '/vendor/announcements', 1, NOW() - INTERVAL 5 DAY),
    (3, 'Zone changes', 'Important: Zone Rules Update', 'New operating hours effective from February 1, 2026: 7:00 AM - 11:00 PM. Please review updated zone regulations.', '/vendor/my-zone', 0, NOW() - INTERVAL 7 DAY);