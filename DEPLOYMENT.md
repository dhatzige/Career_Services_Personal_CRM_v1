# Career Services CRM - Deployment Guide

## 🚀 Current Deployment Status

### Backend (Fly.io)
- **URL**: https://career-services-personal-crm.fly.dev
- **Status**: ✅ Deployed and running
- **Region**: Amsterdam (ams)
- **Database**: SQLite with persistent volume

### Frontend (Vercel)
- **URL**: To be configured after first deployment
- **Status**: 🔄 Ready to deploy
- **Framework**: Vite + React

## 📋 Prerequisites

Before deploying, ensure you have:
1. GitHub repository access
2. Fly.io account and CLI installed
3. Vercel account
4. All required API keys and secrets

## 🔧 Setup Instructions

### 1. GitHub Secrets Configuration

Add these secrets to your GitHub repository (Settings → Secrets → Actions):

```bash
# Fly.io
FLY_API_TOKEN=<your-fly-api-token>

# Vercel
VERCEL_TOKEN=<your-vercel-token>
VERCEL_ORG_ID=<your-vercel-org-id>
VERCEL_PROJECT_ID=<your-vercel-project-id>

# Supabase (already configured in backend)
SUPABASE_URL=https://tvqhnpgtpmleaiyjewmo.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_KEY=<your-service-key>

# Optional: API Keys
CLAUDE_API_KEY=<your-claude-api-key>
RESEND_API_KEY=<your-resend-api-key>
```

### 2. Vercel Project Setup

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Link your project:
```bash
vercel link
```

3. Configure environment variables in Vercel Dashboard:
```
VITE_API_URL=https://career-services-personal-crm.fly.dev
VITE_SUPABASE_URL=https://tvqhnpgtpmleaiyjewmo.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_SENTRY_DSN=<your-sentry-dsn>
```

### 3. Deploy Frontend to Vercel

#### Option A: Via Vercel Dashboard
1. Import your GitHub repository
2. Select "Vite" as framework preset
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variables
6. Deploy

#### Option B: Via CLI
```bash
# Initial deployment
vercel --prod

# Subsequent deployments (automatic via GitHub Actions)
git push origin main
```

### 4. Backend Updates (Fly.io)

The backend is already deployed. To update:

```bash
cd backend
fly deploy
```

Or push to main branch to trigger GitHub Actions.

## 🔄 CI/CD Pipeline

The GitHub Actions workflow automatically:
1. Runs tests on every push/PR
2. Deploys backend to Fly.io on main branch
3. Deploys frontend to Vercel on main branch
4. Sends deployment notifications

## 🌐 Domain Configuration

### Custom Domain Setup (Optional)

#### For Frontend (Vercel):
1. Go to Vercel Dashboard → Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

#### For Backend (Fly.io):
```bash
fly certs add api.yourdomain.com
```

## 📊 Monitoring

### Application Health
- Backend: https://career-services-personal-crm.fly.dev/health
- Frontend: Check Vercel Dashboard
- Sentry: https://de.sentry.io (act-l6 organization)

### Logs
```bash
# Backend logs
fly logs

# Frontend logs (Vercel)
vercel logs
```

## 🚨 Troubleshooting

### Backend Issues
```bash
# Check status
fly status

# Scale if needed
fly scale count 1

# Check secrets
fly secrets list

# SSH into container
fly ssh console
```

### Frontend Issues
```bash
# Check build logs
vercel logs

# Redeploy
vercel --prod --force

# Check environment variables
vercel env ls
```

### Database Issues
```bash
# Connect to SQLite
fly ssh console
cd /app/data
sqlite3 career_services.db
```

## 🔐 Security Checklist

- [x] All sensitive data in environment variables
- [x] No hardcoded credentials in code
- [x] HTTPS enforced on both frontend and backend
- [x] Supabase RLS policies configured
- [x] Rate limiting enabled
- [x] CORS properly configured
- [x] Sentry error tracking active

## 📝 Post-Deployment Tasks

1. **Verify Deployment**
   - [ ] Backend health check passes
   - [ ] Frontend loads correctly
   - [ ] Authentication works
   - [ ] Database operations work
   - [ ] Email sending works (if configured)

2. **Configure Monitoring**
   - [ ] Set up Sentry alerts
   - [ ] Configure uptime monitoring
   - [ ] Set up backup strategy

3. **Update Documentation**
   - [ ] Update README with production URLs
   - [ ] Document any deployment-specific configurations
   - [ ] Share access with team members

## 🆘 Support

For deployment issues:
1. Check GitHub Actions logs
2. Review Fly.io and Vercel dashboards
3. Check Sentry for errors
4. Review this documentation

## 📅 Maintenance

Regular maintenance tasks:
- Weekly: Check logs and error rates
- Monthly: Review resource usage
- Quarterly: Update dependencies
- Yearly: Rotate API keys and secrets

---

Last updated: August 12, 2025
Version: 0.12.0