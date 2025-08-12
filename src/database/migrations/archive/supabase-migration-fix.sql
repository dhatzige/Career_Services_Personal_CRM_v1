-- Migration script to fix Supabase schema mismatches
-- Run this in your Supabase SQL Editor

-- 1. Rename expected_graduation to expected_graduation_date
ALTER TABLE public.students 
RENAME COLUMN expected_graduation TO expected_graduation_date;

-- 2. Update the addStudentToSupabase function mapping to handle expected_graduation_date
-- The application code needs to be updated to map this field correctly

-- 3. Ensure all required indexes exist (they seem to already exist based on the definition)

-- 4. Add a comment to clarify the mapping
COMMENT ON COLUMN public.students.created_at IS 'Maps to dateAdded in the frontend application';

-- Optional: If you want to remove the redundant date_added column (since created_at serves the same purpose)
-- ALTER TABLE public.students DROP COLUMN date_added;

-- Note: The application code in supabaseStudents.ts already correctly maps:
-- - created_at -> dateAdded
-- - All snake_case columns to camelCase properties