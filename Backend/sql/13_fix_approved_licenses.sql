-- Fix existing approved licenses that are missing license numbers and dates
-- This script updates approved license applications with generated license numbers and dates
-- BEFORE: 17_fix_approved_license_fields.sql
-- AFTER: 12_add_license_fileds.sql (Required)

USE hawker;

UPDATE license_applications
SET
    license_number = CONCAT(
        CASE
            WHEN application_ref LIKE 'LIC-%' THEN application_ref
            ELSE CONCAT('LIC-', application_ref)
        END,
        '-',
        YEAR(
            COALESCE(
                reviewed_at,
                submitted_at,
                NOW()
            )
        )
    ),
    issued_at = COALESCE(
        reviewed_at,
        submitted_at,
        NOW()
    ),
    expires_at = DATE_ADD(
        COALESCE(
            reviewed_at,
            submitted_at,
            NOW()
        ),
        INTERVAL 365 DAY
    ),
    qr_code_data = JSON_OBJECT(
        'license_number',
        CONCAT(
            CASE
                WHEN application_ref LIKE 'LIC-%' THEN application_ref
                ELSE CONCAT('LIC-', application_ref)
            END,
            '-',
            YEAR(
                COALESCE(
                    reviewed_at,
                    submitted_at,
                    NOW()
                )
            )
        ),
        'zone',
        desired_zone,
        'issued_at',
        COALESCE(
            reviewed_at,
            submitted_at,
            NOW()
        ),
        'expires_at',
        DATE_ADD(
            COALESCE(
                reviewed_at,
                submitted_at,
                NOW()
            ),
            INTERVAL 365 DAY
        )
    )
WHERE
    status = 'approved'
    AND (
        license_number IS NULL
        OR license_number = ''
    );

-- Verify the update
SELECT
    id,
    application_ref,
    license_number,
    issued_at,
    expires_at,
    status
FROM license_applications
WHERE
    status = 'approved'
ORDER BY reviewed_at DESC;