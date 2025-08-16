-- Backup data first
CREATE TABLE students_backup AS SELECT * FROM students;

-- Drop the old table
DROP TABLE students;

-- Create new table with updated constraint
CREATE TABLE students (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    year_of_study TEXT CHECK (year_of_study IN ('1st year', '2nd year', '3rd year', '4th year', 'Graduate', 'Alumni')),
    program_type TEXT CHECK (program_type IN ('Bachelor''s', 'Master''s', 'PhD')),
    specific_program TEXT,
    major TEXT,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Graduated')),
    date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_interaction DATETIME,
    academic_start_date DATE,
    expected_graduation DATE,
    avatar TEXT,
    tags TEXT,
    career_interests TEXT,
    linkedin_url TEXT,
    resume_on_file INTEGER DEFAULT 0,
    resume_last_updated DATE,
    job_search_status TEXT CHECK (job_search_status IN ('Not Started', 'Preparing', 'Actively Searching', 'Searching for Internship', 'Interviewing', 'Offer Received', 'Employed', 'Not Seeking')),
    target_industries TEXT,
    target_locations TEXT,
    no_show_count INTEGER DEFAULT 0,
    last_no_show_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    lastAttendanceStatus TEXT DEFAULT 'scheduled'
);

-- Copy data back
INSERT INTO students SELECT * FROM students_backup;

-- Drop backup
DROP TABLE students_backup;

-- Recreate indexes
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_job_search_status ON students(job_search_status);
