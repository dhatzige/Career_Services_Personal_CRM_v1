-- Update program_type constraint to remove PhD and keep only Bachelor's and Master's
-- Also add specific_program column if it doesn't exist

-- First, drop the existing constraint by recreating the table
-- SQLite doesn't support ALTER COLUMN directly, so we need to recreate

-- Create a temporary table with the new constraint
CREATE TABLE students_new (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    year_of_study TEXT CHECK (year_of_study IN ('1st year', '2nd year', '3rd year', '4th year', 'Graduate', 'Alumni')),
    program_type TEXT CHECK (program_type IN ('Bachelor''s', 'Master''s')),
    specific_program TEXT,
    major TEXT,
    status TEXT DEFAULT 'Active',
    date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_interaction DATETIME,
    academic_start_date DATE,
    expected_graduation DATE,
    avatar TEXT,
    career_interests TEXT,
    linkedin_url TEXT,
    resume_on_file BOOLEAN DEFAULT 0,
    resume_last_updated DATETIME,
    job_search_status TEXT CHECK (job_search_status IN ('Not Started', 'Preparing', 'Actively Searching', 'Searching for Internship', 'Currently Interning', 'Interviewing', 'Offer Received', 'Employed', 'Not Seeking')),
    target_industries TEXT,
    target_locations TEXT,
    no_show_count INTEGER DEFAULT 0,
    last_no_show_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    tags TEXT,
    quick_note TEXT,
    last_attendance_status TEXT CHECK (last_attendance_status IN ('attended', 'no-show', 'cancelled', 'rescheduled', 'scheduled'))
);

-- Copy data from old table to new table
INSERT INTO students_new SELECT * FROM students;

-- Drop old table
DROP TABLE students;

-- Rename new table to students
ALTER TABLE students_new RENAME TO students;

-- Recreate indexes
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_year_of_study ON students(year_of_study);
CREATE INDEX idx_students_program_type ON students(program_type);
CREATE INDEX idx_students_job_search_status ON students(job_search_status);

-- Add some common master's programs as reference (these are just comments for documentation)
-- MBA - Master of Business Administration
-- Masters in Tourism Management
-- MS in Industrial Organizational Psychology