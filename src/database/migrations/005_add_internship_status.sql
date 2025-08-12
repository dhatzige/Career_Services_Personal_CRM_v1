-- Migration to add 'Searching for Internship' to job_search_status CHECK constraint
-- Date: 2025-08-08

-- SQLite doesn't support ALTER TABLE to modify CHECK constraints directly
-- We need to recreate the table with the new constraint

-- Step 1: Create a temporary table with the new constraint
CREATE TABLE students_new (
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

-- Step 2: Copy data from the old table to the new table
INSERT INTO students_new SELECT * FROM students;

-- Step 3: Drop the old table
DROP TABLE students;

-- Step 4: Rename the new table to the original name
ALTER TABLE students_new RENAME TO students;

-- Step 5: Recreate the indexes
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_job_search_status ON students(job_search_status);