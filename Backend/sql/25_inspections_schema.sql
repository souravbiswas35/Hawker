-- Inspections schema
-- Run this file after 24_vendor_settings_schema.sql
-- BEFORE: Inspection-dependent features
-- AFTER: 24_vendor_settings_schema.sql (Required)

USE hawker;

-- Drop tables if they exist (in reverse order of dependencies)
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS inspections;

DROP TABLE IF EXISTS inspection_templates;

DROP TABLE IF EXISTS inspectors;

SET FOREIGN_KEY_CHECKS = 1;

-- Create inspectors table
CREATE TABLE inspectors (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    inspector_rank VARCHAR(100) NOT NULL,
    badge_number VARCHAR(50) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_inspectors_badge (badge_number),
    KEY idx_inspectors_user (user_id)
) ENGINE = InnoDB;

-- Create inspection templates table
CREATE TABLE inspection_templates (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    checklist_items JSON NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE = InnoDB;

-- Create inspections table
CREATE TABLE inspections (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    inspector_id BIGINT UNSIGNED NOT NULL,
    template_id BIGINT UNSIGNED,
    type ENUM(
        'routine',
        'license_verification',
        'initial_setup',
        'complaint',
        'follow_up'
    ) NOT NULL DEFAULT 'routine',
    scheduled_date DATETIME NOT NULL,
    completed_date DATETIME,
    status ENUM(
        'scheduled',
        'in_progress',
        'completed',
        'cancelled',
        'rescheduled'
    ) NOT NULL DEFAULT 'scheduled',
    outcome ENUM(
        'passed',
        'minor_issues',
        'warnings',
        'failed',
        'pending'
    ) DEFAULT 'pending',
    compliance_rate DECIMAL(5, 2) DEFAULT 0.00,
    checklist_results JSON,
    photos JSON,
    gps_coordinates VARCHAR(100),
    violations TEXT,
    comments TEXT,
    action_required TEXT,
    follow_up_date DATETIME,
    vendor_signature VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_inspections_user (user_id),
    KEY idx_inspections_inspector (inspector_id),
    KEY idx_inspections_status (status),
    KEY idx_inspections_scheduled_date (scheduled_date),
    KEY idx_inspections_template (template_id)
) ENGINE = InnoDB;

-- Insert default inspection templates
INSERT INTO
    inspection_templates (
        name,
        description,
        checklist_items
    )
VALUES (
        'Routine Inspection',
        'Standard routine inspection for street vendors',
        JSON_ARRAY(
            JSON_OBJECT(
                'item',
                'License Displayed',
                'category',
                'compliance'
            ),
            JSON_OBJECT(
                'item',
                'Zone Boundaries Respected',
                'category',
                'compliance'
            ),
            JSON_OBJECT(
                'item',
                'Hygiene Standards',
                'category',
                'hygiene'
            ),
            JSON_OBJECT(
                'item',
                'Safety Compliance',
                'category',
                'safety'
            ),
            JSON_OBJECT(
                'item',
                'Authorized Goods Only',
                'category',
                'compliance'
            ),
            JSON_OBJECT(
                'item',
                'Operating Hours Compliance',
                'category',
                'compliance'
            ),
            JSON_OBJECT(
                'item',
                'Waste Management',
                'category',
                'hygiene'
            ),
            JSON_OBJECT(
                'item',
                'Fire Safety Equipment',
                'category',
                'safety'
            )
        )
    ),
    (
        'License Verification',
        'Verification of vendor license validity',
        JSON_ARRAY(
            JSON_OBJECT(
                'item',
                'Valid License Present',
                'category',
                'compliance'
            ),
            JSON_OBJECT(
                'item',
                'License Photo Matches Vendor',
                'category',
                'compliance'
            ),
            JSON_OBJECT(
                'item',
                'License Not Expired',
                'category',
                'compliance'
            ),
            JSON_OBJECT(
                'item',
                'Correct Zone Assignment',
                'category',
                'compliance'
            )
        )
    ),
    (
        'Initial Setup',
        'Initial inspection for new vendor setup',
        JSON_ARRAY(
            JSON_OBJECT(
                'item',
                'Vendor Identity Verified',
                'category',
                'compliance'
            ),
            JSON_OBJECT(
                'item',
                'Zone Assignment Confirmed',
                'category',
                'compliance'
            ),
            JSON_OBJECT(
                'item',
                'Equipment Setup Complete',
                'category',
                'safety'
            ),
            JSON_OBJECT(
                'item',
                'Hygiene Training Completed',
                'category',
                'hygiene'
            ),
            JSON_OBJECT(
                'item',
                'Operating Hours Set',
                'category',
                'compliance'
            )
        )
    );