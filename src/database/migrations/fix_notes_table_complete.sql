-- Complete fix for notes table - remove is_private and update type constraint

-- First backup existing data
CREATE TEMPORARY TABLE notes_backup AS SELECT * FROM notes;

-- Drop the old table
DROP TABLE notes;

-- Create the new table with correct schema
CREATE TABLE notes (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('General', 'Introduction Meeting', 'Career Planning', 'Interview Prep', 'Job Search Strategy', 'Follow-up Required', 'Academic Concern', 'Resume Review', 'Mock Interview', 'Academic', 'Personal', 'Follow-up', 'Alert')),
    date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
    student_year_at_time TEXT,
    tags TEXT DEFAULT '[]',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Copy data from backup (excluding is_private)
INSERT INTO notes (id, student_id, content, type, date_created, student_year_at_time, tags, updated_at)
SELECT id, student_id, content, type, date_created, student_year_at_time, tags, updated_at
FROM notes_backup;

-- Drop the temporary backup table
DROP TABLE notes_backup;

-- Recreate indexes
CREATE INDEX idx_notes_student_id ON notes(student_id);
CREATE INDEX idx_notes_date_created ON notes(date_created);