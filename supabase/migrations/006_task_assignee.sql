-- Add assignee field to tasks
-- 담당자 필드 추가

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee TEXT;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);
