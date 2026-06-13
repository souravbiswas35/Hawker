-- Enhanced Schema for 6-Step License Application Process
-- Run this after the base schema to add multi-step support
-- BEFORE: 04, 07, 12, 18, 37, 35
-- AFTER: 01_hawker_schema.sql (Required)

USE hawker;

-- License types and pricing
CREATE TABLE license_types (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    duration_days INT NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    security_deposit DECIMAL(10, 2) NOT NULL,
    processing_fee DECIMAL(10, 2) NOT NULL DEFAULT 100.00,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_license_types_active (is_active)
) ENGINE = InnoDB;

-- Vending zones with detailed information
CREATE TABLE vending_zones (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    zone_code VARCHAR(20) NOT NULL,
    name VARCHAR(200) NOT NULL,
    location VARCHAR(300) NOT NULL,
    area VARCHAR(100) NOT NULL,
    total_spots INT NOT NULL DEFAULT 50,
    available_spots INT NOT NULL DEFAULT 50,
    has_electricity TINYINT(1) NOT NULL DEFAULT 0,
    has_water TINYINT(1) NOT NULL DEFAULT 0,
    has_shade TINYINT(1) NOT NULL DEFAULT 0,
    zone_type ENUM(
        'commercial',
        'residential',
        'mixed',
        'transport'
    ) NOT NULL,
    traffic_level ENUM('low', 'medium', 'high') NOT NULL,
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_vending_zones_code (zone_code),
    KEY idx_vending_zones_active (is_active),
    KEY idx_vending_zones_area (area)
) ENGINE = InnoDB;

-- Enhanced license applications table
ALTER TABLE license_applications
ADD COLUMN license_type_id BIGINT UNSIGNED NULL AFTER application_ref,
ADD COLUMN primary_zone_id BIGINT UNSIGNED NULL AFTER desired_zone,
ADD COLUMN alternate_zone_id BIGINT UNSIGNED NULL AFTER primary_zone_id,
ADD COLUMN business_details JSON NULL AFTER business_category,
ADD COLUMN document_verification JSON NULL AFTER business_details,
ADD COLUMN payment_details JSON NULL AFTER document_verification,
ADD COLUMN final_submission JSON NULL AFTER payment_details,
ADD COLUMN current_step TINYINT NOT NULL DEFAULT 1 AFTER status,
ADD COLUMN completed_steps JSON NULL AFTER current_step,
ADD COLUMN tracking_number VARCHAR(50) NULL AFTER application_ref,
ADD INDEX idx_license_applications_tracking (tracking_number),
ADD INDEX idx_license_applications_step (current_step);

-- Add foreign key constraints
ALTER TABLE license_applications
ADD CONSTRAINT fk_license_applications_license_type FOREIGN KEY (license_type_id) REFERENCES license_types (id),
ADD CONSTRAINT fk_license_applications_primary_zone FOREIGN KEY (primary_zone_id) REFERENCES vending_zones (id),
ADD CONSTRAINT fk_license_applications_alternate_zone FOREIGN KEY (alternate_zone_id) REFERENCES vending_zones (id);

-- Payment records
CREATE TABLE application_payments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    application_id BIGINT UNSIGNED NOT NULL,
    payment_method ENUM(
        'bkash',
        'nagad',
        'visa',
        'mastercard',
        'cash',
        'pay_later'
    ) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    transaction_id VARCHAR(100) NULL,
    payment_status ENUM(
        'pending',
        'completed',
        'failed',
        'refunded'
    ) NOT NULL DEFAULT 'pending',
    cashback_eligible TINYINT(1) NOT NULL DEFAULT 0,
    cashback_amount DECIMAL(10, 2) NULL,
    paid_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_application_payments_app (application_id),
    KEY idx_application_payments_status (payment_status),
    CONSTRAINT fk_application_payments_application FOREIGN KEY (application_id) REFERENCES license_applications (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- Application step progress tracking
CREATE TABLE application_step_progress (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    application_id BIGINT UNSIGNED NOT NULL,
    step_number TINYINT NOT NULL,
    step_status ENUM(
        'pending',
        'in_progress',
        'completed'
    ) NOT NULL DEFAULT 'pending',
    step_data JSON NULL,
    started_at DATETIME NULL,
    completed_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_application_step_progress (application_id, step_number),
    KEY idx_application_step_progress_app (application_id),
    CONSTRAINT fk_application_step_progress_application FOREIGN KEY (application_id) REFERENCES license_applications (id) ON DELETE CASCADE
) ENGINE = InnoDB;