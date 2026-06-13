-- Fix license_applications status column to support multi-step application process
-- This script updates the ENUM to include all necessary status values
-- BEFORE: 12, 13
-- AFTER: 01_hawker_schema.sql (Required)

USE hawker;

-- First, modify the status column to support all application statuses
ALTER TABLE license_applications
MODIFY COLUMN status ENUM(
    'draft',
    'submitted',
    'under-review',
    'approved',
    'rejected',
    'needs-info',
    'pending',
    'in_progress',
    'completed'
) NOT NULL DEFAULT 'draft';

-- Note: step_status column already exists, skipping addition

-- Note: Index already exists, skipping addition

-- Update existing records to use new default status
UPDATE license_applications
SET
    status = 'submitted'
WHERE
    status IN (
        'submitted',
        'under-review',
        'approved',
        'rejected',
        'needs-info'
    );