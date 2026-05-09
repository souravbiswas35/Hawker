-- Add profile picture support to vendor_profiles table
-- Safe migration that won't error if columns already exist

USE hawker;

-- Add profile picture columns only if they don't exist
SET @dbname = DATABASE();
SET @tablename = "vendor_profiles";
SET @columnname = "profile_picture_url";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE 
    (table_name = @tablename) AND (table_schema = @dbname) AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " VARCHAR(500) NULL AFTER business_type")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add profile_picture_uploaded_at if it doesn't exist
SET @columnname2 = "profile_picture_uploaded_at";
SET @preparedStatement2 = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE 
    (table_name = @tablename) AND (table_schema = @dbname) AND (column_name = @columnname2)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname2, " TIMESTAMP NULL")
));
PREPARE alterIfNotExists2 FROM @preparedStatement2;
EXECUTE alterIfNotExists2;
DEALLOCATE PREPARE alterIfNotExists2;

-- Add index if it doesn't exist (MySQL doesn't have IF NOT EXISTS for indexes, so we use a check)
SET @tablename2 = "vendor_documents";
SET @indexname = "idx_vendor_profiles_picture";

-- Add document verification columns only if they don't exist
SET @columnname3 = "verification_status";
SET @preparedStatement3 = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE 
    (table_name = @tablename2) AND (table_schema = @dbname) AND (column_name = @columnname3)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename2, " ADD COLUMN ", @columnname3, " ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending' AFTER file_size")
));
PREPARE alterIfNotExists3 FROM @preparedStatement3;
EXECUTE alterIfNotExists3;
DEALLOCATE PREPARE alterIfNotExists3;

-- Add verified_at if it doesn't exist
SET @columnname4 = "verified_at";
SET @preparedStatement4 = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE 
    (table_name = @tablename2) AND (table_schema = @dbname) AND (column_name = @columnname4)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename2, " ADD COLUMN ", @columnname4, " TIMESTAMP NULL")
));
PREPARE alterIfNotExists4 FROM @preparedStatement4;
EXECUTE alterIfNotExists4;
DEALLOCATE PREPARE alterIfNotExists4;

-- Add verified_by if it doesn't exist
SET @columnname5 = "verified_by";
SET @preparedStatement5 = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE 
    (table_name = @tablename2) AND (table_schema = @dbname) AND (column_name = @columnname5)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename2, " ADD COLUMN ", @columnname5, " BIGINT UNSIGNED NULL")
));
PREPARE alterIfNotExists5 FROM @preparedStatement5;
EXECUTE alterIfNotExists5;
DEALLOCATE PREPARE alterIfNotExists5;

-- Migration complete
SELECT "Profile picture migration completed successfully!" AS message;
