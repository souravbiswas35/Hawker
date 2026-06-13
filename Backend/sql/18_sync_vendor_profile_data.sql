-- Sync vendor profile data with license applications and vendor licenses
-- BEFORE: Data dependent features
-- AFTER: 09_vendor_license_renewal_schema.sql, 15_populate_vending_zones.sql (Required)

USE hawker;

-- Add business_name column to license_applications if it doesn't exist
SET
    @col := (
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            TABLE_SCHEMA = 'hawker'
            AND TABLE_NAME = 'license_applications'
            AND COLUMN_NAME = 'business_name'
    );

SET
    @sql := IF(
        @col = 0,
        'ALTER TABLE license_applications ADD COLUMN business_name VARCHAR(200) NULL AFTER application_ref',
        'SELECT "business_name exists"'
    );

PREPARE stmt FROM @sql;

EXECUTE stmt;

DEALLOCATE PREPARE stmt;

-- Update license_applications with vendor profile data where missing
UPDATE license_applications la
JOIN vendor_profiles vp ON la.user_id = vp.user_id
SET
    la.business_name = COALESCE(
        la.business_name,
        vp.business_name,
        CONCAT(
            vp.first_name,
            ' ',
            vp.last_name
        )
    ),
    la.business_category = COALESCE(
        la.business_category,
        vp.business_type,
        'General'
    ),
    la.stall_type = COALESCE(la.stall_type, 'Standard'),
    la.desired_zone = COALESCE(
        NULLIF(la.desired_zone, ''),
        NULLIF(
            la.desired_zone,
            'To be selected'
        ),
        NULLIF(vp.vending_zone, ''),
        NULLIF(
            vp.vending_zone,
            'To be selected'
        ),
        'Not assigned'
    )
WHERE
    la.business_name IS NULL
    OR la.business_name = ''
    OR la.business_name = 'Not provided'
    OR la.business_category IS NULL
    OR la.business_category = ''
    OR la.business_category = 'To be selected'
    OR la.stall_type IS NULL
    OR la.stall_type = ''
    OR la.stall_type = 'To be selected'
    OR la.desired_zone IS NULL
    OR la.desired_zone = ''
    OR la.desired_zone = 'To be selected';

-- Update vendor_licenses with vendor profile data where missing
UPDATE vendor_licenses vl
JOIN vendor_profiles vp ON vl.user_id = vp.user_id
SET
    vl.current_zone = COALESCE(
        NULLIF(vl.current_zone, ''),
        NULLIF(
            vl.current_zone,
            'To be selected'
        ),
        NULLIF(vp.vending_zone, ''),
        NULLIF(
            vp.vending_zone,
            'To be selected'
        ),
        'Not assigned'
    )
WHERE
    vl.current_zone IS NULL
    OR vl.current_zone = ''
    OR vl.current_zone = 'To be selected';

-- Update approved licenses with goods_authorized from business_details or business_category
UPDATE license_applications
SET
    goods_authorized = COALESCE(
        NULLIF(goods_authorized, ''),
        NULLIF(
            goods_authorized,
            'To be selected'
        ),
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

SELECT "Synced vendor profile data with license applications and vendor licenses" AS message;