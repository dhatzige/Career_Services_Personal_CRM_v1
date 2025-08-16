# Fix Consultations Table Access Issue

## Problem Summary

The consultations table in Supabase has a column mismatch:
- **Database Schema**: Uses `consultation_date` column
- **Application Code**: Expects `scheduled_date` column

This causes the error: "column consultations.scheduled_date does not exist"

## Quick Fix Steps

### Option 1: Run the Migration Script (Recommended)

1. **Run the automated fix script:**
   ```bash
   cd backend
   node scripts/fix-consultations-table.js
   ```

2. **If the script cannot execute directly**, it will output SQL that you need to run manually in Supabase.

### Option 2: Manual Fix in Supabase SQL Editor

1. **Go to your Supabase SQL Editor:**
   - Open your Supabase dashboard
   - Navigate to SQL Editor
   - Create a new query

2. **Run this SQL to fix the table:**
   ```sql
   -- Add scheduled_date column and migrate data
   ALTER TABLE consultations ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMP WITH TIME ZONE;
   UPDATE consultations SET scheduled_date = consultation_date WHERE scheduled_date IS NULL;
   ALTER TABLE consultations ALTER COLUMN scheduled_date SET NOT NULL;

   -- Add other missing columns
   ALTER TABLE consultations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled';
   ALTER TABLE consultations ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
   ALTER TABLE consultations ADD COLUMN IF NOT EXISTS consultation_type TEXT;
   ALTER TABLE consultations ADD COLUMN IF NOT EXISTS meeting_link TEXT;
   ALTER TABLE consultations ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';

   -- Migrate existing data
   UPDATE consultations SET duration_minutes = duration WHERE duration_minutes IS NULL;
   UPDATE consultations SET consultation_type = type WHERE consultation_type IS NULL;

   -- Update status based on existing data
   UPDATE consultations 
   SET status = CASE 
       WHEN attended = true THEN 'completed'
       WHEN consultation_date < NOW() AND attended = false THEN 'no-show'
       ELSE 'scheduled'
   END
   WHERE status = 'scheduled';

   -- Create indexes for performance
   CREATE INDEX IF NOT EXISTS idx_consultations_scheduled_date ON consultations(scheduled_date);
   CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);

   -- Update RLS policies
   DROP POLICY IF EXISTS "Authenticated users can manage consultations" ON consultations;

   CREATE POLICY "Authenticated users can view consultations" ON consultations
       FOR SELECT USING (auth.role() = 'authenticated');

   CREATE POLICY "Authenticated users can create consultations" ON consultations
       FOR INSERT WITH CHECK (auth.role() = 'authenticated');

   CREATE POLICY "Authenticated users can update consultations" ON consultations
       FOR UPDATE USING (auth.role() = 'authenticated');

   CREATE POLICY "Authenticated users can delete consultations" ON consultations
       FOR DELETE USING (auth.role() = 'authenticated');
   ```

3. **Verify the fix:**
   ```sql
   -- Check if all columns exist
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'consultations'
   ORDER BY ordinal_position;
   ```

## Verification Steps

After running the fix:

1. **Test in the application:**
   - Navigate to the Dashboard
   - Check if consultations load properly
   - Try creating a new consultation

2. **Check via Supabase dashboard:**
   - Go to Table Editor
   - Select the consultations table
   - Verify all columns are present

3. **Test queries directly:**
   ```sql
   -- This should work now
   SELECT * FROM consultations 
   ORDER BY scheduled_date DESC 
   LIMIT 5;
   ```

## Column Mapping

After the fix, the consultations table will have both old and new column names:

| Old Column Name | New/Additional Column | Purpose |
|----------------|----------------------|---------|
| consultation_date | scheduled_date | Primary date field for scheduling |
| type | consultation_type | Type of consultation |
| duration | duration_minutes | Duration in minutes |
| - | status | Status (scheduled/completed/cancelled/no-show) |
| - | meeting_link | Virtual meeting link |
| - | tags | JSON array of tags |

## Troubleshooting

### If you still get errors:

1. **Check RLS policies:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'consultations';
   ```

2. **Ensure authentication is working:**
   - Check that your Supabase keys are correct in .env
   - Verify the user is authenticated

3. **Check for data type mismatches:**
   ```sql
   -- Ensure date columns are timestamp with time zone
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'consultations'
   AND column_name IN ('scheduled_date', 'consultation_date');
   ```

### Common Issues:

- **"permission denied"**: RLS policies need to be updated
- **"column does not exist"**: Migration didn't run completely
- **Type mismatch errors**: Data types don't match TypeScript interfaces

## Long-term Solution

Consider updating the codebase to use consistent column names:

1. **Option A**: Update all code to use `consultation_date` (original schema)
2. **Option B**: Keep `scheduled_date` as the primary field (current fix)

The current fix (Option B) maintains backward compatibility while supporting the existing code.

## Related Files

- Migration SQL: `/backend/src/database/fix-consultations-column.sql`
- Fix Script: `/backend/scripts/fix-consultations-table.js`
- Original Schema: `/backend/src/database/supabase-migration.sql`
- TypeScript Types: `/backend/src/database/supabase.ts`