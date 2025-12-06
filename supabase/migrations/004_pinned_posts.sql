-- Create pinned_posts table for featured/important notices
-- This enables "pin post" functionality for highlighting important messages

CREATE TABLE IF NOT EXISTS pinned_posts (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Reference to the original telegram post
  post_id BIGINT NOT NULL REFERENCES telegram_posts(id) ON DELETE CASCADE,

  -- Pin metadata
  pinned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  pinned_by VARCHAR(100), -- Who pinned it (for future admin tracking)

  -- Display order (lower = higher priority)
  display_order INTEGER DEFAULT 0,

  -- Optional custom title override
  custom_title TEXT,

  -- Unique constraint - each post can only be pinned once
  UNIQUE(post_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_pinned_posts_pinned_at ON pinned_posts(pinned_at DESC);
CREATE INDEX IF NOT EXISTS idx_pinned_posts_display_order ON pinned_posts(display_order ASC);

-- Add RLS policies
ALTER TABLE pinned_posts ENABLE ROW LEVEL SECURITY;

-- Allow read access to all users
CREATE POLICY "Allow public read access" ON pinned_posts
  FOR SELECT
  USING (true);

-- Allow insert/update/delete for authenticated users
CREATE POLICY "Allow authenticated insert" ON pinned_posts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON pinned_posts
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow authenticated delete" ON pinned_posts
  FOR DELETE
  USING (true);

-- Add comment for documentation
COMMENT ON TABLE pinned_posts IS 'Stores pinned/featured posts for the main dashboard notice section';
