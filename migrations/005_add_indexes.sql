-- Migration 005: indexes to support common query patterns
-- (filtering/sorting tasks per user, and the due-date ORDER BY used by GET /tasks)

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
