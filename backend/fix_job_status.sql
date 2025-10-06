-- Fix job_search_status constraint
PRAGMA foreign_keys=off;

BEGIN TRANSACTION;

-- Create temporary table with new constraint
CREATE TABLE students_temp (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    year_of_study TEXT,
    status TEXT DEFAULT 'Active',
    program_type TEXT,
    specific_program TEXT,
    major TEXT,
    academic_start_date DATE,
    expected_graduation DATE,
    career_interests TEXT,
    linkedin_url TEXT,
    resume_on_file INTEGER DEFAULT 0,
    resume_last_updated DATE,
    job_search_status TEXT CHECK (job_search_status IN ('Not Started', 'Preparing', 'Actively Searching', 'Searching for Internship', 'Interviewing', 'Offer Received', 'Employed', 'Not Seeking')),
    target_industries TEXT,
    target_locations TEXT,
    tags TEXT,
    quick_note TEXT,
    no_show_count INTEGER DEFAULT 0,
    last_attendance_status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Copy all data
INSERT INTO students_temp SELECT * FROM students;

-- Drop old table
DROP TABLE students;

-- Rename temp to students
ALTER TABLE students_temp RENAME TO students;

-- Recreate indexes
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_job_search_status ON students(job_search_status);

COMMIT;

PRAGMA foreign_keys=on;