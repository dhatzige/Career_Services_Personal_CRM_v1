-- Supabase Migration Script for Career Services CRM
-- This script migrates the schema from SQLite to PostgreSQL/Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS follow_up_reminders CASCADE;
DROP TABLE IF EXISTS consultations CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS mock_interviews CASCADE;
DROP TABLE IF EXISTS employer_connections CASCADE;
DROP TABLE IF EXISTS career_documents CASCADE;
DROP TABLE IF EXISTS workshop_attendance CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table with Supabase auth integration
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supabase_id UUID UNIQUE, -- Links to auth.users
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT, -- For legacy users
    salt TEXT, -- For legacy users
    is_configured BOOLEAN DEFAULT false,
    migration_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students table with career services fields
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    year_of_study TEXT CHECK (year_of_study IN ('1st year', '2nd year', '3rd year', '4th year', 'Graduate', 'Alumni')),
    program_type TEXT CHECK (program_type IN ('Bachelor''s', 'Master''s', 'PhD')),
    specific_program TEXT,
    major TEXT,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Graduated')),
    date_added TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_interaction TIMESTAMP WITH TIME ZONE,
    academic_start_date DATE,
    expected_graduation DATE,
    avatar TEXT,
    tags JSONB DEFAULT '[]',
    -- Career services specific fields
    career_interests JSONB DEFAULT '[]',
    linkedin_url TEXT,
    resume_on_file BOOLEAN DEFAULT false,
    resume_last_updated DATE,
    job_search_status TEXT CHECK (job_search_status IN ('Not Started', 'Preparing', 'Actively Searching', 'Interviewing', 'Offer Received', 'Employed', 'Not Seeking')),
    target_industries JSONB DEFAULT '[]',
    target_locations JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notes table
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type TEXT CHECK (type IN ('General', 'Academic', 'Personal', 'Follow-up', 'Alert', 'Career Planning', 'Interview Prep')),
    date_created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_private BOOLEAN DEFAULT false,
    student_year_at_time TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consultations table
CREATE TABLE consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    consultation_date TIMESTAMP WITH TIME ZONE NOT NULL,
    type TEXT CHECK (type IN ('Career Counseling', 'Resume Review', 'Mock Interview', 'Job Search Strategy', 'Internship Planning', 'Graduate School', 'General', 'Follow-up')),
    topic TEXT,
    notes TEXT,
    duration INTEGER,
    location TEXT,
    attended BOOLEAN DEFAULT true,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Follow-up reminders table
CREATE TABLE follow_up_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
    reminder_date DATE NOT NULL,
    description TEXT NOT NULL,
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
    completed BOOLEAN DEFAULT false,
    completed_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job applications tracking
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
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
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workshop attendance
CREATE TABLE workshop_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    workshop_name TEXT NOT NULL,
    workshop_date DATE NOT NULL,
    workshop_type TEXT CHECK (workshop_type IN ('Resume Writing', 'Interview Skills', 'Networking', 'Job Search Strategy', 'LinkedIn', 'Career Fair Prep', 'Industry Specific', 'Other')),
    attended BOOLEAN DEFAULT true,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Career documents
CREATE TABLE career_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    document_type TEXT CHECK (document_type IN ('Resume', 'Cover Letter', 'Portfolio', 'LinkedIn Profile', 'Other')),
    version_number INTEGER DEFAULT 1,
    review_date DATE,
    reviewer_notes TEXT,
    improvements_made TEXT,
    file_path TEXT,
    file_url TEXT, -- For cloud storage
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mock interviews
CREATE TABLE mock_interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    interview_date DATE NOT NULL,
    interview_type TEXT,
    interviewer_name TEXT,
    company_simulated TEXT,
    position_simulated TEXT,
    strengths TEXT,
    areas_for_improvement TEXT,
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    additional_notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employer connections
CREATE TABLE employer_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    contact_name TEXT,
    contact_title TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    connection_date DATE,
    connection_type TEXT CHECK (connection_type IN ('Career Fair', 'Networking Event', 'Alumni Connection', 'Cold Outreach', 'Referral', 'Other')),
    notes TEXT,
    follow_up_status TEXT,
    last_contact_date DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logs for audit trail
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    student_id UUID REFERENCES students(id),
    activity_type TEXT NOT NULL,
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_program ON students(program_type);
CREATE INDEX idx_students_year ON students(year_of_study);
CREATE INDEX idx_students_job_search ON students(job_search_status);
CREATE INDEX idx_students_last_interaction ON students(last_interaction);

CREATE INDEX idx_notes_student_id ON notes(student_id);
CREATE INDEX idx_notes_type ON notes(type);
CREATE INDEX idx_notes_created ON notes(created_at);
CREATE INDEX idx_notes_private ON notes(is_private);

CREATE INDEX idx_consultations_student_id ON consultations(student_id);
CREATE INDEX idx_consultations_date ON consultations(consultation_date);
CREATE INDEX idx_consultations_type ON consultations(type);

CREATE INDEX idx_applications_student_id ON applications(student_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_date ON applications(application_date);

CREATE INDEX idx_follow_up_student_id ON follow_up_reminders(student_id);
CREATE INDEX idx_follow_up_date ON follow_up_reminders(reminder_date);
CREATE INDEX idx_follow_up_completed ON follow_up_reminders(completed);

CREATE INDEX idx_activity_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_student_id ON activity_logs(student_id);
CREATE INDEX idx_activity_timestamp ON activity_logs(timestamp);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Students: All authenticated users can view and modify
CREATE POLICY "Authenticated users can view students" ON students
    FOR ALL USING (auth.role() = 'authenticated');

-- Notes: View non-private notes, private notes only by creator
CREATE POLICY "View notes policy" ON notes
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        (is_private = false OR created_by = auth.uid()::uuid)
    );

CREATE POLICY "Create notes policy" ON notes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Update notes policy" ON notes
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        (created_by = auth.uid()::uuid OR is_private = false)
    );

-- Similar policies for other tables
CREATE POLICY "Authenticated users can manage consultations" ON consultations
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage applications" ON applications
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage reminders" ON follow_up_reminders
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage workshops" ON workshop_attendance
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage documents" ON career_documents
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage interviews" ON mock_interviews
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage connections" ON employer_connections
    FOR ALL USING (auth.role() = 'authenticated');

-- Activity logs: Insert only, view own logs
CREATE POLICY "Insert activity logs" ON activity_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "View own activity logs" ON activity_logs
    FOR SELECT USING (user_id = auth.uid()::uuid);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_follow_up_reminders_updated_at BEFORE UPDATE ON follow_up_reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_career_documents_updated_at BEFORE UPDATE ON career_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mock_interviews_updated_at BEFORE UPDATE ON mock_interviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employer_connections_updated_at BEFORE UPDATE ON employer_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();