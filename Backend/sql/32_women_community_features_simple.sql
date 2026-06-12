-- Women Vendor Community Features Schema (Simple Version)
-- Only creates new tables for likes, comments, saves, and shares
-- Does not modify existing tables to avoid conflicts

USE hawker;

-- Table: women_post_likes
-- Tracks which users liked which posts (one like per person)
CREATE TABLE IF NOT EXISTS women_post_likes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  post_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_post_like (post_id, user_id),
  KEY idx_post_id (post_id),
  KEY idx_user_id (user_id),
  CONSTRAINT fk_post_like_post FOREIGN KEY (post_id) REFERENCES women_community_posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_post_like_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- Table: women_post_comments
-- Stores comments on community posts
CREATE TABLE IF NOT EXISTS women_post_comments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  post_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_post_id (post_id),
  KEY idx_user_id (user_id),
  CONSTRAINT fk_comment_post FOREIGN KEY (post_id) REFERENCES women_community_posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_comment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- Table: women_post_saves
-- Tracks which users saved/bookmarked which posts
CREATE TABLE IF NOT EXISTS women_post_saves (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  post_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_post_save (post_id, user_id),
  KEY idx_post_id (post_id),
  KEY idx_user_id (user_id),
  CONSTRAINT fk_post_save_post FOREIGN KEY (post_id) REFERENCES women_community_posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_post_save_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- Table: women_post_shares
-- Tracks shares of community posts
CREATE TABLE IF NOT EXISTS women_post_shares (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  post_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  share_platform VARCHAR(50) DEFAULT 'other',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_post_id (post_id),
  KEY idx_user_id (user_id),
  CONSTRAINT fk_post_share_post FOREIGN KEY (post_id) REFERENCES women_community_posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_post_share_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE = InnoDB;
