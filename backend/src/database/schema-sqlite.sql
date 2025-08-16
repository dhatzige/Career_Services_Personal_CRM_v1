-- Personal CRM Database Schema for SQLite
-- Career Services Edition

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    is_configured INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Students table with career services fields
CREATE TABLE IF NOT EXISTS students (
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
    tags TEXT, -- JSON array stored as text
    -- Career services specific fields
    career_interests TEXT, -- JSON array
    linkedin_url TEXT,
    resume_on_file INTEGER DEFAULT 0,
    resume_last_updated DATE,
    job_search_status TEXT CHECK (job_search_status IN ('Not Started', 'Preparing', 'Actively Searching', 'Interviewing', 'Offer Received', 'Employed', 'Not Seeking')),
    target_industries TEXT, -- JSON array
    target_locations TEXT, -- JSON array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT CHECK (type IN ('General', 'Academic', 'Personal', 'Follow-up', 'Alert', 'Career Planning', 'Interview Prep')),
    date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_private INTEGER DEFAULT 0,
    student_year_at_time TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Consultations table
CREATE TABLE IF NOT EXISTS consultations (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    consultation_date DATETIME NOT NULL,
    type TEXT CHECK (type IN ('Career Counseling', 'Resume Review', 'Mock Interview', 'Job Search Strategy', 'Internship Planning', 'Graduate School', 'General', 'Follow-up')),
    topic TEXT,
    notes TEXT,
    duration INTEGER,
    location TEXT,
    attended INTEGER DEFAULT 1,
    follow_up_required INTEGER DEFAULT 0,
    follow_up_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Follow-up reminders table
CREATE TABLE IF NOT EXISTS follow_up_reminders (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    consultation_id TEXT,
    reminder_date DATE NOT NULL,
    description TEXT NOT NULL,
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
    completed INTEGER DEFAULT 0,
    completed_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE SET NULL
);

-- Internships and job applications tracking
CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    type TEXT CHECK (type IN ('Internship', 'Full-time', 'Part-time', 'Co-op', 'Fellowship')),
    company_name TEXT NOT NULL,
    position_title TEXT NOT NULL,
    application_date DATE NOT NULL,
    status TEXT CHECK (status IN ('Planning', 'Applied', 'Phone Screen', 'Interview Scheduled', 'Interviewed', 'Offer', 'Rejected', 'Accepted', 'Declined')),
    application_method TEXT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    location TEXT,
    salary_range TEXT,
    notes TEXT,
    follow_up_date DATE,
    response_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Career workshops and events attendance
CREATE TABLE IF NOT EXISTS workshop_attendance (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    workshop_name TEXT NOT NULL,
    workshop_date DATE NOT NULL,
    workshop_type TEXT CHECK (workshop_type IN ('Resume Writing', 'Interview Skills', 'Networking', 'Job Search Strategy', 'LinkedIn', 'Career Fair Prep', 'Industry Specific', 'Other')),
    attended INTEGER DEFAULT 1,
    feedback TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Resume reviews and career documents
CREATE TABLE IF NOT EXISTS career_documents (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    document_type TEXT CHECK (document_type IN ('Resume', 'Cover Letter', 'Portfolio', 'LinkedIn Profile', 'Other')),
    version_number INTEGER DEFAULT 1,
    review_date DATE,
    reviewer_notes TEXT,
    improvements_made TEXT,
    file_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Mock interviews
CREATE TABLE IF NOT EXISTS mock_interviews (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    interview_date DATE NOT NULL,
    interview_type TEXT CHECK (interview_type IN ('Behavioral', 'Technical', 'Case Study', 'Phone Screen', 'Panel', 'Informational')),
    interviewer_name TEXT,
    company_focus TEXT,
    strengths TEXT,
    areas_for_improvement TEXT,
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    resources_recommended TEXT,
    follow_up_scheduled INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Employer connections and networking
CREATE TABLE IF NOT EXISTS employer_connections (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    company_name TEXT NOT NULL,
    contact_name TEXT,
    contact_title TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    linkedin_profile TEXT,
    connection_date DATE,
    connection_type TEXT CHECK (connection_type IN ('Career Fair', 'Alumni Referral', 'Cold Outreach', 'Campus Event', 'Informational Interview', 'Other')),
    notes TEXT,
    follow_up_status TEXT,
    last_contact_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Activity log table for tracking changes
CREATE TABLE IF NOT EXISTS activity_log (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    student_id TEXT,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    details TEXT, -- JSON stored as text
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_job_search_status ON students(job_search_status);
CREATE INDEX IF NOT EXISTS idx_notes_student_id ON notes(student_id);
CREATE INDEX IF NOT EXISTS idx_consultations_student_id ON consultations(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_student_id ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_workshop_attendance_student_id ON workshop_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_career_documents_student_id ON career_documents(student_id);
CREATE INDEX IF NOT EXISTS idx_mock_interviews_student_id ON mock_interviews(student_id);
CREATE INDEX IF NOT EXISTS idx_employer_connections_student_id ON employer_connections(student_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_student_id ON activity_log(student_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);