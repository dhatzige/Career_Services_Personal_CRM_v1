-- Safe Supabase Migration: Add Status and Tags System
-- This script checks for existing columns/tables before creating them

-- Step 1: Safely add columns to consultations table
DO $$ 
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'consultations' AND column_name = 'status') THEN
        ALTER TABLE consultations ADD COLUMN status VARCHAR(20) DEFAULT 'scheduled';
    END IF;
    
    -- Add status_updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'consultations' AND column_name = 'status_updated_at') THEN
        ALTER TABLE consultations ADD COLUMN status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add status_updated_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'consultations' AND column_name = 'status_updated_by') THEN
        ALTER TABLE consultations ADD COLUMN status_updated_by UUID;
    END IF;
    
    -- Add cancellation_reason column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'consultations' AND column_name = 'cancellation_reason') THEN
        ALTER TABLE consultations ADD COLUMN cancellation_reason TEXT;
    END IF;
    
    -- Add cancellation_method column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'consultations' AND column_name = 'cancellation_method') THEN
        ALTER TABLE consultations ADD COLUMN cancellation_method VARCHAR(20);
    END IF;
    
    -- Add meeting_link column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'consultations' AND column_name = 'meeting_link') THEN
        ALTER TABLE consultations ADD COLUMN meeting_link TEXT;
    END IF;
END $$;

-- Step 2: Create tags table if it doesn't exist
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(20) NOT NULL,
  category VARCHAR(20) CHECK (category IN ('outcome', 'topic', 'action', 'priority', 'general')),
  icon VARCHAR(10),
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

-- Step 3: Create junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS consultation_tags (
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_by UUID,
  PRIMARY KEY (consultation_id, tag_id)
);

-- Step 4: Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_date_status ON consultations(consultation_date, status);
CREATE INDEX IF NOT EXISTS idx_consultation_tags_consultation ON consultation_tags(consultation_id);
CREATE INDEX IF NOT EXISTS idx_consultation_tags_tag ON consultation_tags(tag_id);

-- Step 5: Insert default tags (with conflict handling)
INSERT INTO tags (name, color, category, icon) VALUES 
-- Status-related tags
('Email Cancel', 'red', 'action', '📧'),
('Phone Cancel', 'red', 'action', '📞'),
('Needs Follow-up', 'yellow', 'action', '🔔'),
('Follow-up Complete', 'green', 'action', '✅'),

-- Meeting type tags
('First Meeting', 'blue', 'general', '🆕'),
('Final Meeting', 'purple', 'general', '🎓'),
('Emergency Meeting', 'red', 'priority', '🚨'),

-- Topic tags
('Resume Review', 'blue', 'topic', '📝'),
('Interview Prep', 'purple', 'topic', '🎤'),
('Job Search', 'orange', 'topic', '💼'),
('Career Planning', 'green', 'topic', '🎯'),
('Grad School', 'purple', 'topic', '🎓'),
('Internship', 'yellow', 'topic', '🏢'),

-- Outcome tags
('Great Progress', 'green', 'outcome', '🌟'),
('Action Plan Created', 'green', 'outcome', '📋'),
('Resources Provided', 'blue', 'outcome', '📚'),
('Referral Made', 'blue', 'outcome', '🤝'),
('At Risk', 'red', 'outcome', '⚠️'),
('On Track', 'green', 'outcome', '✅')
ON CONFLICT (name) DO NOTHING;

-- Step 6: Update existing consultations to have default status
UPDATE consultations 
SET status = CASE 
    WHEN attended = true THEN 'attended'
    WHEN attended = false AND consultation_date < NOW() THEN 'no-show'
    WHEN consultation_date >= NOW() THEN 'scheduled'
    ELSE 'scheduled'
END
WHERE status IS NULL;

-- Step 7: Create or replace view for consultation details
CREATE OR REPLACE VIEW consultation_details AS
SELECT 
  c.*,
  s.first_name,
  s.last_name,
  s.email,
  COALESCE(
    json_agg(
      json_build_object(
        'id', t.id,
        'name', t.name,
        'color', t.color,
        'category', t.category,
        'icon', t.icon
      ) ORDER BY t.name
    ) FILTER (WHERE t.id IS NOT NULL), 
    '[]'::json
  ) as tags
FROM consultations c
LEFT JOIN students s ON c.student_id = s.id
LEFT JOIN consultation_tags ct ON c.id = ct.consultation_id
LEFT JOIN tags t ON ct.tag_id = t.id
GROUP BY c.id, s.id;

-- Step 8: Grant necessary permissions
GRANT SELECT ON consultation_details TO authenticated;
GRANT ALL ON tags TO authenticated;
GRANT ALL ON consultation_tags TO authenticated;

-- Verification query to check if migration was successful
SELECT 
    'Migration completed successfully!' as status,
    (SELECT COUNT(*) FROM tags) as total_tags_created,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = 'consultations' 
     AND column_name IN ('status', 'meeting_link', 'cancellation_reason')) as new_columns_added;