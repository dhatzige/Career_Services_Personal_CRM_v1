# Supabase Setup Guide for Career Services CRM

## ⚠️ IMPORTANT SECURITY NOTICE

You've shared what appear to be Supabase keys. For security:
1. **NEVER commit these keys to Git**
2. **Regenerate these keys** if they were exposed publicly
3. Use environment variables for all sensitive data

## 🔐 Key Types Explanation

### 1. **Publishable Key** (`sb_publishable_4oI_Kae2Aj0lITMPJi5K2Q_EDv7qZ4_`)
- Also known as "anon key" in Supabase
- Safe to use in frontend code
- Used for client-side authentication
- Has limited permissions based on Row Level Security (RLS)

### 2. **Secret Key** (`sb_secret_YKG4dsf5T4aoJPo4KtJwlw_SZb_86v1`)
- Also known as "service role key"
- **NEVER expose in frontend code**
- Only use in backend/server environments
- Bypasses Row Level Security - has full database access

## 🚀 Quick Setup Steps

### 1. Update Environment Files

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your actual values
# Make sure .env is in .gitignore!
```

### 2. Get Your Supabase Project URL

1. Go to your Supabase dashboard
2. Navigate to Settings > API
3. Copy your Project URL (looks like: `https://xyzxyz.supabase.co`)

### 3. Update Your Environment Variables

**Frontend (.env or .env.local):**
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_4oI_Kae2Aj0lITMPJi5K2Q_EDv7qZ4_
```

**Backend (.env):**
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=sb_secret_YKG4dsf5T4aoJPo4KtJwlw_SZb_86v1
```

### 4. Initialize Supabase Tables

Run the migration script to create tables in Supabase:

```bash
# First, update your database connection
cd backend
npm run db:migrate

# Then run the Supabase-specific migrations
npx supabase db push
```

### 5. Set Up Row Level Security (RLS)

Create these policies in Supabase SQL editor:

```sql
-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Students table policies
CREATE POLICY "Authenticated users can view all students" ON students
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create students" ON students
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update students" ON students
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Notes table policies
CREATE POLICY "Users can view non-private notes" ON notes
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    (is_private = false OR auth.uid()::text = created_by)
  );

CREATE POLICY "Users can create notes" ON notes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Add similar policies for other tables...
```

### 6. Enable Authentication Providers

In Supabase Dashboard > Authentication > Providers:

1. **Email Auth**: Already enabled by default
2. **Google OAuth**:
   - Create OAuth credentials in Google Cloud Console
   - Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
3. **GitHub OAuth**:
   - Create OAuth App in GitHub Settings
   - Add callback URL
4. **LinkedIn OAuth**:
   - Create app in LinkedIn Developer Portal
   - Configure redirect URI

### 7. Test the Integration

```bash
# Start the backend
cd backend
npm run dev

# In another terminal, start the frontend
cd ..
npm run dev

# Visit http://localhost:5173
# Try signing up with email or social login
```

## 🔒 Security Best Practices

1. **Environment Variables**:
   ```bash
   # Add to .gitignore
   .env
   .env.local
   .env.*.local
   ```

2. **Key Rotation**:
   - Rotate keys every 90 days
   - Use different keys for dev/staging/production

3. **API Security**:
   - Always validate requests in backend
   - Never trust client-side data
   - Use RLS for additional security

4. **Monitoring**:
   - Enable audit logs in Supabase
   - Monitor failed auth attempts
   - Set up alerts for suspicious activity

## 🐛 Troubleshooting

### Common Issues:

1. **"Invalid API key"**
   - Check if you're using the correct key type
   - Verify the project URL matches

2. **"Permission denied"**
   - Check Row Level Security policies
   - Ensure user is authenticated

3. **"Connection refused"**
   - Verify Supabase project is active
   - Check network/firewall settings

### Debug Commands:

```javascript
// Check if Supabase is connected
const { data, error } = await supabase.auth.getSession();
console.log('Session:', data, 'Error:', error);

// Test database connection
const { data: test } = await supabase.from('students').select('count');
console.log('Database test:', test);
```

## 📚 Next Steps

1. **Complete User Migration**:
   ```bash
   cd backend
   npm run migrate:users
   ```

2. **Set Up Realtime Subscriptions**:
   ```javascript
   // Subscribe to changes
   const subscription = supabase
     .channel('students')
     .on('postgres_changes', 
       { event: '*', schema: 'public', table: 'students' },
       (payload) => console.log('Change:', payload)
     )
     .subscribe();
   ```

3. **Configure Backup Policy**:
   - Enable Point-in-Time Recovery
   - Set up daily backups
   - Test restore procedure

## 🆘 Need Help?

- [Supabase Documentation](https://supabase.com/docs)
- [Discord Community](https://discord.supabase.com)
- [GitHub Discussions](https://github.com/supabase/supabase/discussions)

---

**Remember**: Always keep your secret keys secure and never expose them in client-side code or public repositories!