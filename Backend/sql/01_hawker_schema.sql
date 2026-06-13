-- Hawker Urban Vending System - Full Database Schema
-- Run this file first.
-- MUST RUN FIRST: This is the base schema file. All other files depend on this.
-- BEFORE: Nothing - this is the foundation
-- AFTER: All schema and migration files can run after this

DROP DATABASE IF EXISTS hawker;

CREATE DATABASE hawker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE hawker;

CREATE TABLE users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'vendor') NOT NULL DEFAULT 'vendor',
    is_email_verified TINYINT(1) NOT NULL DEFAULT 0,
    account_status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    KEY idx_users_role (role)
) ENGINE = InnoDB;

CREATE TABLE email_verifications (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    email VARCHAR(255) NOT NULL,
    code_hash CHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    is_used TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_email_verifications_user (user_id),
    KEY idx_email_verifications_expires (expires_at),
    CONSTRAINT fk_email_verifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE vendor_profiles (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    first_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NULL,
    phone VARCHAR(25) NULL,
    national_id VARCHAR(100) NULL,
    date_of_birth DATE NULL,
    address VARCHAR(300) NULL,
    business_name VARCHAR(200) NULL,
    business_type VARCHAR(120) NULL,
    vending_zone VARCHAR(120) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_vendor_profiles_user (user_id),
    KEY idx_vendor_profiles_zone (vending_zone),
    CONSTRAINT fk_vendor_profiles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE vendor_documents (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    document_type VARCHAR(80) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_vendor_documents_user (user_id),
    KEY idx_vendor_documents_type (document_type),
    CONSTRAINT fk_vendor_documents_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE license_applications (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    application_ref VARCHAR(30) NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    desired_zone VARCHAR(120) NOT NULL,
    stall_type VARCHAR(120) NOT NULL,
    business_category VARCHAR(120) NOT NULL,
    notes TEXT NULL,
    status ENUM(
        'submitted',
        'under-review',
        'approved',
        'rejected',
        'needs-info'
    ) NOT NULL DEFAULT 'submitted',
    admin_remarks TEXT NULL,
    reviewed_by BIGINT UNSIGNED NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_license_applications_ref (application_ref),
    KEY idx_license_applications_user (user_id),
    KEY idx_license_applications_status (status),
    CONSTRAINT fk_license_applications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_license_applications_reviewer FOREIGN KEY (reviewed_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB;

CREATE TABLE application_audit_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    application_id BIGINT UNSIGNED NOT NULL,
    action_by BIGINT UNSIGNED NULL,
    action_type VARCHAR(50) NOT NULL,
    comments TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_application_audit_logs_app (application_id),
    KEY idx_application_audit_logs_actor (action_by),
    CONSTRAINT fk_application_audit_logs_application FOREIGN KEY (application_id) REFERENCES license_applications (id) ON DELETE CASCADE,
    CONSTRAINT fk_application_audit_logs_actor FOREIGN KEY (action_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB;