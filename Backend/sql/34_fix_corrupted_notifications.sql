-- Fix corrupted notification data
USE hawker;

-- Check for notifications with NULL or invalid IDs
SELECT id, user_id, title, message, created_at
FROM vendor_notifications
WHERE id IS NULL OR id = 0 OR user_id IS NULL;

-- Check for notifications with undefined string in any field
SELECT id, user_id, title, message, category, created_at
FROM vendor_notifications
WHERE title = 'undefined' OR message = 'undefined' OR category = 'undefined';

-- Delete any corrupted notifications with NULL IDs
DELETE FROM vendor_notifications
WHERE id IS NULL OR id = 0;

-- Update notifications with undefined strings to NULL
UPDATE vendor_notifications
SET title = NULL WHERE title = 'undefined';

UPDATE vendor_notifications
SET message = NULL WHERE message = 'undefined';

UPDATE vendor_notifications
SET category = NULL WHERE category = 'undefined';

-- Ensure all notifications have valid user_id
DELETE FROM vendor_notifications
WHERE user_id IS NULL OR user_id = 0;

-- Verify the fixes
SELECT COUNT(*) as total_notifications,
       SUM(CASE WHEN id IS NOT NULL AND id != 0 THEN 1 ELSE 0 END) as valid_notifications,
       SUM(CASE WHEN user_id IS NOT NULL AND user_id != 0 THEN 1 ELSE 0 END) as notifications_with_valid_user
FROM vendor_notifications;
