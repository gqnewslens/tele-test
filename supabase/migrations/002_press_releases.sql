-- Create press_releases table
CREATE TABLE IF NOT EXISTS press_releases (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Source information
  source VARCHAR(50) NOT NULL, -- 'msit' or 'kcc'
  source_id VARCHAR(255) NOT NULL, -- Original ID from source

  -- Content
  title TEXT NOT NULL,
  content TEXT,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  url TEXT NOT NULL,

  -- Metadata
  category VARCHAR(100),
  department VARCHAR(200),
  author VARCHAR(200),
  attachments JSONB, -- Array of attachment info

  -- Tracking
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Unique constraint on source + source_id
  UNIQUE(source, source_id)
);

-- Create indexes for common queries
CREATE INDEX idx_press_releases_source ON press_releases(source);
CREATE INDEX idx_press_releases_published_at ON press_releases(published_at DESC);
CREATE INDEX idx_press_releases_category ON press_releases(category);
CREATE INDEX idx_press_releases_created_at ON press_releases(created_at DESC);

-- Add RLS policies (Row Level Security)
ALTER TABLE press_releases ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated and anonymous users
CREATE POLICY "Allow public read access" ON press_releases
  FOR SELECT
  USING (true);

-- Allow insert/update only for authenticated users (service role)
CREATE POLICY "Allow authenticated insert" ON press_releases
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON press_releases
  FOR UPDATE
  USING (true);

-- Add comment for documentation
COMMENT ON TABLE press_releases IS 'Stores press releases from MSIT (과기부) and KCC (방미통위)';
