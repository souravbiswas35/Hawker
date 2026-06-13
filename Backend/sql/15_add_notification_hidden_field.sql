-- Add hidden/dismissed field to vendor_notifications table
-- Run this to add the ability to hide/dismiss notifications
-- BEFORE: 16_enhance_notifications_schema.sql, 17_update_existing_notifications.sql
-- AFTER: 09_vendor_notifications_schema.sql (Required)

USE hawker;

-- Add is_hidden field to vendor_notifications
ALTER TABLE vendor_notifications
ADD COLUMN is_hidden TINYINT(1) NOT NULL DEFAULT 0 AFTER is_read,
ADD INDEX idx_vendor_notifications_hidden (is_hidden);

-- Update existing notifications to ensure they are not hidden by default
UPDATE vendor_notifications
SET
    is_hidden = 0
WHERE
    is_hidden IS NULL;