# Mock Data Documentation for Production

## Overview
This document outlines all mock/test data created during development and testing that should be removed or modified before deploying to production.

## Test Credentials
**⚠️ IMPORTANT: Remove all test credentials before production deployment**

### Authentication
- Test Password: `TestPassword123!`
- Test User: `user`
- Session Secrets: Generated randomly in development

### API Keys (Mock)
- Calendly API: `test-api-key`
- Claude API: Mock implementation in development

## Test Data Locations

### 1. Frontend Test Data

#### `/src/utils/sampleData.ts`
- Contains sample student data
- Mock consultation records
- Test notes and activities
- **Action**: Remove or replace with empty arrays

#### `/src/utils/authService.ts`
- Development authentication logic
- **Action**: Ensure production-ready password requirements

#### Test Students Created During Testing
```javascript
// Common test students that may exist in database:
- Name: "John Doe", Email: "john.doe@example.com"
- Name: "Jane Smith", Email: "jane.smith@example.com"
- Name: "Test Student", Email: "test@example.com"
- Name: "Career Test Student", Email: "career@example.com"
```

### 2. Backend Test Data

#### `/backend/src/database/seed.ts`
- Database seeding script with test data
- **Action**: Disable or remove seed script in production

#### `/backend/data/career_services.db`
- SQLite database with test data
- **Action**: Create fresh database for production

### 3. Environment Variables

#### Development `.env` values to change:
```bash
NODE_ENV=development → production
SESSION_SECRET=<generate-secure-secret>
CSRF_SECRET=<generate-secure-secret>
JWT_SECRET=<generate-secure-secret>
CLAUDE_API_KEY=<real-api-key>
CALENDLY_API_KEY=<real-api-key>
```

### 4. Configuration Files

#### `/backend/nodemon.json`
- Development-only configuration
- **Action**: Not needed in production

#### Vite Configuration
- Development server settings
- **Action**: Build for production using `npm run build`

## Production Checklist

### Before Deployment:

1. **Database**
   - [ ] Create fresh production database
   - [ ] Run migrations without seed data
   - [ ] Remove `/backend/data/career_services.db`

2. **Authentication**
   - [ ] Generate secure session secrets
   - [ ] Update password requirements if needed
   - [ ] Remove hardcoded test credentials

3. **API Keys**
   - [ ] Replace all mock API keys with real ones
   - [ ] Secure API key storage (environment variables)

4. **Code Cleanup**
   - [ ] Remove console.log statements
   - [ ] Remove debug components
   - [ ] Remove test endpoints

5. **Build Process**
   - [ ] Run `npm run build` for frontend
   - [ ] Run `npm run build` for backend
   - [ ] Test production build locally

6. **Security**
   - [ ] Enable HTTPS
   - [ ] Configure CORS properly
   - [ ] Enable rate limiting
   - [ ] Configure CSP headers

## Scripts to Run

### Clean Database
```bash
# Remove test database
rm backend/data/career_services.db

# Create fresh database
cd backend
npm run db:migrate
```

### Build for Production
```bash
# Frontend
npm run build

# Backend
cd backend
npm run build
```

### Generate Secure Secrets
```bash
# Generate session secret
openssl rand -base64 32

# Generate CSRF secret
openssl rand -base64 32

# Generate JWT secret
openssl rand -base64 32
```

## Testing Production Build

1. Set `NODE_ENV=production`
2. Use production database
3. Test all critical paths:
   - Authentication flow
   - Student management
   - Career services
   - Data export/import
   - API integrations

## Monitoring

After deployment, monitor for:
- Authentication failures
- API errors
- Performance issues
- Security warnings

## Rollback Plan

Keep backups of:
- Previous deployment
- Database before migration
- Configuration files

---

**Remember**: This is a comprehensive list. Always do a final review of all code and configuration before deploying to production.