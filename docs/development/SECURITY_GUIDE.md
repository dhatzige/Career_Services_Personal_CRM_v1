# Security Configuration Guide

This guide explains the security features implemented in the Career Services CRM to protect sensitive university student data.

## Overview

The system implements a multi-layered security approach:
- **Invite-only registration** - No public sign-ups allowed
- **Master account control** - Single admin with full control
- **Role-based access** - Master, Admin, User, and Viewer roles
- **Comprehensive audit logging** - All actions are tracked
- **Advanced threat protection** - Bot detection, rate limiting, IP filtering

## Initial Setup

### 1. Disable Public Registration in Supabase

**CRITICAL: This must be done immediately after creating your Supabase project**

1. Log into [Supabase Dashboard](https://app.supabase.com)
2. Go to **Authentication → Settings**
3. Under **User Signups**, disable "Enable email signups"
4. Save changes

### 2. Run Security Migration

Execute the security migration to set up the enhanced security tables:

```bash
# In Supabase SQL Editor, run:
/backend/src/database/security-migration.sql
```

### 3. Set Up Master Account

After creating your first account:

```sql
-- Replace with your email
UPDATE users 
SET role = 'master' 
WHERE email = 'dhatzige@act.edu';
```

### 4. Configure Environment Variables

Update your `.env` files with security settings:

```env
# Backend .env
ALLOWED_ORIGINS=https://yourdomain.com
SESSION_SECRET=generate-a-strong-secret-here
JWT_SECRET=another-strong-secret-here
CSRF_SECRET=yet-another-strong-secret

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security headers
ENFORCE_HTTPS=true
```

## Security Features

### 1. Authentication & Authorization

#### Invite-Only System
- Only users with valid invitation tokens can register
- Invitations expire after configurable time (default: 7 days)
- Each invitation is single-use
- Master/Admin users can create invitations

#### Role Hierarchy
1. **Master** - Full system control, cannot be deleted or deactivated
2. **Admin** - User management, cannot modify master account
3. **User** - Standard access to student data
4. **Viewer** - Read-only access

### 2. Account Security

#### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

#### Account Lockout
- 5 failed login attempts trigger 30-minute lockout
- Master/Admin can manually unlock accounts
- All failed attempts are logged

#### Session Management
- JWT tokens expire after 24 hours
- Refresh tokens for seamless re-authentication
- Sessions tracked with IP addresses

### 3. Data Protection

#### Row Level Security (RLS)
All database tables have RLS policies:
- Students: Role-based access control
- Notes: Private notes only visible to creator
- Audit logs: Only master can view

#### Input Sanitization
- XSS protection on all inputs
- SQL injection prevention via parameterized queries
- File upload restrictions

### 4. Threat Protection

#### Rate Limiting
Different limits for different endpoints:
- Authentication: 5 attempts per 15 minutes
- API calls: 100 requests per 15 minutes
- Sensitive operations: 10 requests per hour

#### Bot Detection
Automatic blocking of:
- Known bot user agents
- Automated tools (curl, wget, etc.)
- Suspicious patterns

#### IP Filtering (Optional)
- Whitelist specific IP addresses per user
- Automatic blocking of non-whitelisted IPs
- Useful for high-security environments

### 5. Audit Logging

All security events are logged:
- Login attempts (success/failure)
- User creation/deletion
- Permission changes
- Data access
- Suspicious activities

Each log entry includes:
- User ID
- Event type
- IP address
- User agent
- Timestamp
- Risk score (0-10)

## User Management

### Creating Users

1. Master/Admin creates invitation:
```javascript
POST /api/invitations
{
  "email": "newuser@university.edu",
  "role": "user",
  "expiresInDays": 7
}
```

2. Send invitation URL to user
3. User registers with invitation token
4. Account automatically activated

### Managing Users

#### View All Users (Master/Admin)
```javascript
GET /api/users
```

#### Change User Role (Master only)
```javascript
PATCH /api/users/:id/role
{
  "role": "admin"
}
```

#### Deactivate User (Master/Admin)
```javascript
PATCH /api/users/:id/status
{
  "is_active": false
}
```

#### Delete User (Master only)
```javascript
DELETE /api/users/:id
```

## Security Best Practices

### 1. Regular Security Reviews
- Review audit logs weekly
- Check for suspicious patterns
- Monitor failed login attempts
- Review active user list

### 2. Access Control
- Follow principle of least privilege
- Only grant admin role when necessary
- Regularly review user permissions
- Remove inactive users

### 3. Data Handling
- Never log sensitive data
- Encrypt data at rest (handled by Supabase)
- Use HTTPS for all communications
- Regular backups

### 4. Incident Response
1. Detect suspicious activity in audit logs
2. Lock affected accounts immediately
3. Review audit trail for breach extent
4. Reset passwords if necessary
5. Document incident

## Monitoring & Alerts

### Security Dashboard (Master only)
- Real-time security events
- Failed login patterns
- High-risk activities
- User activity summary

### Automated Alerts
Configure alerts for:
- Multiple failed login attempts
- Unauthorized access attempts
- High risk score events
- Account lockouts

## API Security Endpoints

### Authentication
- `POST /api/auth/check-invitation` - Verify invitation token
- `POST /api/auth/register` - Register with invitation
- `POST /api/auth/login` - Secure login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user info

### User Management
- `GET /api/users` - List users
- `GET /api/users/:id` - User details
- `PATCH /api/users/:id/role` - Update role
- `PATCH /api/users/:id/status` - Activate/deactivate
- `DELETE /api/users/:id` - Delete user

### Invitations
- `GET /api/invitations` - List invitations
- `POST /api/invitations` - Create invitation
- `DELETE /api/invitations/:id` - Revoke invitation

### Security
- `GET /api/security/audit-logs` - View audit logs
- `GET /api/invitations/stats` - Invitation statistics

## Compliance

This system is designed to meet:
- FERPA requirements for student data protection
- GDPR compliance for EU students
- SOC 2 security standards
- University data protection policies

## Emergency Procedures

### Suspected Breach
1. Lock all accounts except master
2. Review audit logs for breach timeline
3. Export affected data list
4. Reset all passwords
5. Notify affected users

### Lost Master Access
1. Access Supabase dashboard directly
2. Reset master account password
3. Review recent account activity
4. Update security credentials

### System Lockdown
```sql
-- Emergency lockdown (run in Supabase)
UPDATE users 
SET is_active = false 
WHERE role != 'master';
```

## Support

For security concerns or questions:
1. Review audit logs first
2. Check this documentation
3. Contact system administrator
4. For emergencies, use Supabase dashboard

Remember: Security is everyone's responsibility. Report any suspicious activity immediately.