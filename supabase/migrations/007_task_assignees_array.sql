-- Convert assignee (single) to assignees (array) for multiple assignees
-- 담당자 단일 필드를 다중 담당자 배열로 변환

-- 1. Add new assignees array column
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignees TEXT[];

-- 2. Migrate existing assignee data to assignees array
UPDATE tasks
SET assignees = ARRAY[assignee]
WHERE assignee IS NOT NULL AND assignee != '';

-- 3. Drop old assignee column (optional - keep for backward compatibility during transition)
-- ALTER TABLE tasks DROP COLUMN IF EXISTS assignee;

-- 4. Create index for array search
CREATE INDEX IF NOT EXISTS idx_tasks_assignees ON tasks USING GIN(assignees);

-- 5. Comment for future Google auth integration
-- assignees will store user identifiers (email or user_id)
-- Format: ['user@example.com', 'another@example.com']
-- Or after Google auth: ['google_user_id_1', 'google_user_id_2']
