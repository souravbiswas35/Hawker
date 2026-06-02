-- Vendor license and renewal schema extension
-- Run after 08_final_admin_setup.sql

USE hawker;

CREATE TABLE IF NOT EXISTS vendor_licenses (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    source_application_id BIGINT UNSIGNED NULL,
    license_number VARCHAR(60) NOT NULL,
    current_zone VARCHAR(120) NULL,
    issued_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,
    status ENUM(
        'active',
        'expired',
        'suspended',
        'pending_renewal'
    ) NOT NULL DEFAULT 'active',
    auto_renew_enabled TINYINT(1) NOT NULL DEFAULT 0,
    last_renewed_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_vendor_licenses_user (user_id),
    UNIQUE KEY uq_vendor_licenses_number (license_number),
    KEY idx_vendor_licenses_expires (expires_at),
    CONSTRAINT fk_vendor_licenses_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_vendor_licenses_application FOREIGN KEY (source_application_id) REFERENCES license_applications (id) ON DELETE SET NULL
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS license_renewals (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    renewal_ref VARCHAR(40) NOT NULL,
    vendor_license_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    period_months INT NOT NULL,
    base_amount DECIMAL(10, 2) NOT NULL,
    processing_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount_label VARCHAR(80) NULL,
    payable_amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM(
        'bkash',
        'nagad',
        'visa',
        'mastercard',
        'bank_transfer',
        'cash'
    ) NOT NULL,
    payment_status ENUM('pending', 'paid', 'failed') NOT NULL DEFAULT 'pending',
    status ENUM(
        'submitted',
        'under-review',
        'approved',
        'rejected',
        'cancelled'
    ) NOT NULL DEFAULT 'submitted',
    requires_document_reupload TINYINT(1) NOT NULL DEFAULT 0,
    document_original_name VARCHAR(255) NULL,
    document_stored_name VARCHAR(255) NULL,
    document_mime_type VARCHAR(120) NULL,
    document_size BIGINT NULL,
    notes TEXT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_by BIGINT UNSIGNED NULL,
    reviewed_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_license_renewals_ref (renewal_ref),
    KEY idx_license_renewals_user (user_id),
    KEY idx_license_renewals_license (vendor_license_id),
    KEY idx_license_renewals_status (status),
    CONSTRAINT fk_license_renewals_license FOREIGN KEY (vendor_license_id) REFERENCES vendor_licenses (id) ON DELETE CASCADE,
    CONSTRAINT fk_license_renewals_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_license_renewals_reviewer FOREIGN KEY (reviewed_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB;

-- Bootstrap current license records from latest approved applications.
INSERT INTO
    vendor_licenses (
        user_id,
        source_application_id,
        license_number,
        current_zone,
        issued_at,
        expires_at,
        status
    )
SELECT
    la.user_id,
    la.id,
    CONCAT('LIC-', la.application_ref),
    la.desired_zone,
    COALESCE(
        la.reviewed_at,
        la.submitted_at,
        NOW()
    ) AS issued_at,
    DATE_ADD(
        COALESCE(
            la.reviewed_at,
            la.submitted_at,
            NOW()
        ),
        INTERVAL 1 YEAR
    ) AS expires_at,
    CASE
        WHEN DATE_ADD(
            COALESCE(
                la.reviewed_at,
                la.submitted_at,
                NOW()
            ),
            INTERVAL 1 YEAR
        ) < NOW() THEN 'expired'
        ELSE 'active'
    END AS status
FROM
    license_applications la
    INNER JOIN (
        SELECT
            user_id,
            MAX(id) AS latest_approved_application_id
        FROM license_applications
        WHERE
            status = 'approved'
        GROUP BY
            user_id
    ) latest ON latest.latest_approved_application_id = la.id
    LEFT JOIN vendor_licenses vl ON vl.user_id = la.user_id
WHERE
    vl.id IS NULL;