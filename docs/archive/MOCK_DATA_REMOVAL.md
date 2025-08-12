# Mock Data Removal Guide for Production

This guide explains how to remove all mock/test data from the Personal CRM application before deploying to production.

## Frontend Mock Data

### 1. Student Data (`src/utils/studentData.ts`)
- **Current State**: Contains mock students array and functions that use localStorage
- **Production Changes**:
  ```typescript
  // Remove or comment out the mockStudents array
  // const mockStudents = [...] 
  
  // Ensure all functions work with empty initial state
  export const getStudents = (): Student[] => {
    const saved = localStorage.getItem('students');
    return saved ? JSON.parse(saved) : []; // Remove mockStudents fallback
  };
  ```

### 2. Tags Data (`src/utils/tagsData.ts`)
- **Current State**: Contains default tags array
- **Production Changes**:
  ```typescript
  // Remove defaultTags array
  // const defaultTags = [...]
  
  export const getTags = (): Tag[] => {
    const saved = localStorage.getItem('tags');
    return saved ? JSON.parse(saved) : []; // Empty array instead of defaultTags
  };
  ```

### 3. Career Progress Data (`src/data/careerProgress.ts`)
- **Current State**: Contains mock career progress data
- **Production Changes**: Remove the entire file or replace with empty arrays

### 4. Student Templates (`src/data/studentTemplates.js`)
- **Current State**: Contains CV templates and other mock data
- **Production Changes**: Keep the structure but remove the actual content

## Backend Mock Data

### 1. Database Initialization
- **Location**: `backend/src/database/sqlite-connection.ts`
- **Current State**: Creates default admin user message
- **Production Changes**: Ensure proper admin user creation flow

### 2. API Response Mocks
- Check all controllers for any hardcoded test data
- Remove any development-only endpoints

## Calendly Integration

### 1. Test Webhook Data
- **Location**: `src/pages/IntegrationsPage.tsx`
- **Current State**: Has test integration button
- **Production Changes**: 
  - Remove test buttons or add proper authentication
  - Ensure webhook endpoints are secured

## Environment Variables

### 1. Frontend (.env)
```env
# Remove any test API keys
VITE_API_URL=https://your-production-api.com
# Remove mock feature flags
```

### 2. Backend (.env)
```env
# Production database
DATABASE_URL=your-production-db
SESSION_SECRET=generate-secure-secret
CSRF_SECRET=generate-secure-secret
CALENDLY_API_KEY=your-real-api-key
NODE_ENV=production
```

## Pre-Production Checklist

- [ ] Remove all mock student data from `studentData.ts`
- [ ] Clear default tags from `tagsData.ts`
- [ ] Remove career progress mock data
- [ ] Remove student templates or replace with empty templates
- [ ] Disable test integration buttons
- [ ] Set up proper admin user creation flow
- [ ] Update all environment variables
- [ ] Clear localStorage in production deployment
- [ ] Test with empty database to ensure app works without mock data
- [ ] Verify all "coming soon" features are properly disabled
- [ ] Remove any console.log statements
- [ ] Ensure error boundaries are in place

## Data Migration

If you need to preserve some mock data as initial data:

1. Export the data you want to keep
2. Create proper database seeds
3. Use migration scripts to populate production database

## Testing Production Build

```bash
# Frontend
cd frontend
npm run build
npm run preview

# Backend
cd backend
npm run build
NODE_ENV=production npm start
```

## Important Notes

1. The application should work with completely empty data
2. First-time user experience should guide admin to set up initial data
3. All features should gracefully handle empty states
4. Mock data should never be committed to production branches