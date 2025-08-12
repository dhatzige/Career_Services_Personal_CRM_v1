-- Add Calendly integration fields to consultations table
ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS calendly_event_uri VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS calendly_invitee_uri VARCHAR(255),
ADD COLUMN IF NOT EXISTS advisor_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show'));

-- Create index for Calendly lookups
CREATE INDEX IF NOT EXISTS idx_consultations_calendly_uri ON consultations(calendly_event_uri);
CREATE INDEX IF NOT EXISTS idx_consultations_advisor_id ON consultations(advisor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);

-- Update existing consultations to have a status based on attended field
UPDATE consultations 
SET status = CASE 
    WHEN attended = true THEN 'completed'
    WHEN attended = false AND consultation_date < CURRENT_TIMESTAMP THEN 'no_show'
    WHEN consultation_date > CURRENT_TIMESTAMP THEN 'scheduled'
    ELSE 'scheduled'
END
WHERE status IS NULL;