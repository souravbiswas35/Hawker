-- Final Admin Setup Migration
-- This script safely adds all required admin functionality

USE hawker;

-- Create application audit logs table
CREATE TABLE IF NOT EXISTS application_audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    action_by INT NOT NULL,
    action_type ENUM(
        'approved',
        'rejected',
        'needs-info',
        'updated',
        'submitted'
    ) NOT NULL,
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
    type ENUM(
        'info',
        'warning',
        'success',
        'error'
    ) DEFAULT 'info',
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

-- Column and FK setup is handled by base and feature schema files.

-- Insert sample admin notification
INSERT IGNORE INTO
    admin_notifications (
        admin_id,
        title,
        message,
        type
    )
SELECT id, 'Admin System Ready', 'Enhanced application management system is now available.', 'success'
FROM users
WHERE
    role = 'admin'
LIMIT 1;

-- Backfill audit history for existing applications so Recent Activity has data
INSERT INTO
    application_audit_logs (
        application_id,
        action_by,
        action_type,
        comments,
        created_at
    )
SELECT la.id, la.user_id, 'submitted', 'Application submitted by vendor', la.submitted_at
FROM license_applications la
WHERE
    NOT EXISTS (
        SELECT 1
        FROM application_audit_logs aal
        WHERE
            aal.application_id = la.id
            AND aal.action_type = 'submitted'
    );

INSERT INTO
    application_audit_logs (
        application_id,
        action_by,
        action_type,
        comments,
        created_at
    )
SELECT la.id, COALESCE(la.reviewed_by, la.user_id), la.status, COALESCE(
        la.admin_remarks, CONCAT(
            'Application marked as ', la.status
        )
    ), COALESCE(
        la.reviewed_at, la.submitted_at
    )
FROM license_applications la
WHERE
    la.status IN (
        'approved',
        'rejected',
        'needs-info'
    )
    AND NOT EXISTS (
        SELECT 1
        FROM application_audit_logs aal
        WHERE
            aal.application_id = la.id
            AND aal.action_type = la.status
    );