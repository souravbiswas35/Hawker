-- Admin feature schema extension
-- Run this after 03_license_application_schema.sql

USE hawker;

CREATE TABLE IF NOT EXISTS generated_reports (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(80) NOT NULL,
    report_period VARCHAR(80) NOT NULL,
    visual_type VARCHAR(40) NOT NULL,
    filters_json JSON NULL,
    status ENUM(
        'queued',
        'processing',
        'ready',
        'failed'
    ) NOT NULL DEFAULT 'ready',
    generated_by BIGINT UNSIGNED NULL,
    file_size_kb INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_generated_reports_type (report_type),
    KEY idx_generated_reports_created (created_at),
    CONSTRAINT fk_generated_reports_user FOREIGN KEY (generated_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS vendor_complaints (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    complaint_ref VARCHAR(40) NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    subject VARCHAR(200) NOT NULL,
    category VARCHAR(120) NOT NULL,
    priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
    status ENUM(
        'new',
        'in_progress',
        'resolved',
        'closed'
    ) NOT NULL DEFAULT 'new',
    description TEXT NOT NULL,
    resolution_note TEXT NULL,
    resolved_by BIGINT UNSIGNED NULL,
    resolved_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_vendor_complaints_ref (complaint_ref),
    KEY idx_vendor_complaints_user (user_id),
    KEY idx_vendor_complaints_status (status),
    CONSTRAINT fk_vendor_complaints_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_vendor_complaints_resolved_by FOREIGN KEY (resolved_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS inspections (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    vendor_user_id BIGINT UNSIGNED NOT NULL,
    zone_code VARCHAR(40) NOT NULL,
    inspector_name VARCHAR(120) NOT NULL,
    scheduled_at DATETIME NOT NULL,
    status ENUM(
        'scheduled',
        'in_progress',
        'completed',
        'cancelled'
    ) NOT NULL DEFAULT 'scheduled',
    violations_found TINYINT(1) NOT NULL DEFAULT 0,
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_inspections_vendor (vendor_user_id),
    KEY idx_inspections_schedule (scheduled_at),
    KEY idx_inspections_status (status),
    CONSTRAINT fk_inspections_vendor FOREIGN KEY (vendor_user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS admin_notifications (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    admin_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM(
        'info',
        'warning',
        'success',
        'error'
    ) NOT NULL DEFAULT 'info',
    audience_type VARCHAR(50) NOT NULL DEFAULT 'all_vendors',
    channels JSON NULL,
    priority ENUM(
        'low',
        'normal',
        'high',
        'critical'
    ) NOT NULL DEFAULT 'normal',
    scheduled_at DATETIME NULL,
    sent_at DATETIME NULL,
    recipient_count INT NOT NULL DEFAULT 0,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_admin_notifications_admin (admin_id),
    KEY idx_admin_notifications_created (created_at),
    CONSTRAINT fk_admin_notifications_admin FOREIGN KEY (admin_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB;

INSERT INTO
    generated_reports (
        report_name,
        report_type,
        report_period,
        visual_type,
        status,
        generated_by,
        file_size_kb
    )
SELECT 'Monthly Vendor Report', 'vendor', 'Jan 2024', 'table', 'ready', (SELECT id FROM users WHERE role = 'admin' LIMIT 1), 2400
WHERE
    NOT EXISTS (
        SELECT 1
        FROM generated_reports
    );

INSERT INTO
    generated_reports (
        report_name,
        report_type,
        report_period,
        visual_type,
        status,
        generated_by,
        file_size_kb
    )
SELECT 'Revenue Analysis Q4', 'finance', 'Dec 2023', 'line', 'ready', (SELECT id FROM users WHERE role = 'admin' LIMIT 1), 1800
WHERE
    NOT EXISTS (
        SELECT 1
        FROM generated_reports
        WHERE
            report_name = 'Revenue Analysis Q4'
    );

INSERT INTO
    generated_reports (
        report_name,
        report_type,
        report_period,
        visual_type,
        status,
        generated_by,
        file_size_kb
    )
SELECT 'Zone Occupancy Report', 'compliance', 'Jan 2024', 'pie', 'ready', (SELECT id FROM users WHERE role = 'admin' LIMIT 1), 3100
WHERE
    NOT EXISTS (
        SELECT 1
        FROM generated_reports
        WHERE
            report_name = 'Zone Occupancy Report'
    );

INSERT INTO
    vendor_complaints (
        complaint_ref,
        user_id,
        subject,
        category,
        priority,
        status,
        description
    )
SELECT 'C-21353', (SELECT id FROM users WHERE role = 'vendor' LIMIT 1), 'Zone allocation mismatch', 'Zone Issue', 'high', 'new', 'Requested zone differs from approved allocation.'
WHERE
    NOT EXISTS (
        SELECT 1
        FROM vendor_complaints
        WHERE
            complaint_ref = 'C-21353'
    );

INSERT INTO
    vendor_complaints (
        complaint_ref,
        user_id,
        subject,
        category,
        priority,
        status,
        description
    )
SELECT 'C-21354', (SELECT id FROM users WHERE role = 'vendor' LIMIT 1 OFFSET 1), 'Verbal harassment complaint', 'Harassment', 'high', 'in_progress', 'Vendor reported repeated harassment at market edge.'
WHERE
    NOT EXISTS (
        SELECT 1
        FROM vendor_complaints
        WHERE
            complaint_ref = 'C-21354'
    );

INSERT INTO
    vendor_complaints (
        complaint_ref,
        user_id,
        subject,
        category,
        priority,
        status,
        description
    )
SELECT 'C-21355', (SELECT id FROM users WHERE role = 'vendor' LIMIT 1), 'Penalty charge dispute', 'Payment Issue', 'medium', 'resolved', 'Penalty was applied despite valid renewal proof.'
WHERE
    NOT EXISTS (
        SELECT 1
        FROM vendor_complaints
        WHERE
            complaint_ref = 'C-21355'
    );

INSERT INTO
    inspections (
        vendor_user_id,
        zone_code,
        inspector_name,
        scheduled_at,
        status,
        notes
    )
SELECT (SELECT id FROM users WHERE role = 'vendor' LIMIT 1), 'A-45', 'Inspector Raja', NOW() + INTERVAL 2 HOUR, 'scheduled', 'Routine hygiene check'
WHERE
    NOT EXISTS (
        SELECT 1
        FROM inspections
    );

INSERT INTO
    inspections (
        vendor_user_id,
        zone_code,
        inspector_name,
        scheduled_at,
        status,
        notes
    )
SELECT (SELECT id FROM users WHERE role = 'vendor' LIMIT 1 OFFSET 1), 'A-12', 'Inspector Buiyan', NOW() + INTERVAL 4 HOUR, 'in_progress', 'Follow-up compliance visit'
WHERE
    NOT EXISTS (
        SELECT 1
        FROM inspections
        WHERE
            inspector_name = 'Inspector Buiyan'
    );