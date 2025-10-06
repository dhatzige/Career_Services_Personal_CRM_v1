-- Performance indexes for Career Services CRM
-- Date: August 2025
-- Purpose: Optimize common queries for better performance

-- Students table indexes
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON students(created_at);
CREATE INDEX IF NOT EXISTS idx_students_last_interaction ON students(last_interaction);
CREATE INDEX IF NOT EXISTS idx_students_no_show_count ON students(no_show_count);
CREATE INDEX IF NOT EXISTS idx_students_status_created ON students(status, created_at);

-- Consultations table indexes
CREATE INDEX IF NOT EXISTS idx_consultations_student_id ON consultations(student_id);
CREATE INDEX IF NOT EXISTS idx_consultations_date ON consultations(date);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_type ON consultations(type);
CREATE INDEX IF NOT EXISTS idx_consultations_advisor ON consultations(advisor_name);
CREATE INDEX IF NOT EXISTS idx_consultations_date_status ON consultations(date, status);
CREATE INDEX IF NOT EXISTS idx_consultations_student_date ON consultations(student_id, date);

-- Notes table indexes
CREATE INDEX IF NOT EXISTS idx_notes_student_id ON notes(student_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);
CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(type);
CREATE INDEX IF NOT EXISTS idx_notes_is_private ON notes(is_private);
CREATE INDEX IF NOT EXISTS idx_notes_student_created ON notes(student_id, created_at);

-- Applications table indexes (for career tracking)
CREATE INDEX IF NOT EXISTS idx_applications_student_id ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_date_applied ON applications(date_applied);
CREATE INDEX IF NOT EXISTS idx_applications_student_status ON applications(student_id, status);

-- Workshop attendance indexes
CREATE INDEX IF NOT EXISTS idx_workshop_attendance_student ON workshop_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_workshop_attendance_workshop ON workshop_attendance(workshop_id);
CREATE INDEX IF NOT EXISTS idx_workshop_attendance_date ON workshop_attendance(attendance_date);

-- Mock interviews indexes
CREATE INDEX IF NOT EXISTS idx_mock_interviews_student ON mock_interviews(student_id);
CREATE INDEX IF NOT EXISTS idx_mock_interviews_date ON mock_interviews(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_mock_interviews_status ON mock_interviews(status);

-- Compound indexes for complex queries
-- For dashboard stats
CREATE INDEX IF NOT EXISTS idx_consultations_date_attended ON consultations(date, attended);
CREATE INDEX IF NOT EXISTS idx_students_status_no_show ON students(status, no_show_count) WHERE status = 'Active';

-- For reports
CREATE INDEX IF NOT EXISTS idx_consultations_advisor_date ON consultations(advisor_name, date) WHERE advisor_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notes_created_private ON notes(created_at, is_private) WHERE is_private = false;

-- Full-text search indexes (if using SQLite FTS)
-- Note: These require FTS5 extension to be enabled
-- CREATE VIRTUAL TABLE IF NOT EXISTS students_fts USING fts5(
--   first_name, last_name, email, specific_program, 
--   content='students', content_rowid='id'
-- );
-- 
-- CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
--   content, tags,
--   content='notes', content_rowid='id'
-- );

-- Analyze tables to update query optimizer statistics
ANALYZE students;
ANALYZE consultations;
ANALYZE notes;
ANALYZE applications;
ANALYZE workshop_attendance;
ANALYZE mock_interviews;