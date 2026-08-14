-- Migration 002: add status column (Todo / In Progress / Done)

ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'Todo';
