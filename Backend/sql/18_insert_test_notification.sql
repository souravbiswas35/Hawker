-- Insert a test notification to verify the notification system works
-- BEFORE: Can run anytime after notifications are set up
-- AFTER: 17_update_existing_notifications.sql (Required)

USE hawker;

-- Get a vendor user ID (you may need to adjust this based on your data)
SET
    @vendor_user_id = (
        SELECT id
        FROM users
        WHERE
            role = 'vendor'
        LIMIT 1
    );

-- Insert a test notification
INSERT INTO
    vendor_notifications (
        user_id,
        category,
        title,
        message,
        link,
        is_read,
        created_at,
        updated_at
    )
VALUES (
        @vendor_user_id,
        'System announcements',
        'Test Notification',
        'This is a test notification to verify the notification system is working correctly.',
        '/vendor/notifications',
        0,
        NOW(),
        NOW()
    );

SELECT 'Test notification inserted successfully' AS result;