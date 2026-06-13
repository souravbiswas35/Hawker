-- Create missing payment tables
-- BEFORE: 22_insert_discount_codes.sql, 23_add_license_payment_connection.sql
-- AFTER: 20_vendor_payment_schema.sql (Required)

USE hawker;

-- Discount codes
CREATE TABLE IF NOT EXISTS discount_codes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL,
    discount_percent DECIMAL(5, 2) NOT NULL,
    max_uses INT NOT NULL,
    used_count INT NOT NULL DEFAULT 0,
    valid_from DATETIME NOT NULL,
    valid_until DATETIME NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_discount_codes_code (code),
    KEY idx_discount_codes_active (is_active)
) ENGINE = InnoDB;

-- Vendor payments (main payment records)
CREATE TABLE IF NOT EXISTS vendor_payments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    payment_type_id BIGINT UNSIGNED NOT NULL,
    payment_method_id BIGINT UNSIGNED NOT NULL,
    transaction_id VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    final_amount DECIMAL(10, 2) NOT NULL,
    discount_code_id BIGINT UNSIGNED NULL,
    status ENUM(
        'pending',
        'completed',
        'failed',
        'refunded'
    ) NOT NULL DEFAULT 'pending',
    payment_date DATETIME NULL,
    receipt_url VARCHAR(500) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_vendor_payments_transaction (transaction_id),
    KEY idx_vendor_payments_user (user_id),
    KEY idx_vendor_payments_status (status),
    KEY idx_vendor_payments_date (payment_date),
    CONSTRAINT fk_vendor_payments_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_vendor_payments_type FOREIGN KEY (payment_type_id) REFERENCES payment_types (id),
    CONSTRAINT fk_vendor_payments_method FOREIGN KEY (payment_method_id) REFERENCES payment_methods (id),
    CONSTRAINT fk_vendor_payments_discount FOREIGN KEY (discount_code_id) REFERENCES discount_codes (id) ON DELETE SET NULL
) ENGINE = InnoDB;

-- Outstanding dues (for tracking unpaid amounts)
CREATE TABLE IF NOT EXISTS vendor_dues (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    due_type VARCHAR(50) NOT NULL,
    description TEXT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    is_paid TINYINT(1) NOT NULL DEFAULT 0,
    payment_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_vendor_dues_user (user_id),
    KEY idx_vendor_dues_status (is_paid),
    KEY idx_vendor_dues_date (due_date),
    CONSTRAINT fk_vendor_dues_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_vendor_dues_payment FOREIGN KEY (payment_id) REFERENCES vendor_payments (id) ON DELETE SET NULL
) ENGINE = InnoDB;

-- Upcoming payments (scheduled payments)
CREATE TABLE IF NOT EXISTS upcoming_payments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    payment_type_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    is_reminder_sent TINYINT(1) NOT NULL DEFAULT 0,
    is_paid TINYINT(1) NOT NULL DEFAULT 0,
    payment_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_upcoming_payments_user (user_id),
    KEY idx_upcoming_payments_date (due_date),
    KEY idx_upcoming_payments_status (is_paid),
    CONSTRAINT fk_upcoming_payments_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_upcoming_payments_type FOREIGN KEY (payment_type_id) REFERENCES payment_types (id),
    CONSTRAINT fk_upcoming_payments_payment FOREIGN KEY (payment_id) REFERENCES vendor_payments (id) ON DELETE SET NULL
) ENGINE = InnoDB;