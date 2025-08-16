-- Supabase Migration: Add Status and Tags System
-- Run this in your Supabase SQL Editor

-- Step 1: Add status field to consultations table
ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'scheduled',
ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS status_updated_by UUID,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancellation_method VARCHAR(20),
ADD COLUMN IF NOT EXISTS meeting_link TEXT;

-- Step 2: Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(20) NOT NULL,
  category VARCHAR(20) CHECK (category IN ('outcome', 'topic', 'action', 'priority', 'general')),
  icon VARCHAR(10),
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  CONSTRAINT valid_color CHECK (color IN ('red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'gray'))
);

-- Step 3: Create junction table for consultation tags
CREATE TABLE IF NOT EXISTS consultation_tags (
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_by UUID,
  PRIMARY KEY (consultation_id, tag_id)
);

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_date_status ON consultations(consultation_date, status);
CREATE INDEX IF NOT EXISTS idx_consultation_tags_consultation ON consultation_tags(consultation_id);
CREATE INDEX IF NOT EXISTS idx_consultation_tags_tag ON consultation_tags(tag_id);

-- Step 5: Insert default tags
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

-- Step 6: Create views for easier querying
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

-- Step 7: Create function to update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tags SET usage_count = usage_count - 1 WHERE id = OLD.tag_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger for tag usage count
CREATE TRIGGER update_tag_usage_count_trigger
AFTER INSERT OR DELETE ON consultation_tags
FOR EACH ROW
EXECUTE FUNCTION update_tag_usage_count();

-- Step 9: Create function to get today's consultations with full details
CREATE OR REPLACE FUNCTION get_todays_consultations()
RETURNS TABLE (
  id UUID,
  student_id UUID,
  student_name TEXT,
  student_email TEXT,
  consultation_date TIMESTAMP WITH TIME ZONE,
  consultation_type VARCHAR(100),
  duration INTEGER,
  location VARCHAR(255),
  status VARCHAR(20),
  meeting_link TEXT,
  notes TEXT,
  tags JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.student_id,
    s.first_name || ' ' || s.last_name as student_name,
    s.email as student_email,
    c.consultation_date,
    c.consultation_type,
    c.duration,
    c.location,
    c.status,
    c.meeting_link,
    c.notes,
    COALESCE(
      json_agg(
        json_build_object(
          'id', t.id,
          'name', t.name,
          'color', t.color,
          'icon', t.icon
        ) ORDER BY t.name
      ) FILTER (WHERE t.id IS NOT NULL), 
      '[]'::json
    ) as tags
  FROM consultations c
  JOIN students s ON c.student_id = s.id
  LEFT JOIN consultation_tags ct ON c.id = ct.consultation_id
  LEFT JOIN tags t ON ct.tag_id = t.id
  WHERE DATE(c.consultation_date) = CURRENT_DATE
  GROUP BY c.id, s.id
  ORDER BY c.consultation_date;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Add RLS policies for new tables
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_tags ENABLE ROW LEVEL SECURITY;

-- Tags are readable by all authenticated users
CREATE POLICY "Tags are viewable by authenticated users" ON tags
  FOR SELECT TO authenticated
  USING (true);

-- Only admins can create/update tags
CREATE POLICY "Only admins can manage tags" ON tags
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Users can tag their own consultations
CREATE POLICY "Users can tag consultations" ON consultation_tags
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Step 11: Create quick status update function
CREATE OR REPLACE FUNCTION update_consultation_status(
  p_consultation_id UUID,
  p_status VARCHAR(20),
  p_cancellation_reason TEXT DEFAULT NULL,
  p_cancellation_method VARCHAR(20) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE consultations
  SET 
    status = p_status,
    status_updated_at = NOW(),
    status_updated_by = auth.uid(),
    cancellation_reason = CASE 
      WHEN p_status IN ('cancelled', 'no-show') THEN p_cancellation_reason 
      ELSE NULL 
    END,
    cancellation_method = CASE 
      WHEN p_status = 'cancelled' THEN p_cancellation_method 
      ELSE NULL 
    END,
    attended = CASE 
      WHEN p_status = 'attended' THEN true
      WHEN p_status IN ('no-show', 'cancelled') THEN false
      ELSE attended
    END
  WHERE id = p_consultation_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION get_todays_consultations() TO authenticated;
GRANT EXECUTE ON FUNCTION update_consultation_status(UUID, VARCHAR, TEXT, VARCHAR) TO authenticated;