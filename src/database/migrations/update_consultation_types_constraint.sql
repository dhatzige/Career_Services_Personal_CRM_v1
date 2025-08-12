-- Update the CHECK constraint on consultations table to include Introduction Meeting
-- SQLite doesn't support ALTER TABLE DROP/ADD CONSTRAINT, so we need to recreate the table

-- Create a new table with the updated constraint
CREATE TABLE consultations_new (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    type TEXT CHECK (type IN ('General', 'Introduction Meeting', 'Career Counseling', 'Resume Review', 'Mock Interview', 'Job Search Strategy', 'Internship Planning', 'Graduate School', 'Follow-up')),
    consultation_date DATETIME NOT NULL,
    duration INTEGER DEFAULT 30,
    attended INTEGER DEFAULT 0,
    notes TEXT,
    follow_up_required INTEGER DEFAULT 0,
    location TEXT,
    topic TEXT,
    follow_up_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'scheduled',
    status_updated_at DATETIME,
    status_updated_by TEXT,
    cancellation_reason TEXT,
    cancellation_method TEXT,
    meeting_link TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Copy data from old table to new table
INSERT INTO consultations_new 
SELECT * FROM consultations;

-- Drop the old table
DROP TABLE consultations;

-- Rename the new table to consultations
ALTER TABLE consultations_new RENAME TO consultations;

-- Recreate the indexes
CREATE INDEX idx_consultations_student_id ON consultations(student_id);
CREATE INDEX idx_consultations_date ON consultations(consultation_date);
CREATE INDEX idx_consultations_type ON consultations(type);