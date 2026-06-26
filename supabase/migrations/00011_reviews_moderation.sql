-- 00011: Reviews Moderation
-- Adds moderation columns to reviews table for admin review management

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS hidden_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS moderation_note TEXT;

CREATE INDEX IF NOT EXISTS idx_reviews_hidden ON reviews(is_hidden)
  WHERE is_hidden = true;
