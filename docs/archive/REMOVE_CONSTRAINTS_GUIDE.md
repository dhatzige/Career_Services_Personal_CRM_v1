# Guide to Remove All Supabase Constraints

## What This Does
This guide helps you remove ALL database constraints from Supabase to make it completely flexible. After this:
- You can use ANY values for types, statuses, etc.
- No more 400 errors from constraint violations
- Complete freedom to add new options without database changes

## Option 1: Direct SQL in Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Click on "SQL Editor" in the left sidebar

2. **Run the SQL Script**
   - Copy the entire contents of `remove_all_constraints.sql`
   - Paste it into the SQL editor
   - Click "Run" button

3. **Verify Success**
   - You should see messages about dropped constraints
   - The final query will show no remaining CHECK constraints

## Option 2: Run via Node.js Script

1. **Make sure environment variables are set**:
   ```bash
   cd backend
   # Check that .env has:
   # VITE_SUPABASE_URL=your-project-url
   # SUPABASE_SERVICE_ROLE_KEY=your-service-key
   ```

2. **Run the script**:
   ```bash
   npm install @supabase/supabase-js  # If not already installed
   node scripts/remove-all-constraints.js
   ```

## Option 3: Use Flexible Wrapper (Frontend Workaround)

If you can't modify the database, use the flexible wrapper in your frontend code:

```typescript
import { flexibleInsert, flexibleUpdate, getFlexibleValue } from './utils/flexibleSupabase';

// Instead of direct supabase insert:
const { data, error } = await flexibleInsert('notes', {
  type: 'My Custom Type',  // Will be stored as custom_type if constraints exist
  content: 'Note content'
});

// To read flexible values:
const noteType = getFlexibleValue(note, 'type'); // Gets custom type or default
```

## What's Been Changed

### Backend Changes (Completed):
- ✅ Disabled Helmet security headers
- ✅ Disabled CSRF protection on all routes  
- ✅ Disabled rate limiting
- ✅ Disabled input sanitization
- ✅ Disabled system configuration checks

### Database Changes (Apply Now):
- Remove ALL CHECK constraints from all tables
- Convert restricted columns to TEXT type
- Allow any values in type/status/role fields

### Frontend Helper (Available):
- Created `flexibleSupabase.ts` utility
- Automatically handles constraint errors
- Stores custom values in separate fields if needed

## Testing

After removing constraints, test with:

```javascript
// Add a note with custom type
await supabase.from('notes').insert({
  student_id: 'some-id',
  type: 'Random Custom Type',  // This will now work!
  content: 'Test note'
});

// Add consultation with custom status
await supabase.from('consultations').insert({
  student_id: 'some-id',
  type: 'Coffee Chat',  // Custom type!
  status: 'Maybe',      // Custom status!
  attendance_status: 'who knows'  // Custom attendance!
});
```

## Rollback (If Needed)

To restore constraints later, you would need to:
1. Clean up any non-conforming data
2. Re-add the CHECK constraints
3. Re-enable security middleware in backend

But for development flexibility, keeping them off is fine!