-- Fix consultations table to match the code expectations
-- This script adds the scheduled_date column and migrates data from consultation_date

-- First, check if scheduled_date column already exists
DO $$ 
BEGIN
    -- Add scheduled_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'consultations' 
        AND column_name = 'scheduled_date'
    ) THEN
        ALTER TABLE consultations ADD COLUMN scheduled_date TIMESTAMP WITH TIME ZONE;
        
        -- Copy data from consultation_date to scheduled_date
        UPDATE consultations SET scheduled_date = consultation_date;
        
        -- Make scheduled_date NOT NULL after populating data
        ALTER TABLE consultations ALTER COLUMN scheduled_date SET NOT NULL;
        
        -- Create index on scheduled_date for better query performance
        CREATE INDEX idx_consultations_scheduled_date ON consultations(scheduled_date);
    END IF;
    
    -- Also add missing columns that the TypeScript interfaces expect
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'consultations' 
        AND column_name = 'duration_minutes'
    ) THEN
        -- Rename duration to duration_minutes to match TypeScript interface
        ALTER TABLE consultations RENAME COLUMN duration TO duration_minutes;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'consultations' 
        AND column_name = 'consultation_type'
    ) THEN
        -- Rename type to consultation_type to match TypeScript interface
        ALTER TABLE consultations RENAME COLUMN type TO consultation_type;
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'consultations' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE consultations ADD COLUMN status TEXT DEFAULT 'scheduled';
        
        -- Update status based on attendance and date
        UPDATE consultations 
        SET status = CASE 
            WHEN attended = true THEN 'completed'
            WHEN consultation_date < NOW() AND attended = false THEN 'no-show'
            ELSE 'scheduled'
        END;
        
        -- Add check constraint for status values
        ALTER TABLE consultations ADD CONSTRAINT consultations_status_check 
        CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no-show'));
    END IF;
    
    -- Add meeting_link column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'consultations' 
        AND column_name = 'meeting_link'
    ) THEN
        ALTER TABLE consultations ADD COLUMN meeting_link TEXT;
    END IF;
    
    -- Add tags column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'consultations' 
        AND column_name = 'tags'
    ) THEN
        ALTER TABLE consultations ADD COLUMN tags JSONB DEFAULT '[]';
    END IF;
END $$;

-- Update RLS policies to ensure they work with the new schema
DROP POLICY IF EXISTS "Authenticated users can manage consultations" ON consultations;

CREATE POLICY "Authenticated users can view consultations" ON consultations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create consultations" ON consultations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update consultations" ON consultations
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete consultations" ON consultations
    FOR DELETE USING (auth.role() = 'authenticated');

-- Add comment to document the schema change
COMMENT ON COLUMN consultations.scheduled_date IS 'Primary date field for consultation scheduling - migrated from consultation_date';
COMMENT ON COLUMN consultations.consultation_date IS 'Legacy date field - kept for backward compatibility';