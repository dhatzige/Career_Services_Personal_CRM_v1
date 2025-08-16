-- Add needs_review flag to consultations table
-- This flag indicates that the consultation type needs to be manually reviewed/set
-- Primarily used for consultations created via Calendly webhook

ALTER TABLE consultations 
ADD COLUMN needs_review INTEGER DEFAULT 0;

-- Set existing consultations to not need review (they were manually created)
UPDATE consultations SET needs_review = 0 WHERE needs_review IS NULL;

-- Create an index for quickly finding consultations that need review
CREATE INDEX idx_consultations_needs_review ON consultations(needs_review) WHERE needs_review = 1;