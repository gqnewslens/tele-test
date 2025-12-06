-- Add reply_to_message_id column to telegram_posts table
-- This enables reply chain functionality

ALTER TABLE telegram_posts
ADD COLUMN IF NOT EXISTS reply_to_message_id INTEGER;

-- Create index for efficient reply chain queries
CREATE INDEX IF NOT EXISTS idx_telegram_posts_reply_to_message_id
ON telegram_posts(reply_to_message_id);

-- Add comment for documentation
COMMENT ON COLUMN telegram_posts.reply_to_message_id IS 'References message_id of the parent message in a reply chain';
