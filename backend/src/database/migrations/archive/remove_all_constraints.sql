-- Remove ALL constraints from Supabase to make it flexible
-- This script removes CHECK constraints, making the database accept any values

-- Drop CHECK constraints from students table
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_year_of_study_check;
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_status_check;

-- Drop CHECK constraints from notes table  
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_type_check;

-- Drop CHECK constraints from consultations table
ALTER TABLE consultations DROP CONSTRAINT IF EXISTS consultations_type_check;
ALTER TABLE consultations DROP CONSTRAINT IF EXISTS consultations_status_check;
ALTER TABLE consultations DROP CONSTRAINT IF EXISTS consultations_attendance_status_check;

-- Drop CHECK constraints from users table
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Drop CHECK constraints from career-related tables
ALTER TABLE mock_interviews DROP CONSTRAINT IF EXISTS mock_interviews_status_check;
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE career_documents DROP CONSTRAINT IF EXISTS career_documents_type_check;
ALTER TABLE workshops DROP CONSTRAINT IF EXISTS workshops_status_check;

-- Drop any other CHECK constraints that might exist
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Find and drop all CHECK constraints
    FOR r IN (
        SELECT n.nspname as schema_name,
               c.relname as table_name, 
               con.conname as constraint_name
        FROM pg_constraint con
        INNER JOIN pg_class c ON c.oid = con.conrelid
        INNER JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE con.contype = 'c'  -- CHECK constraints
        AND n.nspname = 'public'  -- Only public schema
    )
    LOOP
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I',
                      r.schema_name, r.table_name, r.constraint_name);
        RAISE NOTICE 'Dropped constraint % from table %.%', 
                     r.constraint_name, r.schema_name, r.table_name;
    END LOOP;
END $$;

-- Make columns more flexible by changing to TEXT where appropriate
-- This allows any string value without length restrictions

-- Update students table columns
ALTER TABLE students 
    ALTER COLUMN year_of_study TYPE TEXT,
    ALTER COLUMN status TYPE TEXT;

-- Update notes table columns  
ALTER TABLE notes 
    ALTER COLUMN type TYPE TEXT;

-- Update consultations table columns
ALTER TABLE consultations 
    ALTER COLUMN type TYPE TEXT,
    ALTER COLUMN status TYPE TEXT,
    ALTER COLUMN attendance_status TYPE TEXT;

-- Update users table columns
ALTER TABLE users 
    ALTER COLUMN role TYPE TEXT;

-- Update career-related table columns
ALTER TABLE mock_interviews 
    ALTER COLUMN status TYPE TEXT;

ALTER TABLE applications 
    ALTER COLUMN status TYPE TEXT;

ALTER TABLE career_documents 
    ALTER COLUMN type TYPE TEXT;

ALTER TABLE workshops 
    ALTER COLUMN status TYPE TEXT;

-- Add helpful comment
COMMENT ON DATABASE postgres IS 'All constraints removed for maximum flexibility';

-- Verify constraints have been removed
SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    con.conname as constraint_name,
    pg_get_constraintdef(con.oid) as constraint_definition
FROM pg_constraint con
INNER JOIN pg_class c ON c.oid = con.conrelid
INNER JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE con.contype = 'c'  -- CHECK constraints
AND n.nspname = 'public'
ORDER BY n.nspname, c.relname;