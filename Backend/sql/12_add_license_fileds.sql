USE hawker;

-- license_number
SET @col := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA='hawker'
    AND TABLE_NAME='license_applications'
    AND COLUMN_NAME='license_number'
);

SET @sql := IF(@col=0,
  'ALTER TABLE license_applications ADD COLUMN license_number VARCHAR(50) NULL UNIQUE AFTER application_ref',
  'SELECT "license_number exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- issued_at
SET @col := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA='hawker'
    AND TABLE_NAME='license_applications'
    AND COLUMN_NAME='issued_at'
);

SET @sql := IF(@col=0,
  'ALTER TABLE license_applications ADD COLUMN issued_at DATETIME NULL AFTER reviewed_at',
  'SELECT "issued_at exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- expires_at
SET @col := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA='hawker'
    AND TABLE_NAME='license_applications'
    AND COLUMN_NAME='expires_at'
);

SET @sql := IF(@col=0,
  'ALTER TABLE license_applications ADD COLUMN expires_at DATETIME NULL AFTER issued_at',
  'SELECT "expires_at exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- qr_code_data
SET @col := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA='hawker'
    AND TABLE_NAME='license_applications'
    AND COLUMN_NAME='qr_code_data'
);

SET @sql := IF(@col=0,
  'ALTER TABLE license_applications ADD COLUMN qr_code_data LONGTEXT NULL AFTER expires_at',
  'SELECT "qr_code_data exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- goods_authorized
SET @col := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA='hawker'
    AND TABLE_NAME='license_applications'
    AND COLUMN_NAME='goods_authorized'
);

SET @sql := IF(@col=0,
  'ALTER TABLE license_applications ADD COLUMN goods_authorized VARCHAR(500) NULL AFTER qr_code_data',
  'SELECT "goods_authorized exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- license_category
SET @col := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA='hawker'
    AND TABLE_NAME='license_applications'
    AND COLUMN_NAME='license_category'
);

SET @sql := IF(@col=0,
  'ALTER TABLE license_applications ADD COLUMN license_category VARCHAR(100) NULL AFTER goods_authorized',
  'SELECT "license_category exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- INDEXES

SET @idx := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA='hawker'
    AND TABLE_NAME='license_applications'
    AND INDEX_NAME='idx_license_number'
);

SET @sql := IF(@idx=0,
  'ALTER TABLE license_applications ADD INDEX idx_license_number (license_number)',
  'SELECT "index license_number exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA='hawker'
    AND TABLE_NAME='license_applications'
    AND INDEX_NAME='idx_issued_at'
);

SET @sql := IF(@idx=0,
  'ALTER TABLE license_applications ADD INDEX idx_issued_at (issued_at)',
  'SELECT "index issued_at exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;