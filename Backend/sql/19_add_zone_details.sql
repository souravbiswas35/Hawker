-- Add additional fields to vending_zones table for My Zone page
USE hawker;

-- Add dimensions column
SET @col := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA='hawker'
    AND TABLE_NAME='vending_zones'
    AND COLUMN_NAME='dimensions'
);

SET @sql := IF(@col=0,
  'ALTER TABLE vending_zones ADD COLUMN dimensions VARCHAR(100) NULL AFTER area',
  'SELECT "dimensions exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add nearby_landmarks column
SET @col := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA='hawker'
    AND TABLE_NAME='vending_zones'
    AND COLUMN_NAME='nearby_landmarks'
);

SET @sql := IF(@col=0,
  'ALTER TABLE vending_zones ADD COLUMN nearby_landmarks TEXT NULL AFTER location',
  'SELECT "nearby_landmarks exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add operating_hours column
SET @col := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA='hawker'
    AND TABLE_NAME='vending_zones'
    AND COLUMN_NAME='operating_hours'
);

SET @sql := IF(@col=0,
  'ALTER TABLE vending_zones ADD COLUMN operating_hours VARCHAR(100) NULL AFTER nearby_landmarks',
  'SELECT "operating_hours exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add rules_regulations column
SET @col := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA='hawker'
    AND TABLE_NAME='vending_zones'
    AND COLUMN_NAME='rules_regulations'
);

SET @sql := IF(@col=0,
  'ALTER TABLE vending_zones ADD COLUMN rules_regulations TEXT NULL AFTER operating_hours',
  'SELECT "rules_regulations exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add zone_in_charge_contact column
SET @col := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA='hawker'
    AND TABLE_NAME='vending_zones'
    AND COLUMN_NAME='zone_in_charge_contact'
);

SET @sql := IF(@col=0,
  'ALTER TABLE vending_zones ADD COLUMN zone_in_charge_contact VARCHAR(200) NULL AFTER rules_regulations',
  'SELECT "zone_in_charge_contact exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add spot_number column to track vendor's assigned spot
SET @col := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA='hawker'
    AND TABLE_NAME='vendor_profiles'
    AND COLUMN_NAME='assigned_spot_number'
);

SET @sql := IF(@col=0,
  'ALTER TABLE vendor_profiles ADD COLUMN assigned_spot_number VARCHAR(50) NULL AFTER vending_zone',
  'SELECT "assigned_spot_number exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT "Added zone details fields to vending_zones table" AS message;
