# Hybrid Database Implementation Plan
**Date**: February 1, 2025  
**Purpose**: Enable flexible development by using SQLite for data while keeping Supabase for authentication

## Executive Summary
Switch to a hybrid approach where:
- **Supabase**: Handles authentication only (login, sessions, security)
- **SQLite**: Handles all application data (students, notes, consultations, etc.)
- **Result**: No more constraint errors, instant development, secure authentication

## Why This Approach?
### Current Problems with Supabase Database
1. Strict type constraints (must match exact enum values)
2. Column name mismatches (consultation_type vs type)
3. Cannot quickly iterate on features
4. Every change requires database migration
5. Foreign key constraints causing development friction

### Benefits of Hybrid Approach
1. **Immediate Relief**: No more 400 errors from constraints
2. **Development Speed**: Add fields/features instantly
3. **Keep What Works**: Supabase Auth remains untouched
4. **Easy Migration**: Move to Supabase later when schema is stable
5. **Best of Both Worlds**: Secure auth + flexible data

## Implementation Steps

### Phase 1: Environment Setup (30 minutes)
1. Add environment variable to `.env`:
   ```env
   USE_LOCAL_DB=true  # Switch between local/Supabase
   ```

2. Update backend configuration to check this variable

3. Keep existing Supabase auth configuration

### Phase 2: Database Layer Update (1-2 hours)
1. Create database adapter pattern:
   ```typescript
   // pseudocode
   if (process.env.USE_LOCAL_DB === 'true') {
     return sqliteDatabase;
   } else {
     return supabaseDatabase;
   }
   ```

2. Update these key files:
   - `backend/src/controllers/studentController.ts`
   - `backend/src/controllers/noteController.ts`
   - `backend/src/controllers/consultationController.ts`

3. Ensure SQLite schema matches current needs

### Phase 3: Frontend Updates (30 minutes)
1. Keep all Supabase auth code unchanged
2. Update API calls to go through backend (already doing this)
3. Remove direct Supabase data queries from frontend

### Phase 4: Testing (1 hour)
1. Test authentication flow (should work unchanged)
2. Test all CRUD operations with SQLite
3. Verify no constraint errors
4. Test switching between databases via env variable

## Technical Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│   React App     │────▶│  Express API     │────▶│  SQLite (Dev)   │
│                 │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                                                │
         │                                                │
         ▼                                                ▼
┌─────────────────┐                              ┌─────────────────┐
│  Supabase Auth  │                              │ Supabase (Prod) │
│   (Always On)   │                              │   (Future)      │
└─────────────────┘                              └─────────────────┘
```

## File Structure
```
backend/
├── src/
│   ├── config/
│   │   └── database.ts       # New: Database selector
│   ├── database/
│   │   ├── connection.ts     # Existing SQLite
│   │   ├── supabase.ts      # Existing Supabase
│   │   └── adapter.ts       # New: Adapter pattern
│   └── controllers/         # Update to use adapter
```

## Migration Strategy (Future)

When ready for production:
1. Export SQLite schema as SQL
2. Clean up any development-specific fields
3. Create Supabase migration with final schema
4. Run data migration script
5. Switch `USE_LOCAL_DB=false`
6. Deploy to production

## Security Considerations

✅ **Maintained Security**:
- Authentication remains with Supabase
- User sessions stay secure
- API authentication unchanged
- SQLite only accessible through authenticated API

❌ **Not Compromised**:
- No direct database access from frontend
- No security downgrade
- No user data exposed

## Development Workflow

### Daily Development:
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `npm run dev`
3. SQLite database auto-created if needed
4. No constraint errors!

### Adding New Features:
1. Add fields to SQLite schema
2. Update TypeScript types
3. Build feature
4. No database migration needed!

### Testing Production Mode:
1. Set `USE_LOCAL_DB=false`
2. Ensure Supabase schema is updated
3. Test with production constraints
4. Switch back for development

## Rollback Plan

If issues arise:
1. Set `USE_LOCAL_DB=false` 
2. System returns to current state
3. No data loss (SQLite data separate)
4. Can switch back anytime

## Success Criteria

✅ Development can proceed without constraint errors  
✅ Authentication continues working  
✅ Can add/modify fields without migrations  
✅ Can switch between databases easily  
✅ Path to production remains clear

## Next Actions

1. Approve this plan
2. Implement Phase 1 (Environment Setup)
3. Test basic functionality
4. Proceed with remaining phases
5. Resume feature development without constraints!