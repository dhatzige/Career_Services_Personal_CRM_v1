-- SQLite doesn't support dropping columns directly, so we need to recreate the table
-- Create new table without is_private column
CREATE TABLE notes_new (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT CHECK (type IN ('General', 'Academic', 'Personal', 'Follow-up', 'Alert', 'Career Planning', 'Interview Prep')),
    date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
    student_year_at_time TEXT,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Copy data from old table
INSERT INTO notes_new (id, student_id, content, type, date_created, student_year_at_time, tags, created_at, updated_at)
SELECT id, student_id, content, type, date_created, student_year_at_time, tags, created_at, updated_at
FROM notes;

-- Drop old table
DROP TABLE notes;

-- Rename new table
ALTER TABLE notes_new RENAME TO notes;