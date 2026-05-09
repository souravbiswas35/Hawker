-- Backfill audit history for existing license applications
-- Run this once on an existing hawker database after the audit log table exists.

USE hawker;

-- Add a submitted audit row for every application that does not already have one.
INSERT INTO
    application_audit_logs (
        application_id,
        action_by,
        action_type,
        comments,
        created_at
    )
SELECT la.id, la.user_id, 'submitted', 'Application submitted by vendor', la.submitted_at
FROM license_applications la
WHERE
    NOT EXISTS (
        SELECT 1
        FROM application_audit_logs aal
        WHERE
            aal.application_id = la.id
            AND aal.action_type = 'submitted'
    );

-- Add the latest review status for applications that already have a final decision
-- but do not yet have a matching audit log row.
INSERT INTO
    application_audit_logs (
        application_id,
        action_by,
        action_type,
        comments,
        created_at
    )
SELECT la.id, COALESCE(la.reviewed_by, la.user_id), la.status, COALESCE(
        la.admin_remarks, CONCAT(
            'Application marked as ', la.status
        )
    ), COALESCE(
        la.reviewed_at, la.submitted_at
    )
FROM license_applications la
WHERE
    la.status IN (
        'approved',
        'rejected',
        'needs-info'
    )
    AND NOT EXISTS (
        SELECT 1
        FROM application_audit_logs aal
        WHERE
            aal.application_id = la.id
            AND aal.action_type = la.status
    );