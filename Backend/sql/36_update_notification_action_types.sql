-- Update vendor_notifications action_type ENUM to include multi-step approval workflow actions
-- BEFORE: Notification action-dependent features
-- AFTER: 35_multi_step_approval_workflow.sql, 16_enhance_notifications_schema.sql (Required)

USE hawker;

-- First, normalize any existing action_type values so the ALTER can succeed safely
UPDATE vendor_notifications
SET
    action_type = CASE
        WHEN action_type IN (
            'approve',
            'reject',
            'need_info',
            'system',
            'payment',
            'renewal',
            'zone_change',
            'inspection',
            'admin_rejected',
            'document_approved',
            'document_rejected',
            'inspection_assigned',
            'inspection_scheduled',
            'inspection_conducted',
            'inspection_passed',
            'inspection_failed',
            'city_corp_approved',
            'city_corp_rejected'
        ) THEN action_type
        ELSE 'approve'
    END;

ALTER TABLE vendor_notifications
MODIFY COLUMN action_type ENUM(
    'approve',
    'reject',
    'need_info',
    'system',
    'payment',
    'renewal',
    'zone_change',
    'inspection',
    'admin_rejected',
    'document_approved',
    'document_rejected',
    'inspection_assigned',
    'inspection_scheduled',
    'inspection_conducted',
    'inspection_passed',
    'inspection_failed',
    'city_corp_approved',
    'city_corp_rejected'
) NOT NULL DEFAULT 'approve';