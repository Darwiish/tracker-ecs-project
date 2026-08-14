-- Migration 003: add optional due_date column

ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS due_date DATE;
