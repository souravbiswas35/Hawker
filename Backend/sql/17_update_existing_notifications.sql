-- Update existing notifications with proper data
-- This script updates old notifications to have proper title and message
-- BEFORE: 18_insert_test_notification.sql, 36_update_notification_action_types.sql
-- AFTER: 14_verify_and_populate_notifications.sql, 15_add_notification_hidden_field.sql (Required)

USE hawker;

-- Update notifications with missing titles
UPDATE vendor_notifications
SET
    title = CASE
        WHEN category = 'License updates' THEN 'License Update'
        WHEN category = 'Payment reminders' THEN 'Payment Reminder'
        WHEN category = 'Renewal alerts' THEN 'Renewal Alert'
        WHEN category = 'Zone changes' THEN 'Zone Change'
        WHEN category = 'Inspection notices' THEN 'Inspection Notice'
        WHEN category = 'System announcements' THEN 'System Announcement'
        ELSE 'Notification'
    END
WHERE
    title IS NULL
    OR title = '';

-- Update notifications with missing messages
UPDATE vendor_notifications
SET
    message = CASE
        WHEN category = 'License updates' THEN 'Your license application has been updated. Please check your applications page for details.'
        WHEN category = 'Payment reminders' THEN 'Payment reminder: Please check your payment status.'
        WHEN category = 'Renewal alerts' THEN 'Your license renewal is due soon. Please renew to avoid interruption.'
        WHEN category = 'Zone changes' THEN 'There has been a change to your assigned vending zone.'
        WHEN category = 'Inspection notices' THEN 'An inspection has been scheduled for your vending location.'
        WHEN category = 'System announcements' THEN 'Important system announcement. Please check for details.'
        ELSE 'Notification details'
    END
WHERE
    message IS NULL
    OR message = '';

-- Set default action_type for existing notifications
UPDATE vendor_notifications
SET
    action_type = CASE
        WHEN category = 'Payment reminders' THEN 'payment'
        WHEN category = 'Renewal alerts' THEN 'renewal'
        WHEN category = 'Zone changes' THEN 'zone_change'
        WHEN category = 'Inspection notices' THEN 'inspection'
        WHEN category = 'System announcements' THEN 'system'
        ELSE 'system'
    END
WHERE
    action_type IS NULL;