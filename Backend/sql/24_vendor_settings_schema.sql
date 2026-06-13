-- Vendor settings schema
-- Run this file after 09_vendor_notifications_schema.sql
-- BEFORE: 25_inspections_schema.sql
-- AFTER: 09_vendor_notifications_schema.sql, 08_final_admin_setup.sql (Required)

USE hawker;

CREATE TABLE IF NOT EXISTS vendor_settings (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    theme ENUM('light', 'dark', 'auto') NOT NULL DEFAULT 'light',
    language ENUM('bangla', 'english') NOT NULL DEFAULT 'english',
    high_contrast_mode TINYINT(1) NOT NULL DEFAULT 0,
    large_text TINYINT(1) NOT NULL DEFAULT 0,
    screen_reader_support TINYINT(1) NOT NULL DEFAULT 0,
    profile_visibility TINYINT(1) NOT NULL DEFAULT 1,
    auto_renewal TINYINT(1) NOT NULL DEFAULT 1,
    save_payment_methods TINYINT(1) NOT NULL DEFAULT 1,
    email_receipts TINYINT(1) NOT NULL DEFAULT 1,
    two_factor_auth TINYINT(1) NOT NULL DEFAULT 0,
    marketing_communications TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_vendor_settings_user (user_id),
    CONSTRAINT fk_vendor_settings_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- Insert default settings for existing vendors
INSERT INTO
    vendor_settings (
        user_id,
        theme,
        language,
        high_contrast_mode,
        large_text,
        screen_reader_support,
        profile_visibility,
        auto_renewal,
        save_payment_methods,
        email_receipts,
        two_factor_auth,
        marketing_communications
    )
SELECT id, 'light', 'english', 0, 0, 0, 1, 1, 1, 1, 0, 0
FROM users
WHERE
    role = 'vendor'
    AND id NOT IN(
        SELECT user_id
        FROM vendor_settings
    );