console.log(`
🔑 How to Get Your Supabase Keys
================================

You already have: 
✅ Project URL: https://nhzuliqmjszibcbftjtq.supabase.co

You still need:
❌ Service Key (for backend)
❌ Anon Key (for frontend)

Steps to get them:
1. Go to: https://app.supabase.com
2. Log in to your account
3. Click on your project (nhzuliqmjszibcbftjtq)
4. Go to: Settings (gear icon) → API
5. You'll see two keys:
   - anon (public): This goes in the frontend .env
   - service_role (secret): This goes in the backend .env

⚠️  IMPORTANT: The service_role key is SECRET!
Never commit it to git or expose it publicly.

Once you have the keys, update these files:

backend/.env:
SUPABASE_SERVICE_KEY=your-service-role-key-here

.env (frontend):
VITE_SUPABASE_ANON_KEY=your-anon-key-here

Then I can run the database setup for you!
`);