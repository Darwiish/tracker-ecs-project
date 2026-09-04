-- tracker-ecs-project — full database schema
-- Equivalent to running migrations 001-007 in order.
-- Safe to run against a fresh PostgreSQL database such as the RDS instance.

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Todo',
    due_date DATE,
    priority VARCHAR(10) NOT NULL DEFAULT 'Medium',
    description TEXT,
    category VARCHAR(20) NOT NULL DEFAULT 'General',
    user_id INTEGER,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_priority'
          AND conrelid = 'tasks'::regclass
    ) THEN
        ALTER TABLE tasks
            ADD CONSTRAINT chk_priority
            CHECK (priority IN ('Low', 'Medium', 'High'));
    END IF;
END $$;
