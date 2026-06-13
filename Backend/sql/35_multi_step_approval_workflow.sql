-- Multi-Step Approval Workflow Schema
-- This adds support for Inspector and City Corporation Admin roles
-- and implements a multi-step approval process

USE hawker;

-- Add new user roles (only if not already added)
SET @role_enum = (SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'hawker' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role');
SET @has_inspector = IF(@role_enum LIKE '%inspector%', 1, 0);
SET @has_city_corp = IF(@role_enum LIKE '%city_corporation_admin%', 1, 0);

SET @alter_users = IF(@has_inspector = 0 OR @has_city_corp = 0,
  'ALTER TABLE users MODIFY COLUMN role ENUM(''admin'', ''vendor'', ''inspector'', ''city_corporation_admin'') NOT NULL DEFAULT ''vendor''',
  'SELECT ''Role column already updated'' AS message');

PREPARE stmt FROM @alter_users;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add multi-step approval fields to license_applications (only if not already added)
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'hawker' AND TABLE_NAME = 'license_applications' AND COLUMN_NAME = 'document_verification_status');

SET @add_columns = IF(@column_exists = 0,
  'ALTER TABLE license_applications
   ADD COLUMN document_verification_status ENUM(''pending'', ''approved'', ''rejected'') NULL AFTER status,
   ADD COLUMN document_verified_by BIGINT UNSIGNED NULL AFTER document_verification_status,
   ADD COLUMN document_verified_at DATETIME NULL AFTER document_verified_by,
   ADD COLUMN document_verification_remarks TEXT NULL AFTER document_verified_at,
   ADD COLUMN admin_review_status ENUM(''pending'', ''approved'', ''rejected'') NULL AFTER document_verification_remarks,
   ADD COLUMN admin_reviewed_by BIGINT UNSIGNED NULL AFTER admin_review_status,
   ADD COLUMN admin_reviewed_at DATETIME NULL AFTER admin_reviewed_by,
   ADD COLUMN admin_review_remarks TEXT NULL AFTER admin_reviewed_at,
   ADD COLUMN inspection_assigned_to BIGINT UNSIGNED NULL AFTER admin_review_remarks,
   ADD COLUMN inspection_assigned_by BIGINT UNSIGNED NULL AFTER inspection_assigned_to,
   ADD COLUMN inspection_assigned_at DATETIME NULL AFTER inspection_assigned_by,
   ADD COLUMN inspection_date DATE NULL AFTER inspection_assigned_at,
   ADD COLUMN inspection_zone VARCHAR(200) NULL AFTER inspection_date,
   ADD COLUMN inspection_status ENUM(''pending'', ''scheduled'', ''conducted'', ''passed'', ''failed'') NULL AFTER inspection_zone,
   ADD COLUMN inspection_conducted_at DATETIME NULL AFTER inspection_status,
   ADD COLUMN inspection_remarks TEXT NULL AFTER inspection_conducted_at,
   ADD COLUMN city_corp_review_status ENUM(''pending'', ''approved'', ''rejected'') NULL AFTER inspection_remarks,
   ADD COLUMN city_corp_reviewed_by BIGINT UNSIGNED NULL AFTER city_corp_review_status,
   ADD COLUMN city_corp_reviewed_at DATETIME NULL AFTER city_corp_reviewed_by,
   ADD COLUMN city_corp_review_remarks TEXT NULL AFTER city_corp_reviewed_at,
   ADD INDEX idx_document_verification (document_verification_status),
   ADD INDEX idx_admin_review (admin_review_status),
   ADD INDEX idx_inspection_status (inspection_status),
   ADD INDEX idx_city_corp_review (city_corp_review_status),
   ADD INDEX idx_inspection_assigned_to (inspection_assigned_to)',
  'SELECT ''Multi-step columns already exist'' AS message');

PREPARE stmt FROM @add_columns;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraints for new fields (only if not already added)
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = 'hawker' AND TABLE_NAME = 'license_applications' AND CONSTRAINT_NAME = 'fk_document_verified_by');

SET @add_fks = IF(@fk_exists = 0,
  'ALTER TABLE license_applications
   ADD CONSTRAINT fk_document_verified_by FOREIGN KEY (document_verified_by) REFERENCES users(id) ON DELETE SET NULL,
   ADD CONSTRAINT fk_admin_reviewed_by FOREIGN KEY (admin_reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
   ADD CONSTRAINT fk_inspection_assigned_to FOREIGN KEY (inspection_assigned_to) REFERENCES users(id) ON DELETE SET NULL,
   ADD CONSTRAINT fk_inspection_assigned_by FOREIGN KEY (inspection_assigned_by) REFERENCES users(id) ON DELETE SET NULL,
   ADD CONSTRAINT fk_city_corp_reviewed_by FOREIGN KEY (city_corp_reviewed_by) REFERENCES users(id) ON DELETE SET NULL',
  'SELECT ''Foreign keys already exist'' AS message');

PREPARE stmt FROM @add_fks;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create inspector profiles table
CREATE TABLE inspector_profiles (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    phone VARCHAR(25) NULL,
    assigned_zones JSON NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_inspector_profiles_user (user_id),
    UNIQUE KEY uq_inspector_profiles_employee (employee_id),
    CONSTRAINT fk_inspector_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- Create city corporation admin profiles table
CREATE TABLE city_corp_admin_profiles (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    department VARCHAR(100) NULL,
    phone VARCHAR(25) NULL,
    jurisdiction VARCHAR(200) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_city_corp_admin_profiles_user (user_id),
    UNIQUE KEY uq_city_corp_admin_profiles_employee (employee_id),
    CONSTRAINT fk_city_corp_admin_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- Insert demo users for new roles
-- Inspector user (password: Inspector123!)
INSERT INTO users (email, password_hash, role, is_email_verified, account_status)
VALUES ('inspector@hawker.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyW0e5K0vJ6i', 'inspector', 1, 'active');

INSERT INTO inspector_profiles (user_id, employee_id, phone, assigned_zones)
VALUES (LAST_INSERT_ID(), 'INS001', '+8801712345678', JSON_ARRAY('all'));

-- City Corporation Admin user (password: CityCorp123!)
INSERT INTO users (email, password_hash, role, is_email_verified, account_status)
VALUES ('citycorp@hawker.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyW0e5K0vJ6i', 'city_corporation_admin', 1, 'active');

INSERT INTO city_corp_admin_profiles (user_id, employee_id, department, phone, jurisdiction)
VALUES (LAST_INSERT_ID(), 'CCA001', 'Licensing Department', '+8801812345678', 'City Corporation');

-- Update existing applications to have initial status
UPDATE license_applications
SET document_verification_status = 'pending',
    admin_review_status = 'pending',
    inspection_status = 'pending',
    city_corp_review_status = 'pending'
WHERE document_verification_status IS NULL;
