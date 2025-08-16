# Supabase Migration Guide

This guide explains how to migrate from SQLite to Supabase for production deployment.

## Current Status

✅ **Database Abstraction Layer Created**
- The backend now supports both SQLite and Supabase
- Switch between databases using `USE_SUPABASE` environment variable
- SQLite remains the default for local development

## Migration Steps

### Step 1: Set Up Supabase Project

1. **Create Supabase Account**
   - Go to [supabase.com](https://supabase.com/)
   - Create a new project
   - Note your project URL and service key

2. **Get Your Credentials**
   ```
   Project URL: https://nhzuliqmjszibcbftjtq.supabase.co
   Anon Key: (found in Settings > API)
   Service Key: (found in Settings > API - keep this secret!)
   ```

### Step 2: Run Database Migration

1. **Open Supabase SQL Editor**
   - Go to your project dashboard
   - Click on "SQL Editor"

2. **Execute Migration Script**
   - Copy the entire contents of `backend/src/database/supabase-migration.sql`
   - Paste and run in SQL Editor
   - This creates all tables, indexes, and RLS policies

### Step 3: Configure Backend

1. **Update Environment Variables**
   ```env
   # Database Configuration
   USE_SUPABASE=true
   
   # Supabase Configuration
   SUPABASE_URL=https://nhzuliqmjszibcbftjtq.supabase.co
   SUPABASE_SERVICE_KEY=your-service-key-here
   ```

2. **Update Frontend Environment**
   ```env
   VITE_SUPABASE_URL=https://nhzuliqmjszibcbftjtq.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### Step 4: Data Migration (If Needed)

If you have existing data in SQLite:

1. **Export SQLite Data**
   ```bash
   sqlite3 data/career_services.db .dump > backup.sql
   ```

2. **Convert to PostgreSQL Format**
   - Remove SQLite-specific syntax
   - Update date formats
   - Convert AUTOINCREMENT to SERIAL

3. **Import to Supabase**
   - Use Supabase's import tool
   - Or modify and run SQL in SQL Editor

## Architecture Overview

### Database Abstraction
```
┌─────────────────┐
│   Application   │
└────────┬────────┘
         │
┌────────▼────────┐
│ DatabaseAdapter │ ← Decides which DB to use
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼─────┐
│SQLite│  │Supabase│
└──────┘  └────────┘
```

### Current Implementation

1. **SQLite (Local Development)**
   - Zero configuration
   - File-based database
   - Perfect for development

2. **Supabase (Production)**
   - PostgreSQL database
   - Built-in authentication
   - Row Level Security
   - Real-time subscriptions

## Features Comparison

| Feature | SQLite | Supabase |
|---------|--------|----------|
| Setup | Instant | Requires account |
| Scalability | Limited | Unlimited |
| Concurrent Users | ~10 | Thousands |
| Backups | Manual | Automatic |
| Authentication | Custom | Built-in |
| Real-time | No | Yes |
| Cost | Free | Free tier available |

## Model Updates Required

To fully utilize Supabase, the following models need updates:

1. **StudentModel**
   - [ ] Replace SQL queries with Supabase client
   - [ ] Use RLS for security
   - [ ] Add real-time subscriptions

2. **ConsultationModel**
   - [ ] Migrate to Supabase queries
   - [ ] Add PostgreSQL-specific features

3. **ApplicationModel**
   - [ ] Update CRUD operations
   - [ ] Use Supabase filters

## Testing Migration

1. **Local Testing with Supabase**
   ```bash
   # Set environment variable
   export USE_SUPABASE=true
   
   # Start backend
   npm run dev
   ```

2. **Verify Features**
   - [ ] User authentication
   - [ ] Student CRUD operations
   - [ ] File uploads
   - [ ] Real-time updates

## Rollback Plan

If issues occur:
1. Set `USE_SUPABASE=false`
2. Restart the application
3. You're back to SQLite

## Next Steps

1. **Complete Model Migration**
   - Update all models to support Supabase
   - Add proper error handling
   - Implement caching strategy

2. **Add Supabase Features**
   - Real-time subscriptions
   - PostgreSQL full-text search
   - Database functions

3. **Performance Optimization**
   - Connection pooling
   - Query optimization
   - Index tuning

## Production Checklist

- [ ] Supabase project created
- [ ] Migration script executed
- [ ] Environment variables set
- [ ] Models updated for Supabase
- [ ] Authentication configured
- [ ] RLS policies tested
- [ ] Backup strategy defined
- [ ] Monitoring configured

## Common Issues

### Connection Refused
- Check SUPABASE_URL is correct
- Verify service key is valid
- Ensure project is not paused

### Permission Denied
- Check RLS policies
- Verify service key (not anon key)
- Review user permissions

### Slow Queries
- Add appropriate indexes
- Use Supabase query builder
- Enable connection pooling

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- Project issues tracker