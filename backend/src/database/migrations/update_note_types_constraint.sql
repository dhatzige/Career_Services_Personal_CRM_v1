-- Update the CHECK constraint on notes table to include new types
-- SQLite doesn't support ALTER TABLE DROP/ADD CONSTRAINT, so we need to recreate the table

-- Create a new table with the updated constraint
CREATE TABLE notes_new (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('General', 'Introduction Meeting', 'Career Planning', 'Interview Prep', 'Job Search Strategy', 'Follow-up Required', 'Academic Concern', 'Resume Review', 'Mock Interview', 'Academic', 'Personal', 'Follow-up', 'Alert')),
    date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
    student_year_at_time TEXT,
    tags TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Copy data from old table to new table
INSERT INTO notes_new (id, student_id, content, type, date_created, student_year_at_time, tags, updated_at)
SELECT id, student_id, content, type, date_created, student_year_at_time, tags, updated_at
FROM notes;

-- Drop the old table
DROP TABLE notes;

-- Rename the new table to notes
ALTER TABLE notes_new RENAME TO notes;

-- Recreate the index
CREATE INDEX idx_notes_student_id ON notes(student_id);
CREATE INDEX idx_notes_date_created ON notes(date_created);