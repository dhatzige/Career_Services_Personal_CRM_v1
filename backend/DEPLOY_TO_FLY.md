# 🚀 Simple Deployment Guide to Fly.io

## Important: This does NOT use Docker
We're using Fly.io's Buildpack deployment, which won't interfere with your other Docker projects.

## Step-by-Step Deployment

### 1. Login to Fly.io
Open your terminal and run:
```bash
/Users/dimxatz/.fly/bin/flyctl auth login
```
This will open your browser - login or create an account.

### 2. Create Your App on Fly.io
Run this command:
```bash
cd /Users/dimxatz/Desktop/Bolt_Projects/project/backend
/Users/dimxatz/.fly/bin/flyctl launch --no-deploy
```

When prompted:
- App name: Press Enter to use `career-services-crm` or choose your own
- Region: Choose `ams` (Amsterdam) - it's close to Greece
- PostgreSQL database: Choose **NO** (we use SQLite)
- Redis: Choose **NO**
- Deploy now: Choose **NO** (we need to set up secrets first)

### 3. Set Your Secret Environment Variables
Run these commands one by one (replace with your actual values):

```bash
# Supabase credentials (from your Supabase dashboard)
/Users/dimxatz/.fly/bin/flyctl secrets set SUPABASE_URL="your-supabase-url"
/Users/dimxatz/.fly/bin/flyctl secrets set SUPABASE_ANON_KEY="your-supabase-anon-key"
/Users/dimxatz/.fly/bin/flyctl secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Security secrets (generate random strings)
/Users/dimxatz/.fly/bin/flyctl secrets set SESSION_SECRET="generate-random-string-here"
/Users/dimxatz/.fly/bin/flyctl secrets set JWT_SECRET="another-random-string-here"
/Users/dimxatz/.fly/bin/flyctl secrets set CSRF_SECRET="third-random-string-here"

# API Keys (optional but recommended)
/Users/dimxatz/.fly/bin/flyctl secrets set CLAUDE_API_KEY="your-claude-key"
/Users/dimxatz/.fly/bin/flyctl secrets set RESEND_API_KEY="your-resend-key"
/Users/dimxatz/.fly/bin/flyctl secrets set SENTRY_DSN="your-sentry-dsn"

# Master account
/Users/dimxatz/.fly/bin/flyctl secrets set MASTER_EMAIL="your-email@example.com"
/Users/dimxatz/.fly/bin/flyctl secrets set MASTER_PASSWORD="your-secure-password"
```

### 4. Deploy Your App
Now deploy:
```bash
/Users/dimxatz/.fly/bin/flyctl deploy
```

This will:
- Build your app using Node.js buildpack (NOT Docker)
- Upload it to Fly.io
- Start your server

### 5. Check Your App
Once deployed, run:
```bash
/Users/dimxatz/.fly/bin/flyctl open
```

Your app will be available at: https://career-services-crm.fly.dev

### 6. View Logs (if needed)
To see what's happening:
```bash
/Users/dimxatz/.fly/bin/flyctl logs
```

## Troubleshooting

### If deployment fails:
1. Check logs: `/Users/dimxatz/.fly/bin/flyctl logs`
2. Check secrets are set: `/Users/dimxatz/.fly/bin/flyctl secrets list`
3. SSH into app: `/Users/dimxatz/.fly/bin/flyctl ssh console`

### Database Notes:
- SQLite database is automatically created
- It's stored in persistent storage at `/data`
- Backups happen automatically

## Updating Your App

When you make changes:
1. Commit to git: `git add . && git commit -m "Updates"`
2. Deploy: `/Users/dimxatz/.fly/bin/flyctl deploy`

## Costs
- Fly.io free tier includes:
  - 3 shared VMs
  - 3GB persistent storage
  - 160GB outbound transfer
- Your app should fit in the free tier!

## Important: This doesn't affect Docker
- We're using Buildpacks, not Docker
- Your other Docker projects remain untouched
- No Docker commands are needed