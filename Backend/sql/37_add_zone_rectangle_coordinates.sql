-- Add zone rectangle coordinates column to license_applications
-- This will store the Google Maps rectangle bounds for allocated zones

USE hawker;

-- Add zone_rectangle column as JSON to store rectangle bounds
ALTER TABLE license_applications 
ADD COLUMN zone_rectangle JSON NULL 
COMMENT 'Google Maps rectangle bounds for allocated zone (north, south, east, west)';

-- Add index for faster queries on applications with allocated zones
ALTER TABLE license_applications 
ADD INDEX idx_zone_rectangle (zone_rectangle(255));
