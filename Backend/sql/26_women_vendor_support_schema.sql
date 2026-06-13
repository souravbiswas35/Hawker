-- Women Vendor Support Feature Schema
-- This schema supports the Women Vendor Support page with schemes, mentorship, success stories, community, safety guidelines, and emergency contacts
-- BEFORE: 27, 28, 32, 33
-- AFTER: 01_hawker_schema.sql (Required)

USE hawker;

-- Table: women_schemes_subsidies
-- Stores information about government schemes and subsidies for women vendors
CREATE TABLE IF NOT EXISTS women_schemes_subsidies (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(10, 2),
    eligibility_criteria TEXT,
    application_link VARCHAR(500),
    deadline DATE,
    status ENUM(
        'active',
        'expired',
        'upcoming'
    ) DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE = InnoDB;

-- Table: women_mentors
-- Stores mentor profiles for the mentorship program
CREATE TABLE IF NOT EXISTS women_mentors (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    expertise VARCHAR(255) NOT NULL,
    experience_years INT NOT NULL,
    bio TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    profile_picture_url VARCHAR(500),
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE = InnoDB;

-- Table: women_success_stories
-- Stores success stories of women vendors
CREATE TABLE IF NOT EXISTS women_success_stories (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    vendor_name VARCHAR(255) NOT NULL,
    business_category VARCHAR(255) NOT NULL,
    earnings_monthly VARCHAR(100),
    story_title VARCHAR(255),
    story_content TEXT,
    profile_picture_url VARCHAR(500),
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE = InnoDB;

-- Table: women_community_posts
-- Stores community forum posts
CREATE TABLE IF NOT EXISTS women_community_posts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    likes_count INT DEFAULT 0,
    replies_count INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_user_id (user_id),
    CONSTRAINT fk_community_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- Table: women_safety_guides
-- Stores safety guidelines and downloadable resources
CREATE TABLE IF NOT EXISTS women_safety_guides (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    guide_content TEXT,
    pdf_url VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE = InnoDB;

-- Table: women_emergency_contacts
-- Stores emergency contact information
CREATE TABLE IF NOT EXISTS women_emergency_contacts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    contact_type VARCHAR(100) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    description TEXT,
    available_24_7 BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE = InnoDB;

-- Table: women_scheme_applications
-- Tracks vendor applications for women-specific schemes
CREATE TABLE IF NOT EXISTS women_scheme_applications (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    scheme_id BIGINT UNSIGNED NOT NULL,
    application_ref VARCHAR(100) NOT NULL,
    status ENUM(
        'pending',
        'approved',
        'rejected',
        'under_review'
    ) DEFAULT 'pending',
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    remarks TEXT,
    PRIMARY KEY (id),
    KEY idx_user_id (user_id),
    KEY idx_scheme_id (scheme_id),
    CONSTRAINT fk_scheme_application_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_scheme_application_scheme FOREIGN KEY (scheme_id) REFERENCES women_schemes_subsidies (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- Table: women_mentor_connections
-- Tracks mentor-mentee connections
CREATE TABLE IF NOT EXISTS women_mentor_connections (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    mentor_id BIGINT UNSIGNED NOT NULL,
    status ENUM(
        'requested',
        'accepted',
        'rejected',
        'completed'
    ) DEFAULT 'requested',
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    remarks TEXT,
    PRIMARY KEY (id),
    KEY idx_user_id (user_id),
    KEY idx_mentor_id (mentor_id),
    CONSTRAINT fk_mentor_connection_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_mentor_connection_mentor FOREIGN KEY (mentor_id) REFERENCES women_mentors (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- Insert demo data for women_schemes_subsidies
INSERT INTO
    women_schemes_subsidies (
        name,
        description,
        amount,
        eligibility_criteria,
        application_link,
        deadline,
        status
    )
VALUES (
        'Women Entrepreneur Grant 2026',
        'Financial grant for women entrepreneurs to start or expand their business',
        25000.00,
        'Women vendor with valid license, business operational for at least 6 months',
        '#',
        '2026-12-31',
        'active'
    ),
    (
        'License Fee Subsidy (50% OFF)',
        '50% discount on annual license fee renewal for women vendors',
        5000.00,
        'Women vendor with valid license, renewal due within 3 months',
        '#',
        '2026-12-31',
        'active'
    ),
    (
        'Business Training Program March 2026',
        'Free business training and skill development program',
        0.00,
        'Women vendor with valid license, interested in skill development',
        '#',
        '2026-03-31',
        'active'
    );

-- Insert demo data for women_mentors
INSERT INTO
    women_mentors (
        name,
        expertise,
        experience_years,
        bio,
        contact_email,
        contact_phone,
        available
    )
VALUES (
        'Maheen Khan',
        'Fashion Accessories',
        18,
        'Expert in fashion accessories with 18 years of experience in retail and wholesale business',
        'maheen.khan@example.com',
        '+8801700123456',
        TRUE
    ),
    (
        'Fatima Rahman',
        'Food & Beverages',
        15,
        'Specialized in food business management and hygiene standards',
        'fatima.rahman@example.com',
        '+8801700123457',
        TRUE
    ),
    (
        'Ayesha Begum',
        'Handicrafts',
        20,
        'Master artisan with expertise in traditional handicrafts and export business',
        'ayesha.begum@example.com',
        '+8801700123458',
        TRUE
    );

-- Insert demo data for women_success_stories
INSERT INTO
    women_success_stories (
        vendor_name,
        business_category,
        earnings_monthly,
        story_title,
        story_content,
        featured
    )
VALUES (
        'Afifa Tasnim',
        'Handicrafts',
        '৳ 1 Lac/month',
        'From Home to Market',
        'Started with handmade crafts from home, now runs a successful stall with monthly earnings of 1 Lac',
        TRUE
    ),
    (
        'Rashida Akter',
        'Food & Beverages',
        '৳ 80,000/month',
        'Street Food Success',
        'Built a popular food stall serving traditional snacks, now expanding to multiple locations',
        TRUE
    ),
    (
        'Nasreen Sultana',
        'Fashion Accessories',
        '৳ 1.2 Lac/month',
        'Fashion Empire',
        'Started with small jewelry items, now owns a fashion accessories business with high demand',
        FALSE
    );

-- Insert demo data for women_safety_guides
INSERT INTO
    women_safety_guides (
        title,
        description,
        guide_content,
        pdf_url
    )
VALUES (
        'Women Vendor Safety Guide',
        'Essential safety tips for women vendors working in public spaces',
        'This guide covers personal safety, emergency procedures, harassment reporting, and best practices for women vendors.',
        '#'
    ),
    (
        'Legal Rights for Women Vendors',
        'Understanding your legal rights and protections as a women vendor',
        'Comprehensive guide on legal protections, complaint procedures, and support systems available for women vendors.',
        '#'
    );

-- Insert demo data for women_emergency_contacts
INSERT INTO
    women_emergency_contacts (
        contact_type,
        contact_name,
        phone_number,
        description,
        available_24_7
    )
VALUES (
        'Police',
        'Emergency Police',
        '999',
        'National emergency helpline for immediate police assistance',
        TRUE
    ),
    (
        'Women Helpline',
        'National Women Helpline',
        '109',
        '24/7 helpline for women in distress',
        TRUE
    ),
    (
        'Support',
        'Vendor Support Team',
        '+8801700111222',
        'Dedicated support team for women vendors',
        TRUE
    );