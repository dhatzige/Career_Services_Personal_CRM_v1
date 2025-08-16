# Career Services CRM Deployment Guide

This guide covers deploying the Career Services CRM to production using free cloud services.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Deployment (Docker)](#local-deployment)
3. [Production Deployment](#production-deployment)
4. [Post-Deployment Setup](#post-deployment-setup)
5. [Monitoring & Maintenance](#monitoring--maintenance)

## Prerequisites

### Required Accounts
- [Supabase](https://supabase.com/) - Database & Auth
- [Railway](https://railway.app/) - Backend hosting
- [Vercel](https://vercel.com/) - Frontend hosting
- [Upstash](https://upstash.com/) - Redis cache
- [Resend](https://resend.com/) - Email service
- [Sentry](https://sentry.io/) - Error monitoring
- [Cloudflare R2](https://www.cloudflare.com/products/r2/) - File storage (optional)

### Development Tools
- Node.js 18+
- Docker & Docker Compose (for local deployment)
- Railway CLI: `npm install -g @railway/cli`
- Vercel CLI: `npm install -g vercel`

## Local Deployment

### Using Docker Compose

1. **Prepare environment files**
   ```bash
   cp backend/.env.example backend/.env
   cp .env.example .env
   ```

2. **Run the deployment script**
   ```bash
   ./scripts/deploy-local.sh
   ```

3. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost:4001/api
   - Health Check: http://localhost:4001/health

### Manual Docker Commands
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Remove everything
docker-compose down -v
```

## Production Deployment

### Step 1: Database Setup (Supabase)

1. **Create Supabase Project**
   - Sign up at [supabase.com](https://supabase.com/)
   - Create new project
   - Note your project URL and service key

2. **Run Database Migration**
   - Go to SQL Editor in Supabase dashboard
   - Copy contents of `backend/src/database/supabase-migration.sql`
   - Execute the SQL

3. **Enable Row Level Security**
   - Already included in migration script
   - Verify in Authentication > Policies

### Step 2: Backend Deployment (Railway)

1. **Login to Railway**
   ```bash
   railway login
   ```

2. **Deploy Backend**
   ```bash
   cd backend
   railway init
   railway up
   ```

3. **Configure Environment Variables**
   In Railway dashboard, add all variables from `.env.example`:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `RESEND_API_KEY`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `SENTRY_DSN`
   - etc.

4. **Get Backend URL**
   ```bash
   railway open
   ```

### Step 3: Frontend Deployment (Vercel)

1. **Update Frontend Configuration**
   Update `.env` with production values:
   ```env
   VITE_API_URL=https://your-backend.railway.app/api
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Deploy to Vercel**
   ```bash
   vercel login
   npm run build
   vercel --prod
   ```

3. **Configure Environment Variables**
   In Vercel dashboard, add:
   - `VITE_API_URL`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Step 4: Cache Setup (Upstash Redis)

1. **Create Redis Database**
   - Sign up at [upstash.com](https://upstash.com/)
   - Create new Redis database
   - Copy REST URL and token

2. **Update Backend Environment**
   Add to Railway environment:
   ```env
   UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token
   ```

### Step 5: Email Setup (Resend)

1. **Configure Resend**
   - Sign up at [resend.com](https://resend.com/)
   - Verify your domain (optional)
   - Create API key

2. **Update Backend Environment**
   ```env
   EMAIL_ENABLED=true
   RESEND_API_KEY=re_your_api_key
   EMAIL_FROM=noreply@yourdomain.com
   ```

### Step 6: Monitoring Setup (Sentry)

1. **Create Sentry Project**
   - Sign up at [sentry.io](https://sentry.io/)
   - Create new project (Node.js)
   - Copy DSN

2. **Update Backend Environment**
   ```env
   SENTRY_DSN=https://your-dsn@sentry.io/project-id
   ```

## Post-Deployment Setup

### 1. Create Admin Account
- Visit your frontend URL
- Click "Sign Up"
- First account created gets admin privileges

### 2. Configure Calendly
- Log in as admin
- Go to Settings > Integrations
- Add Calendly webhook URL: `https://your-backend.railway.app/api/calendar/webhook`
- Copy webhook secret to backend environment

### 3. Test Features
- [ ] User registration and login
- [ ] Student management
- [ ] Consultation scheduling
- [ ] Email notifications
- [ ] File uploads
- [ ] AI features (if Claude API configured)

### 4. Custom Domain (Optional)
- Add custom domain in Vercel dashboard
- Add custom domain in Railway dashboard
- Update CORS settings in backend

## Monitoring & Maintenance

### Daily Checks
- Monitor Sentry for errors
- Check Railway metrics
- Review Vercel analytics

### Weekly Tasks
- Review database usage in Supabase
- Check Redis cache hit rates
- Monitor email delivery rates

### Monthly Tasks
- Update dependencies
- Review security patches
- Analyze usage patterns
- Optimize database queries

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Verify `FRONTEND_URL` in backend environment
   - Check Railway domain is correct

2. **Database Connection Failed**
   - Verify Supabase credentials
   - Check if database is paused (free tier)

3. **Emails Not Sending**
   - Verify Resend API key
   - Check `EMAIL_ENABLED=true`
   - Review email logs

4. **Cache Not Working**
   - Verify Upstash credentials
   - Check Redis connection in logs

### Debug Commands

```bash
# Check backend logs
railway logs

# Check frontend logs
vercel logs

# Test backend health
curl https://your-backend.railway.app/health

# Test database connection
railway run npm run db:check
```

## Cost Analysis

All services offer generous free tiers:

| Service | Free Tier | Typical Usage |
|---------|-----------|---------------|
| Supabase | 500MB database | ~10,000 students |
| Railway | $5 credit/month | ~1M requests |
| Vercel | 100GB bandwidth | ~100k visits |
| Upstash | 10k commands/day | ~1000 users |
| Resend | 100 emails/day | Small institution |
| Sentry | 5k errors/month | Normal operation |

## Security Checklist

- [ ] Change all default secrets
- [ ] Enable 2FA on all service accounts
- [ ] Review Supabase RLS policies
- [ ] Set up backup strategy
- [ ] Configure rate limiting
- [ ] Enable HTTPS everywhere
- [ ] Review CORS settings
- [ ] Test authentication flow
- [ ] Verify email domain (SPF/DKIM)

## Backup Strategy

1. **Database Backups**
   - Supabase automatic daily backups (Pro plan)
   - Manual export via SQL dump

2. **File Backups**
   - Implement Cloudflare R2 for file storage
   - Regular backup to external service

3. **Code Backups**
   - Git repository (private)
   - Tagged releases for each deployment

## Support

For deployment issues:
1. Check service-specific documentation
2. Review error logs in Sentry
3. Check Railway/Vercel deployment logs
4. Open issue in project repository