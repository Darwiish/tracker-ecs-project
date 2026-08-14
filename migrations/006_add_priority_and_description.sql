-- Migration 006: add priority and description fields to tasks

ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS priority VARCHAR(10) NOT NULL DEFAULT 'Medium';

ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS description TEXT;

-- Keep priority values constrained to known levels
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage
        WHERE constraint_name = 'chk_priority'
    ) THEN
        ALTER TABLE tasks
            ADD CONSTRAINT chk_priority CHECK (priority IN ('Low', 'Medium', 'High'));
    END IF;
END $$;
