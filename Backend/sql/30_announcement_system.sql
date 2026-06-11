-- Announcement System Schema
-- Run this file to create the announcement tables

USE hawker;

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category ENUM('policy_changes', 'new_features', 'events', 'holidays', 'general') NOT NULL DEFAULT 'general',
  is_pinned BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  publish_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  expiry_date DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_category (category),
  INDEX idx_is_pinned (is_pinned),
  INDEX idx_is_active (is_active),
  INDEX idx_publish_date (publish_date),
  INDEX idx_expiry_date (expiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create announcement_attachments table
CREATE TABLE IF NOT EXISTS announcement_attachments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  announcement_id BIGINT UNSIGNED NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
  INDEX idx_announcement_id (announcement_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create announcement_views table to track which users have viewed which announcements
CREATE TABLE IF NOT EXISTS announcement_views (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  announcement_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_view (announcement_id, user_id),
  INDEX idx_announcement_id (announcement_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create announcement_archive table for archived announcements
CREATE TABLE IF NOT EXISTS announcement_archive (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  original_announcement_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category ENUM('policy_changes', 'new_features', 'events', 'holidays', 'general') NOT NULL,
  admin_id BIGINT UNSIGNED NOT NULL,
  archived_by BIGINT UNSIGNED NOT NULL,
  archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  original_publish_date DATETIME NOT NULL,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (archived_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_category (category),
  INDEX idx_archived_at (archived_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update AUTO_INCREMENT
ALTER TABLE announcements AUTO_INCREMENT = 100;
ALTER TABLE announcement_attachments AUTO_INCREMENT = 100;
ALTER TABLE announcement_views AUTO_INCREMENT = 100;
ALTER TABLE announcement_archive AUTO_INCREMENT = 100;

-- Insert sample announcements
INSERT INTO announcements (admin_id, title, content, category, is_pinned, priority, publish_date) VALUES
(1, 'New License Application Process', 'We have improved the license application process with a new 6-step form. The new process is more streamlined and user-friendly. Please review the updated guidelines before applying.', 'new_features', TRUE, 'high', NOW()),
(1, 'Holiday Schedule Update', 'Please note the updated holiday schedule for the upcoming month. All vending zones will be closed on national holidays.', 'holidays', TRUE, 'high', NOW()),
(1, 'Policy Change: Zone Assignment', 'Effective from next month, zone assignments will be based on a new priority system. Please check your dashboard for updated zone information.', 'policy_changes', FALSE, 'medium', NOW());
