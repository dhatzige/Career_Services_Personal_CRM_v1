# 🚀 EASIEST Way: Deploy via Fly.io Website + GitHub

Since you can connect your GitHub repo directly, this is the SIMPLEST method!

## Step 1: Connect GitHub to Fly.io

1. Go to https://fly.io/dashboard
2. Click "Launch an app"
3. Choose "Connect GitHub repository"
4. Select your repository: `dhatzige/Career_Services_Personal_CRM`
5. Choose the branch: `main`

## Step 2: Configure Your App

When prompted on the Fly.io website:

- **App name**: `career-services-crm` (or choose your own)
- **Region**: `Amsterdam (ams)` - closest to Greece
- **Machine size**: `shared-cpu-1x@256MB` (free tier)
- **Database**: Skip/None (we use SQLite)

## Step 3: Set Environment Variables (Secrets)

In the Fly.io dashboard for your app:

1. Go to "Secrets" tab
2. Add these one by one:

### Required Secrets:
```
SUPABASE_URL = (get from Supabase dashboard)
SUPABASE_ANON_KEY = (get from Supabase dashboard)
SUPABASE_SERVICE_ROLE_KEY = (get from Supabase dashboard)

SESSION_SECRET = (generate a random string)
JWT_SECRET = (generate another random string)
CSRF_SECRET = (generate third random string)

MASTER_EMAIL = your-email@example.com
MASTER_PASSWORD = your-secure-password

FRONTEND_URL = https://your-frontend-url.com
```

### Optional but Recommended:
```
CLAUDE_API_KEY = (your Claude API key for AI features)
RESEND_API_KEY = (for email invitations)
SENTRY_DSN = (for error tracking)
```

## Step 4: Deploy

1. Click "Deploy" button in Fly.io dashboard
2. Wait 3-5 minutes for deployment
3. Your app will be live at: `https://career-services-crm.fly.dev`

## That's It! 🎉

Your app will now:
- Automatically deploy when you push to GitHub
- Use SQLite with persistent storage
- Be accessible from anywhere
- Stay in the free tier

## To Update Your App Later:

Just push changes to GitHub:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

Fly.io will automatically redeploy!

## Monitor Your App:

- Logs: https://fly.io/apps/career-services-crm/monitoring
- Metrics: https://fly.io/apps/career-services-crm/metrics
- Secrets: https://fly.io/apps/career-services-crm/secrets

## Important Notes:

1. **No Docker needed** - Fly.io handles everything
2. **Free tier limits**:
   - 3 shared VMs
   - 3GB persistent storage
   - 160GB bandwidth
3. **SQLite database** is automatically backed up
4. **Your other projects** are not affected at all