# Supabase Migration Instructions

## Prerequisites
1. Install Playwright:
   ```bash
   npm install playwright
   # or if you haven't installed other dependencies:
   npm install
   ```

2. Install Chromium browser for Playwright:
   ```bash
   npx playwright install chromium
   ```

## Running the Migration

1. Execute the migration script:
   ```bash
   node run-supabase-migration.js
   ```

2. The script will:
   - Open a browser window
   - Navigate to your Supabase SQL editor
   - If you're not logged in, it will pause and wait for you to log in manually
   - Once logged in, press Enter in the terminal to continue
   - The script will paste the SQL migration and execute it
   - Results will be displayed in the console
   - A screenshot will be saved showing the final state

## What the Migration Does

This migration updates the `consultations` table to match the TypeScript interfaces in your code:

1. **Adds `scheduled_date` column** - migrates data from `consultation_date`
2. **Renames columns to match TypeScript interfaces:**
   - `duration` → `duration_minutes`
   - `type` → `consultation_type`
3. **Adds new columns:**
   - `status` (with values: scheduled, completed, cancelled, no-show)
   - `meeting_link`
   - `tags` (JSONB array)
4. **Updates RLS policies** for proper access control

## Manual Alternative

If you prefer to run the migration manually:

1. Go to: https://supabase.com/dashboard/project/nhzuliqmjszibcbftjtq/sql/new
2. Copy the SQL script from `run-supabase-migration.js`
3. Paste it into the SQL editor
4. Click "Run" or "Execute"
5. Check for any errors in the output

## Troubleshooting

- If the script can't find the SQL editor, try refreshing the page and running again
- If you see authentication errors, make sure you're logged into Supabase
- The script takes screenshots on both success and error for debugging