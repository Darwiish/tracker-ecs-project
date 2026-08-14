-- Migration 007: add category field to tasks

ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS category VARCHAR(20) NOT NULL DEFAULT 'General';
