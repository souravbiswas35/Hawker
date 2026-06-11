-- Update women_success_stories table to match frontend requirements
USE hawker;

-- Add missing columns to women_success_stories
ALTER TABLE women_success_stories
ADD COLUMN IF NOT EXISTS full_story TEXT AFTER story_content,
ADD COLUMN IF NOT EXISTS business_journey TEXT AFTER full_story,
ADD COLUMN IF NOT EXISTS struggle TEXT AFTER business_journey,
ADD COLUMN IF NOT EXISTS challenge_1 TEXT AFTER struggle,
ADD COLUMN IF NOT EXISTS challenge_2 TEXT AFTER challenge_1,
ADD COLUMN IF NOT EXISTS challenge_3 TEXT AFTER challenge_2,
ADD COLUMN IF NOT EXISTS challenge_4 TEXT AFTER challenge_3,
ADD COLUMN IF NOT EXISTS message TEXT AFTER challenge_4,
ADD COLUMN IF NOT EXISTS is_approved TINYINT(1) DEFAULT 1 AFTER featured,
ADD COLUMN IF NOT EXISTS created_by BIGINT UNSIGNED AFTER is_approved;

-- Add foreign key constraint for created_by
ALTER TABLE women_success_stories
ADD CONSTRAINT fk_success_story_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Update existing demo data with additional fields
UPDATE women_success_stories
SET 
  full_story = story_content,
  business_journey = 'Started from humble beginnings and grew through dedication and hard work.',
  struggle = 'Starting a business as a woman vendor came with many challenges. From securing initial capital to facing skepticism in the market, every step was a test of determination.',
  challenge_1 = 'Overcame financial constraints through government schemes and micro-loans',
  challenge_2 = 'Built customer trust through consistent quality and service',
  challenge_3 = 'Balanced family responsibilities while growing the business',
  challenge_4 = 'Navigated market competition with unique product offerings',
  message = 'Don\'t let challenges stop you. With determination, the right support, and community backing, you can achieve your dreams.'
WHERE full_story IS NULL;
