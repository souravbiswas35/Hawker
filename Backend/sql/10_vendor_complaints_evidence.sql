-- Vendor complaint evidence/attachments
-- Add this to support evidence uploads for complaints
-- BEFORE: 11_complaint_comments.sql
-- AFTER: 07_admin_feature_schema.sql (Required)

USE hawker;

CREATE TABLE IF NOT EXISTS complaint_evidence (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    complaint_id BIGINT UNSIGNED NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_complaint_evidence_complaint (complaint_id),
    CONSTRAINT fk_complaint_evidence_complaint FOREIGN KEY (complaint_id) REFERENCES vendor_complaints (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- Add is_anonymous field to vendor_complaints if it doesn't exist
ALTER TABLE vendor_complaints
ADD COLUMN is_anonymous TINYINT(1) NOT NULL DEFAULT 0 AFTER user_id;

-- Insert sample complaints if not already present
INSERT IGNORE INTO
    vendor_complaints (
        complaint_ref,
        user_id,
        is_anonymous,
        subject,
        category,
        priority,
        status,
        description,
        created_at
    )
VALUES (
        'C-20260101-001',
        2,
        0,
        'Unauthorized Vehicle Parked in Zone',
        'Zone issue',
        'high',
        'new',
        'A commercial vehicle is parked in my assigned vending zone, blocking my access to customers.',
        NOW() - INTERVAL 1 DAY
    ),
    (
        'C-20260102-001',
        2,
        0,
        'License Fee Overcharge',
        'Payment issue',
        'medium',
        'in_progress',
        'I was charged ৳500 extra for my renewal license. Need clarification on additional charges.',
        NOW() - INTERVAL 2 DAY
    );