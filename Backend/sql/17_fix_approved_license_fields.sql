-- Fix allocated zone and goods authorized for existing approved licenses
-- BEFORE: Can run before dependent data-dependent files
-- AFTER: 13_fix_approved_licenses.sql, 15_populate_vending_zones.sql (Required)

USE hawker;

-- Update desired_zone from primary_zone_id for approved licenses
UPDATE license_applications la
LEFT JOIN vending_zones vz ON la.primary_zone_id = vz.id
SET
    la.desired_zone = COALESCE(
        vz.name,
        la.desired_zone,
        'N/A'
    )
WHERE
    la.status = 'approved'
    AND (
        la.desired_zone IS NULL
        OR la.desired_zone = ''
        OR la.desired_zone = 'To be selected'
    );

-- Update goods_authorized from business_details JSON for approved licenses
UPDATE license_applications
SET
    goods_authorized = COALESCE(
        JSON_UNQUOTE(
            JSON_EXTRACT(
                business_details,
                '$.goods_authorized'
            )
        ),
        JSON_UNQUOTE(
            JSON_EXTRACT(business_details, '$.goods')
        ),
        business_category,
        'General'
    )
WHERE
    status = 'approved'
    AND (
        goods_authorized IS NULL
        OR goods_authorized = ''
        OR goods_authorized = 'To be selected'
    );

-- Update license_category if needed
UPDATE license_applications
SET
    license_category = COALESCE(license_category, 'General')
WHERE
    status = 'approved'
    AND (
        license_category IS NULL
        OR license_category = ''
    );

SELECT "Fixed allocated zone and goods authorized for existing approved licenses" AS message;