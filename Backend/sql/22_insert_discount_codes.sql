-- Insert sample discount codes
-- BEFORE: Payment dependent features
-- AFTER: 21_create_missing_payment_tables.sql (Required)

USE hawker;

INSERT INTO
    discount_codes (
        code,
        discount_percent,
        max_uses,
        used_count,
        valid_from,
        valid_until,
        is_active
    )
VALUES (
        'WELCOME10',
        10.00,
        100,
        0,
        '2024-01-01 00:00:00',
        '2025-12-31 23:59:59',
        1
    ),
    (
        'SAVE20',
        20.00,
        50,
        0,
        '2024-01-01 00:00:00',
        '2025-12-31 23:59:59',
        1
    ),
    (
        'FIRST5',
        5.00,
        200,
        0,
        '2024-01-01 00:00:00',
        '2025-12-31 23:59:59',
        1
    );