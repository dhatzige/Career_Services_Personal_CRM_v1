-- Personal CRM Database Schema
-- PostgreSQL database schema for the Personal CRM application

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL,
    is_configured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Students table with career services fields
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    year_of_study VARCHAR(20) CHECK (year_of_study IN ('1st year', '2nd year', '3rd year', '4th year', 'Graduate', 'Alumni')),
    program_type VARCHAR(20) CHECK (program_type IN ('Bachelor''s', 'Master''s', 'PhD')),
    specific_program VARCHAR(200),
    major VARCHAR(200),
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Graduated')),
    date_added TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_interaction TIMESTAMP WITH TIME ZONE,
    academic_start_date DATE,
    expected_graduation DATE,
    avatar TEXT,
    tags TEXT[],
    -- Career services specific fields
    career_interests TEXT[],
    linkedin_url VARCHAR(255),
    resume_on_file BOOLEAN DEFAULT FALSE,
    resume_last_updated DATE,
    job_search_status VARCHAR(50) CHECK (job_search_status IN ('Not Started', 'Preparing', 'Actively Searching', 'Interviewing', 'Offer Received', 'Employed', 'Not Seeking')),
    target_industries TEXT[],
    target_locations TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type VARCHAR(20) CHECK (type IN ('General', 'Academic', 'Personal', 'Follow-up', 'Alert')),
    date_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_private BOOLEAN DEFAULT FALSE,
    student_year_at_time VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Consultations table
CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    type VARCHAR(50) CHECK (type IN (
        'Initial Consultation', 'Academic Planning', 'Career Guidance', 
        'Personal Development', 'Crisis Support', 'Goal Setting', 
        'Progress Review', 'Graduation Planning', 'Internship Guidance', 
        'Course Selection', 'Study Skills', 'Time Management', 
        'Stress Management', 'Other'
    )),
    consultation_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    attended BOOLEAN DEFAULT FALSE,
    notes TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    student_year_at_time VARCHAR(20),
    location VARCHAR(200),
    meeting_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Follow-up reminders table
CREATE TABLE IF NOT EXISTS follow_up_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(10) CHECK (priority IN ('Low', 'Medium', 'High')),
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Activity log table for tracking changes
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    student_id UUID REFERENCES students(id),
    action VARCHAR(50) NOT NULL,
    entity VARCHAR(20) NOT NULL,
    entity_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Career Services specific tables

-- Internships and job applications tracking
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    type VARCHAR(20) CHECK (type IN ('Internship', 'Full-time', 'Part-time', 'Co-op', 'Fellowship')),
    company_name VARCHAR(200) NOT NULL,
    position_title VARCHAR(200) NOT NULL,
    application_date DATE NOT NULL,
    status VARCHAR(50) CHECK (status IN ('Planning', 'Applied', 'Phone Screen', 'Interview Scheduled', 'Interviewed', 'Offer', 'Rejected', 'Accepted', 'Declined')),
    application_method VARCHAR(100),
    contact_name VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    location VARCHAR(200),
    salary_range VARCHAR(50),
    notes TEXT,
    follow_up_date DATE,
    response_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Career workshops and events attendance
CREATE TABLE IF NOT EXISTS workshop_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    workshop_name VARCHAR(200) NOT NULL,
    workshop_date DATE NOT NULL,
    workshop_type VARCHAR(50) CHECK (workshop_type IN ('Resume Writing', 'Interview Skills', 'Networking', 'Job Search Strategy', 'LinkedIn', 'Career Fair Prep', 'Industry Specific', 'Other')),
    attended BOOLEAN DEFAULT TRUE,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Resume reviews and career documents
CREATE TABLE IF NOT EXISTS career_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    document_type VARCHAR(50) CHECK (document_type IN ('Resume', 'Cover Letter', 'Portfolio', 'LinkedIn Profile', 'Other')),
    version_number INTEGER DEFAULT 1,
    review_date DATE,
    reviewer_notes TEXT,
    improvements_made TEXT,
    file_reference VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Mock interviews
CREATE TABLE IF NOT EXISTS mock_interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    interview_date DATE NOT NULL,
    interview_type VARCHAR(50) CHECK (interview_type IN ('Behavioral', 'Technical', 'Case Study', 'Phone Screen', 'Panel', 'Informational')),
    interviewer_name VARCHAR(100),
    company_focus VARCHAR(200),
    strengths TEXT,
    areas_for_improvement TEXT,
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    resources_recommended TEXT,
    follow_up_scheduled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Employer connections and networking
CREATE TABLE IF NOT EXISTS employer_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    company_name VARCHAR(200) NOT NULL,
    contact_name VARCHAR(100),
    contact_title VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    linkedin_profile VARCHAR(255),
    connection_date DATE,
    connection_type VARCHAR(50) CHECK (connection_type IN ('Career Fair', 'Alumni Referral', 'Cold Outreach', 'Campus Event', 'Informational Interview', 'Other')),
    notes TEXT,
    follow_up_status VARCHAR(50),
    last_contact_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_program_type ON students(program_type);
CREATE INDEX IF NOT EXISTS idx_students_year_of_study ON students(year_of_study);
CREATE INDEX IF NOT EXISTS idx_students_date_added ON students(date_added);
CREATE INDEX IF NOT EXISTS idx_students_last_interaction ON students(last_interaction);

CREATE INDEX IF NOT EXISTS idx_notes_student_id ON notes(student_id);
CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(type);
CREATE INDEX IF NOT EXISTS idx_notes_date_created ON notes(date_created);

CREATE INDEX IF NOT EXISTS idx_consultations_student_id ON consultations(student_id);
CREATE INDEX IF NOT EXISTS idx_consultations_type ON consultations(type);
CREATE INDEX IF NOT EXISTS idx_consultations_date ON consultations(consultation_date);
CREATE INDEX IF NOT EXISTS idx_consultations_attended ON consultations(attended);

CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_student_id ON follow_up_reminders(student_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_date ON follow_up_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_completed ON follow_up_reminders(completed);

CREATE INDEX IF NOT EXISTS idx_activity_log_student_id ON activity_log(student_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);

-- Career services specific indexes
CREATE INDEX IF NOT EXISTS idx_applications_student_id ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_type ON applications(type);
CREATE INDEX IF NOT EXISTS idx_applications_application_date ON applications(application_date);

CREATE INDEX IF NOT EXISTS idx_workshop_attendance_student_id ON workshop_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_workshop_attendance_date ON workshop_attendance(workshop_date);

CREATE INDEX IF NOT EXISTS idx_career_documents_student_id ON career_documents(student_id);
CREATE INDEX IF NOT EXISTS idx_career_documents_type ON career_documents(document_type);

CREATE INDEX IF NOT EXISTS idx_mock_interviews_student_id ON mock_interviews(student_id);
CREATE INDEX IF NOT EXISTS idx_mock_interviews_date ON mock_interviews(interview_date);

CREATE INDEX IF NOT EXISTS idx_employer_connections_student_id ON employer_connections(student_id);
CREATE INDEX IF NOT EXISTS idx_employer_connections_company ON employer_connections(company_name);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_follow_up_reminders_updated_at BEFORE UPDATE ON follow_up_reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically update student's last_interaction
CREATE OR REPLACE FUNCTION update_student_last_interaction()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE students 
    SET last_interaction = CURRENT_TIMESTAMP 
    WHERE id = NEW.student_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to update last_interaction when notes or consultations are added
CREATE TRIGGER update_last_interaction_on_note AFTER INSERT ON notes
    FOR EACH ROW EXECUTE FUNCTION update_student_last_interaction();

CREATE TRIGGER update_last_interaction_on_consultation AFTER INSERT ON consultations
    FOR EACH ROW EXECUTE FUNCTION update_student_last_interaction(); 