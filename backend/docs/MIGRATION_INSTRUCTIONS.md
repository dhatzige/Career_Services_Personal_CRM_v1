# Supabase Migration Instructions

The migration script has been prepared to update your `consultations` table to match the TypeScript interfaces in your code. Since automated execution requires Supabase dashboard credentials, here are your options:

## Option 1: Manual Execution (Recommended)

1. **Navigate to your Supabase SQL Editor:**
   ```
   https://supabase.com/dashboard/project/nhzuliqmjszibcbftjtq/sql/new
   ```

2. **Copy the migration SQL from:**
   - File: `supabase-migration.sql` in this directory
   - Or use the SQL below

3. **Paste and execute the SQL in the Supabase SQL editor**

4. **Verify the migration** by checking that the query runs without errors

## Option 2: Semi-Automated with Browser

1. **Install dependencies:**
   ```bash
   npm install playwright
   npx playwright install chromium
   ```

2. **Run the interactive migration script:**
   ```bash
   node run-supabase-migration-interactive.js
   ```

3. **Enter your Supabase login credentials when prompted**

4. **Follow the on-screen instructions**

## What This Migration Does

The migration updates your `consultations` table to align with your TypeScript code:

### Column Changes:
- ✅ Adds `scheduled_date` column (copies data from `consultation_date`)
- ✅ Renames `duration` → `duration_minutes`
- ✅ Renames `type` → `consultation_type`
- ✅ Adds `status` column with values: scheduled, completed, cancelled, no-show
- ✅ Adds `meeting_link` column for video call links
- ✅ Adds `tags` column (JSONB array) for categorization

### Database Features:
- ✅ Creates index on `scheduled_date` for performance
- ✅ Adds check constraint on `status` values
- ✅ Updates RLS policies for proper access control
- ✅ Maintains backward compatibility with `consultation_date`

## The Migration SQL

```sql
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
```

## Post-Migration Verification

After running the migration, verify it worked by:

1. Checking for any error messages in the SQL editor
2. Running a test query:
   ```sql
   SELECT 
     id, 
     scheduled_date, 
     consultation_type, 
     duration_minutes, 
     status, 
     meeting_link, 
     tags 
   FROM consultations 
   LIMIT 1;
   ```

3. If successful, all columns should be present without errors

## Troubleshooting

- **If columns already exist:** The migration is idempotent and will skip existing columns
- **If you see permission errors:** Make sure you're logged in with an admin account
- **If the migration partially completes:** You can run it again safely