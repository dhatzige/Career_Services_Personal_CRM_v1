# Career Services CRM - Deployment Documentation

## 🚀 Production Deployments

### Frontend (Vercel)
- **Production URL**: https://project-88xltxi7d-dimitris-projects-74509e82.vercel.app
- **Platform**: Vercel
- **Framework**: Vite + React
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: 18.x

### Backend API (Fly.io)
- **Production URL**: https://career-services-personal-crm.fly.dev
- **Platform**: Fly.io
- **Framework**: Express + TypeScript
- **Port**: 4001
- **Region**: Frankfurt (fra)
- **Database**: SQLite (local) + Supabase (auth)

### Authentication (Supabase)
- **Project URL**: https://nhzuliqmjszibcbftjtq.supabase.co
- **Auth Method**: Supabase Auth (direct from frontend)
- **Master User**: dhatzige@act.edu
- **Registration**: Invite-only system

## 📋 Environment Variables

### Frontend (Vercel)
```env
VITE_API_URL=https://career-services-personal-crm.fly.dev
VITE_SUPABASE_URL=https://nhzuliqmjszibcbftjtq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SENTRY_DSN=https://84f59a52e0e64fddab3a31e6a964b7d2@de.sentry.io/4508563074957312
```

### Backend (Fly.io)
```env
FRONTEND_URL=https://project-88xltxi7d-dimitris-projects-74509e82.vercel.app
PORT=4001
USE_SUPABASE=true
SUPABASE_URL=https://nhzuliqmjszibcbftjtq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[SECURE - Never expose]
```

## 🔧 Deployment Commands

### Deploy Frontend (Vercel)
```bash
# Login to Vercel
vercel login --github

# Deploy to production
vercel --prod

# Update environment variables
vercel env add VARIABLE_NAME production
```

### Deploy Backend (Fly.io)
```bash
# Login to Fly.io
flyctl auth login

# Deploy from backend directory
cd backend
flyctl deploy

# Update secrets
flyctl secrets set VARIABLE_NAME="value" -a career-services-personal-crm

# View logs
flyctl logs -a career-services-personal-crm
```

## 🔄 CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:5173` (local development)
- `http://localhost:5174` (alternative local)
- `https://project-88xltxi7d-dimitris-projects-74509e82.vercel.app` (production)
- `https://project-dimitris-projects-74509e82.vercel.app` (alternative)
- `https://project.vercel.app` (custom domain if configured)

## 📊 Monitoring

### Sentry Error Tracking
- **Organization**: act-l6
- **Frontend Project**: career-services-frontend
- **Backend Project**: career-services-backend
- **Region**: Germany (de.sentry.io)

### Health Checks
- **Backend Health**: https://career-services-personal-crm.fly.dev/health
- **Frontend**: Check Vercel dashboard for deployment status

## 🚨 Troubleshooting

### Common Issues

1. **"Failed to fetch" error on login**
   - Check CORS configuration in backend/src/server.ts
   - Verify Supabase URL and keys are correct
   - Ensure backend is running and accessible

2. **404 errors on API calls**
   - Verify VITE_API_URL is set correctly
   - Check backend is deployed and running
   - Ensure routes are properly configured

3. **Authentication issues**
   - Verify Supabase configuration
   - Check user exists in Supabase auth
   - Ensure email normalization for Gmail accounts

### Useful Commands

```bash
# Check Vercel deployment status
vercel ls

# View Vercel environment variables
vercel env ls production

# Check Fly.io app status
flyctl status -a career-services-personal-crm

# View Fly.io secrets (names only)
flyctl secrets list -a career-services-personal-crm

# SSH into Fly.io container
flyctl ssh console -a career-services-personal-crm
```

## 📝 Last Updated
- **Date**: August 12, 2025
- **Version**: 0.12.0
- **Deployed By**: Claude Code Assistant