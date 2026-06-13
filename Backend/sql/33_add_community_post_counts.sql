-- Add saves_count and shares_count columns to women_community_posts table
-- BEFORE: Community features dependent on counts
-- AFTER: 32_women_community_features_simple.sql (Required)

USE hawker;

-- Add saves_count column
SET
    @column_exists = (
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            TABLE_SCHEMA = 'hawker'
            AND TABLE_NAME = 'women_community_posts'
            AND COLUMN_NAME = 'saves_count'
    );

SET
    @sql = IF(
        @column_exists = 0,
        'ALTER TABLE women_community_posts ADD COLUMN saves_count INT DEFAULT 0',
        'SELECT "Column saves_count already exists" AS message'
    );

PREPARE stmt FROM @sql;

EXECUTE stmt;

DEALLOCATE PREPARE stmt;

-- Add shares_count column
SET
    @column_exists = (
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            TABLE_SCHEMA = 'hawker'
            AND TABLE_NAME = 'women_community_posts'
            AND COLUMN_NAME = 'shares_count'
    );

SET
    @sql = IF(
        @column_exists = 0,
        'ALTER TABLE women_community_posts ADD COLUMN shares_count INT DEFAULT 0',
        'SELECT "Column shares_count already exists" AS message'
    );

PREPARE stmt FROM @sql;

EXECUTE stmt;

DEALLOCATE PREPARE stmt;

-- Add comments_count column
SET
    @column_exists = (
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            TABLE_SCHEMA = 'hawker'
            AND TABLE_NAME = 'women_community_posts'
            AND COLUMN_NAME = 'comments_count'
    );

SET
    @sql = IF(
        @column_exists = 0,
        'ALTER TABLE women_community_posts ADD COLUMN comments_count INT DEFAULT 0',
        'SELECT "Column comments_count already exists" AS message'
    );

PREPARE stmt FROM @sql;

EXECUTE stmt;

DEALLOCATE PREPARE stmt;

-- Update existing posts to have default values
UPDATE women_community_posts
SET
    saves_count = 0,
    shares_count = 0,
    comments_count = 0
WHERE
    saves_count IS NULL
    OR shares_count IS NULL
    OR comments_count IS NULL;