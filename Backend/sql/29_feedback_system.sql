-- Feedback System Schema
-- Run this file to create the feedback table
-- BEFORE: Feedback dependent features
-- AFTER: 01_hawker_schema.sql (Required)

USE hawker;

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    rating TINYINT NOT NULL CHECK (
        rating >= 1
        AND rating <= 5
    ),
    type ENUM(
        'general',
        'feature_request',
        'bug_report',
        'improvement'
    ) NOT NULL DEFAULT 'general',
    feedback TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    status ENUM(
        'pending',
        'reviewed',
        'implemented',
        'declined'
    ) DEFAULT 'pending',
    admin_response TEXT,
    admin_id BIGINT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Create feedback_improvements table to track implemented features
CREATE TABLE IF NOT EXISTS feedback_improvements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    implemented_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    related_feedback_ids JSON,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_active (is_active),
    INDEX idx_implemented_at (implemented_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Insert sample improvements
INSERT INTO
    feedback_improvements (
        title,
        description,
        related_feedback_ids
    )
VALUES (
        'Faster license renewal process',
        'Reduced renewal processing time from 7 days to 3 days',
        NULL
    ),
    (
        'Mobile app dark mode',
        'Added dark mode support for mobile application',
        NULL
    ),
    (
        'Multi-language support added',
        'Added support for Bengali and English languages',
        NULL
    );

-- Update AUTO_INCREMENT
ALTER TABLE feedback AUTO_INCREMENT = 100;

ALTER TABLE feedback_improvements AUTO_INCREMENT = 100;