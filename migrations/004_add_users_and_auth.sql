-- Migration 004: add users table and scope tasks to a user (JWT auth)

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- Add the foreign key only if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_user' AND table_name = 'tasks'
    ) THEN
        ALTER TABLE tasks
            ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id);
    END IF;
END $$;
