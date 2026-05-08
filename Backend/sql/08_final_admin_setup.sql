-- Final Admin Setup Migration
-- This script safely adds all required admin functionality

-- Create application audit logs table
CREATE TABLE IF NOT EXISTS application_audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  action_by INT NOT NULL,
  action_type ENUM('approved', 'rejected', 'needs-info', 'updated', 'submitted') NOT NULL,
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_application_audit (application_id),
  INDEX idx_action_by (action_by)
);

-- Create admin notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'warning', 'success', 'error') DEFAULT 'info',
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_notifications (admin_id),
  INDEX idx_admin_notifications_read (read_at)
);

-- Create application status history table
CREATE TABLE IF NOT EXISTS application_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  from_status VARCHAR(50) NULL,
  to_status VARCHAR(50) NOT NULL,
  changed_by INT NOT NULL,
  change_reason TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status_history (application_id),
  INDEX idx_status_history_changed_by (changed_by)
);

-- Safely add columns to license_applications table
-- Using stored procedure to avoid duplicate errors
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS add_admin_columns()
BEGIN
    -- Add admin_remarks if not exists
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE table_schema = DATABASE() 
                 AND table_name = 'license_applications' 
                 AND column_name = 'admin_remarks') THEN
        ALTER TABLE license_applications ADD COLUMN admin_remarks TEXT NULL;
    END IF;
    
    -- Add business_details if not exists
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE table_schema = DATABASE() 
                 AND table_name = 'license_applications' 
                 AND column_name = 'business_details') THEN
        ALTER TABLE license_applications ADD COLUMN business_details JSON NULL;
    END IF;
    
    -- Add document_verification if not exists
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE table_schema = DATABASE() 
                 AND table_name = 'license_applications' 
                 AND column_name = 'document_verification') THEN
        ALTER TABLE license_applications ADD COLUMN document_verification JSON NULL;
    END IF;
    
    -- Add payment_details if not exists
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE table_schema = DATABASE() 
                 AND table_name = 'license_applications' 
                 AND column_name = 'payment_details') THEN
        ALTER TABLE license_applications ADD COLUMN payment_details JSON NULL;
    END IF;
    
    -- Add final_submission if not exists
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE table_schema = DATABASE() 
                 AND table_name = 'license_applications' 
                 AND column_name = 'final_submission') THEN
        ALTER TABLE license_applications ADD COLUMN final_submission JSON NULL;
    END IF;
    
    -- Add reviewed_at if not exists
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE table_schema = DATABASE() 
                 AND table_name = 'license_applications' 
                 AND column_name = 'reviewed_at') THEN
        ALTER TABLE license_applications ADD COLUMN reviewed_at TIMESTAMP NULL;
    END IF;
    
    -- Add reviewed_by if not exists
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE table_schema = DATABASE() 
                 AND table_name = 'license_applications' 
                 AND column_name = 'reviewed_by') THEN
        ALTER TABLE license_applications ADD COLUMN reviewed_by INT NULL;
    END IF;
END //
DELIMITER ;

-- Execute the stored procedure
CALL add_admin_columns();

-- Drop the stored procedure
DROP PROCEDURE IF EXISTS add_admin_columns;

-- Update status ENUM to include all needed statuses
ALTER TABLE license_applications 
MODIFY COLUMN status ENUM('draft', 'submitted', 'approved', 'rejected', 'needs-info', 'cancelled');

-- Add foreign key constraint for reviewed_by
ALTER TABLE license_applications 
ADD CONSTRAINT fk_license_applications_reviewed_by 
FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;

-- Insert sample admin notification
INSERT IGNORE INTO admin_notifications (admin_id, title, message, type) 
SELECT id, 'Admin System Ready', 'Enhanced application management system is now available.', 'success'
FROM users 
WHERE role = 'admin' 
LIMIT 1;
