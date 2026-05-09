-- Hawker Urban Vending System - Demo Data
-- Run this file after 01_hawker_schema.sql

USE hawker;

-- Admin credentials for demo:
-- email: admin@hawker.gov
-- password: Admin@123
INSERT INTO
    users (
        id,
        email,
        password_hash,
        role,
        is_email_verified,
        account_status
    )
VALUES (
        1,
        'admin@hawker.gov',
        '$2b$12$8E0BmN5nuE0hHFmkggTNI.PI6yJ7uzBNoKb3L7lnagUt0j/ElGT1S',
        'admin',
        1,
        'active'
    );

-- Vendor demo credentials:
-- email: vendor1@hawker.app | password: Vendor@123
-- email: vendor2@hawker.app | password: Demo@1234
INSERT INTO
    users (
        id,
        email,
        password_hash,
        role,
        is_email_verified,
        account_status
    )
VALUES (
        2,
        'vendor1@hawker.app',
        '$2b$12$xL8/ort9VXbFCfH6KgHphuZKgSOm.yvjkcyy0N7oB59/mEVHsw1qu',
        'vendor',
        1,
        'active'
    ),
    (
        3,
        'vendor2@hawker.app',
        '$2b$12$Ep37CQc/s3lyTcpmW4OceObIUAPTbboE1jkZSO9pjSkOkbfIm1/5e',
        'vendor',
        1,
        'active'
    );

INSERT INTO
    vendor_profiles (
        user_id,
        first_name,
        last_name,
        phone,
        national_id,
        date_of_birth,
        address,
        business_name,
        business_type,
        vending_zone
    )
VALUES (
        2,
        'Rahim',
        'Khan',
        '+8801711111111',
        'NID-1000001',
        '1993-04-16',
        'Road 12, Dhaka',
        'Rahim Fast Bites',
        'Street Food',
        'Zone-A'
    ),
    (
        3,
        'Sadia',
        'Akter',
        '+8801811111111',
        'NID-1000002',
        '1996-08-11',
        'Road 2, Chattogram',
        'Sadia Fresh Juice',
        'Beverage',
        'Zone-B'
    );

INSERT INTO
    vendor_documents (
        user_id,
        document_type,
        original_name,
        stored_name,
        mime_type,
        file_size
    )
VALUES (
        2,
        'national_id_copy',
        'nid_rahim.pdf',
        'demo-nid-rahim.pdf',
        'application/pdf',
        234234
    ),
    (
        2,
        'trade_license',
        'trade_rahim.pdf',
        'demo-trade-rahim.pdf',
        'application/pdf',
        188420
    ),
    (
        3,
        'national_id_copy',
        'nid_sadia.pdf',
        'demo-nid-sadia.pdf',
        'application/pdf',
        210000
    ),
    (
        3,
        'trade_license',
        'trade_sadia.pdf',
        'demo-trade-sadia.pdf',
        'application/pdf',
        174000
    );

INSERT INTO
    license_applications (
        id,
        application_ref,
        user_id,
        desired_zone,
        stall_type,
        business_category,
        notes,
        status,
        admin_remarks,
        reviewed_by,
        submitted_at,
        reviewed_at
    )
VALUES (
        1,
        'HWK-000111-101',
        2,
        'Zone-A',
        'Portable Stall',
        'Street Food',
        'Near central bus stand',
        'approved',
        'Approved with 1-year validity',
        1,
        NOW() - INTERVAL 10 DAY,
        NOW() - INTERVAL 8 DAY
    ),
    (
        2,
        'HWK-000112-202',
        3,
        'Zone-B',
        'Push Cart',
        'Beverage',
        'Needs evening-only operation slot',
        'submitted',
        NULL,
        NULL,
        NOW() - INTERVAL 2 DAY,
        NULL
    );

INSERT INTO
    application_audit_logs (
        application_id,
        action_by,
        action_type,
        comments
    )
VALUES (
        1,
        2,
        'submitted',
        'Application submitted by vendor'
    ),
    (
        1,
        1,
        'approved',
        'Approved with 1-year validity'
    ),
    (
        2,
        3,
        'submitted',
        'Application submitted by vendor'
    );

ALTER TABLE users AUTO_INCREMENT = 100;

ALTER TABLE vendor_profiles AUTO_INCREMENT = 100;

ALTER TABLE vendor_documents AUTO_INCREMENT = 100;

ALTER TABLE license_applications AUTO_INCREMENT = 100;

ALTER TABLE application_audit_logs AUTO_INCREMENT = 100;