-- Add missing columns for reporting functionality
-- Date: August 1, 2025

-- Add status column if it doesn't exist
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled';

-- Add advisor_name column if it doesn't exist  
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS advisor_name TEXT;

-- Update existing consultations to have proper status based on attended field
UPDATE consultations 
SET status = CASE 
    WHEN attended = 1 THEN 'attended'
    WHEN consultation_date < datetime('now') AND attended = 0 THEN 'no-show'
    ELSE 'scheduled'
END
WHERE status IS NULL OR status = '';

-- Create index for date range queries
CREATE INDEX IF NOT EXISTS idx_consultations_date ON consultations(consultation_date);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_notes_date ON notes(date_created);