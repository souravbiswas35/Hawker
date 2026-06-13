-- Add gender column to vendor_profiles table if it doesn't exist
-- BEFORE: Women vendor features dependent on gender
-- AFTER: 26_women_vendor_support_schema.sql (Required)

USE hawker;

SET @dbname = DATABASE();

SET @tablename = "vendor_profiles";

SET @columnname = "gender";

SET
    @preparedStatement = (
        SELECT IF(
                (
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE (TABLE_SCHEMA = @dbname)
                        AND (TABLE_NAME = @tablename)
                        AND (COLUMN_NAME = @columnname)
                ) > 0, 'SELECT ''gender column exists'' AS message', CONCAT(
                    'ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' ENUM(''male'', ''female'', ''other'') NULL AFTER date_of_birth'
                )
            )
    );

PREPARE alterIfNotExists FROM @preparedStatement;

EXECUTE alterIfNotExists;

DEALLOCATE PREPARE alterIfNotExists;