-- Add zone rectangle coordinates column to license_applications
-- This will store the Google Maps rectangle bounds for allocated zones
-- BEFORE: Zone mapping features
-- AFTER: 03_license_application_schema.sql (Required)

USE hawker;

-- Add zone_rectangle column as JSON to store rectangle bounds
ALTER TABLE license_applications
ADD COLUMN zone_rectangle JSON NULL COMMENT 'Google Maps rectangle bounds for allocated zone (north, south, east, west)';