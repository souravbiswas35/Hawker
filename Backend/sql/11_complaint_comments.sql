-- Complaint Comments Schema
-- Add this to support comments on vendor complaints
-- BEFORE: 14, 23
-- AFTER: 10_vendor_complaints_evidence.sql (Required)

USE hawker;

CREATE TABLE IF NOT EXISTS complaint_comments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    complaint_id BIGINT UNSIGNED NOT NULL,
    author_type ENUM('vendor', 'admin') NOT NULL DEFAULT 'vendor',
    author_id BIGINT UNSIGNED NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_complaint_comments_complaint (complaint_id),
    CONSTRAINT fk_complaint_comments_complaint FOREIGN KEY (complaint_id) REFERENCES vendor_complaints (id) ON DELETE CASCADE
) ENGINE = InnoDB;