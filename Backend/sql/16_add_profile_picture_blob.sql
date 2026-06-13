-- Add profile picture BLOB column to store image data in database
-- BEFORE: All profile picture dependent features
-- AFTER: 06_add_profile_picture.sql (Required)

USE hawker;

-- Add profile_picture_data column (BLOB) if it doesn't exist
SET @dbname = DATABASE();

SET @tablename = "vendor_profiles";

SET @columnname = "profile_picture_data";

SET
    @preparedStatement = (
        SELECT IF(
                (
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE (table_name = @tablename)
                        AND (table_schema = @dbname)
                        AND (column_name = @columnname)
                ) > 0, "SELECT 1", CONCAT(
                    "ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " LONGBLOB NULL AFTER profile_picture_uploaded_at"
                )
            )
    );

PREPARE alterIfNotExists FROM @preparedStatement;

EXECUTE alterIfNotExists;

DEALLOCATE PREPARE alterIfNotExists;

-- Add profile_picture_mime_type column if it doesn't exist
SET @columnname2 = "profile_picture_mime_type";

SET
    @preparedStatement2 = (
        SELECT IF(
                (
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE (table_name = @tablename)
                        AND (table_schema = @dbname)
                        AND (column_name = @columnname2)
                ) > 0, "SELECT 1", CONCAT(
                    "ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname2, " VARCHAR(100) NULL AFTER profile_picture_data"
                )
            )
    );

PREPARE alterIfNotExists2 FROM @preparedStatement2;

EXECUTE alterIfNotExists2;

DEALLOCATE PREPARE alterIfNotExists2;

-- Migration complete
SELECT "Profile picture BLOB columns added successfully!" AS message;