-- Update vendor_notifications action_type ENUM to include multi-step approval workflow actions
USE hawker;

-- First, update any existing action_type values that might not be in the new ENUM
UPDATE vendor_notifications SET action_type = 'approve' WHERE action_type NOT IN ('approve', 'reject', 'need_info');

-- Modify the action_type column to include new action types
ALTER TABLE vendor_notifications
MODIFY COLUMN action_type ENUM(
    'approve',
    'reject',
    'need_info',
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
