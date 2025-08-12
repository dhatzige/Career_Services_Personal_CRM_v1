# Authentication Guide - Career Services CRM
## Version 0.12.0 - Supabase-Only Authentication

## 🔐 Overview

The Career Services CRM uses **Supabase exclusively** for authentication. There is no legacy SQLite authentication - all auth operations go through Supabase for maximum security.

## 🏗️ Architecture

```
User Login/Register
        ↓
CleanSupabaseAuth.tsx (Frontend)
        ↓
Supabase Auth Service
        ↓
JWT Token Generation
        ↓
supabaseAuth.ts (Backend Middleware)
        ↓
Role-Based Access Control
```

## 👤 User Roles

### Master (Highest Level)
- **Capability**: Full system control
- **Permissions**: 
  - All admin permissions
  - Delete users
  - Modify system settings
  - Access all data
- **Default User**: dhatzige@act.edu

### Admin
- **Capability**: Team management
- **Permissions**:
  - Send invitations
  - Activate/deactivate users
  - View all students
  - Generate reports

### User
- **Capability**: Standard access
- **Permissions**:
  - View and edit students
  - Create consultations
  - Add notes
  - View reports

### Viewer
- **Capability**: Read-only access
- **Permissions**:
  - View students
  - View consultations
  - View reports
  - No editing capabilities

## 🎫 Authentication Flow

### 1. Login Process
```typescript
// Frontend: CleanSupabaseAuth.tsx
const signIn = async (email: string, password: string) => {
  // Normalize Gmail addresses
  let normalizedEmail = email.toLowerCase();
  if (normalizedEmail.endsWith('@gmail.com')) {
    const [localPart, domain] = normalizedEmail.split('@');
    normalizedEmail = localPart.replace(/\./g, '') + '@' + domain;
  }
  
  // Authenticate with Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password
  });
};
```

### 2. Registration Process (Invite-Only)

#### Step 1: Admin sends invitation
```typescript
// POST /api/team/invite
{
  "email": "newuser@example.com",
  "role": "user"
}
```

#### Step 2: User receives email with token
```
Subject: Invitation to Career Services CRM

You've been invited to join the Career Services CRM.
Click here to complete registration:
http://localhost:5173/register?token=abc123...
```

#### Step 3: User completes registration
```typescript
// POST /api/auth/register
{
  "token": "abc123...",
  "email": "newuser@example.com",
  "password": "SecurePassword123!"
}
```

### 3. JWT Token Management

```typescript
// Backend: supabaseAuth.ts
export const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  // Verify with Supabase
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  // Get user details including role
  const { data: dbUser } = await supabase
    .from('users')
    .select('id, email, role, is_active')
    .eq('id', user.id)
    .single();
    
  req.user = dbUser;
  next();
};
```

## 📧 Email Normalization

### Gmail Handling
Gmail ignores dots in email addresses. Our system normalizes these:
- `john.doe@gmail.com` → `johndoe@gmail.com`
- `j.o.h.n.d.o.e@gmail.com` → `johndoe@gmail.com`

```typescript
// Normalization function
const normalizeGmailEmail = (email: string): string => {
  if (email.endsWith('@gmail.com')) {
    const [localPart, domain] = email.split('@');
    return localPart.replace(/\./g, '') + '@' + domain;
  }
  return email;
};
```

## 🛡️ Security Features

### 1. No Public Registration
- Registration is **invite-only**
- No public signup endpoints
- Invitations expire after 7 days

### 2. Token Security
- JWT tokens with expiration
- Refresh token rotation
- Secure httpOnly cookies (production)

### 3. Role Verification
```typescript
// Middleware for role checking
export const requireRole = (allowedRoles: string[]) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions' 
      });
    }
    next();
  };
};
```

## 🔧 Configuration

### Environment Variables
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# JWT Configuration
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Supabase Setup

1. **Enable Email Auth** in Supabase Dashboard
2. **Disable Sign Ups** to prevent public registration
3. **Configure Email Templates** for invitations
4. **Set up Row Level Security (RLS)**:

```sql
-- Users can only see their own data
CREATE POLICY "Users can view own record" ON users
  FOR SELECT USING (auth.uid() = id);

-- Only admins can view all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'master')
    )
  );
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Complete registration (requires token)
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/check-invitation` - Verify invitation token

### Team Management (Admin/Master only)
- `GET /api/team/members` - List all team members
- `POST /api/team/invite` - Send invitation
- `PUT /api/team/users/:id/status` - Activate/deactivate user
- `DELETE /api/team/users/:id` - Delete user (master only)

## 🚨 Common Issues & Solutions

### Issue: Gmail users can't login
**Solution**: Ensure email normalization is working:
```typescript
// Check both with and without dots
const normalized = normalizeGmailEmail(email);
```

### Issue: "Invalid token" error
**Solution**: Check token expiration and refresh:
```typescript
// Frontend: Auto-refresh tokens
useEffect(() => {
  const interval = setInterval(async () => {
    await supabase.auth.refreshSession();
  }, 30 * 60 * 1000); // Every 30 minutes
  
  return () => clearInterval(interval);
}, []);
```

### Issue: User can't access certain features
**Solution**: Verify role permissions:
```typescript
// Check user role in frontend
const canDelete = user?.role === 'master';
const canInvite = ['master', 'admin'].includes(user?.role);
```

## 🔄 Migration from Legacy Auth

If migrating from an older version with SQLite auth:

1. **Export existing users** from SQLite
2. **Create Supabase accounts** for each user
3. **Send password reset emails** to all users
4. **Remove legacy auth code**:
   - Delete `/backend/src/routes/auth.ts` (old version)
   - Delete `/backend/src/middleware/auth.ts` (old version)
   - Remove auth tables from SQLite

## 📊 Monitoring & Debugging

### Check Authentication Status
```typescript
// Frontend console
supabase.auth.getUser().then(console.log);

// Backend logging
console.log('Auth user:', req.user);
```

### Common Debug Points
1. Check Supabase logs in dashboard
2. Verify JWT token in browser DevTools
3. Check network requests for auth headers
4. Review backend auth middleware logs

## 🎯 Best Practices

1. **Always use Supabase for auth** - Never bypass
2. **Normalize emails consistently** - Especially Gmail
3. **Check roles on both frontend and backend**
4. **Use environment variables** - Never hardcode keys
5. **Implement proper error handling** - User-friendly messages
6. **Regular token refresh** - Prevent expired sessions
7. **Audit user actions** - Log important operations

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

*Last Updated: August 12, 2025*
*Version: 0.12.0*