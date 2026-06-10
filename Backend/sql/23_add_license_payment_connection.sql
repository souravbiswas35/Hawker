-- Add license application connection to payments
USE hawker;

-- Add license_application_id column to vendor_payments
ALTER TABLE vendor_payments 
ADD COLUMN license_application_id BIGINT UNSIGNED NULL AFTER user_id,
ADD KEY idx_vendor_payments_license (license_application_id),
ADD CONSTRAINT fk_vendor_payments_license FOREIGN KEY (license_application_id) REFERENCES license_applications(id) ON DELETE SET NULL;

-- Add payment_required and payment_status columns to license_applications
ALTER TABLE license_applications
ADD COLUMN payment_required TINYINT(1) NOT NULL DEFAULT 1 AFTER status,
ADD COLUMN payment_status ENUM('pending', 'completed', 'failed', 'waived') NOT NULL DEFAULT 'pending' AFTER payment_required,
ADD COLUMN payment_id BIGINT UNSIGNED NULL AFTER payment_status,
ADD KEY idx_license_applications_payment_status (payment_status),
ADD CONSTRAINT fk_license_applications_payment FOREIGN KEY (payment_id) REFERENCES vendor_payments(id) ON DELETE SET NULL;

-- Update existing license applications to have payment status
UPDATE license_applications 
SET payment_status = CASE 
    WHEN status = 'approved' THEN 'completed'
    WHEN status = 'pending' THEN 'pending'
    ELSE 'pending'
END
WHERE payment_status = 'pending';
