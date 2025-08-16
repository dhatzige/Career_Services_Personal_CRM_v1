-- Add missing note types to the notes table
ALTER TABLE notes 
DROP CONSTRAINT IF EXISTS notes_type_check;

ALTER TABLE notes 
ADD CONSTRAINT notes_type_check 
CHECK (type IN ('General', 'Academic', 'Personal', 'Follow-up', 'Alert', 'Career Planning', 'Interview Prep'));

-- Add tags column if it doesn't exist
ALTER TABLE notes 
ADD COLUMN IF NOT EXISTS tags TEXT DEFAULT '[]';