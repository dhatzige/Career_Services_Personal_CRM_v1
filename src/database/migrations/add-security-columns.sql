-- Add security columns to users table for invitation system

-- Add role column with default 'user'
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('master', 'admin', 'user', 'viewer'));

-- Add is_active column
ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1;

-- Add failed login tracking
ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until DATETIME;

-- Add password management
ALTER TABLE users ADD COLUMN last_password_change DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Add IP tracking
ALTER TABLE users ADD COLUMN last_ip TEXT;

-- Add created_by for tracking who invited the user
ALTER TABLE users ADD COLUMN created_by TEXT REFERENCES users(id);

-- Create user_invitations table
CREATE TABLE IF NOT EXISTS user_invitations (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'viewer')),
    invited_by TEXT NOT NULL REFERENCES users(id),
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT 0,
    used_at DATETIME,
    used_by TEXT REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create security audit log table
CREATE TABLE IF NOT EXISTS security_audit_log (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    event_type TEXT NOT NULL CHECK (event_type IN (
        'login_success', 'login_failed', 'logout', 'password_change',
        'account_locked', 'account_unlocked', 'invitation_sent',
        'invitation_used', 'user_created', 'user_deleted', 'permission_changed',
        'suspicious_activity', 'data_export', 'data_access'
    )),
    details TEXT, -- JSON string
    ip_address TEXT,
    user_agent TEXT,
    risk_score INTEGER DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_expires ON user_invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_security_audit_user ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_type ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_timestamp ON security_audit_log(timestamp);

-- Update the existing user to have master role
UPDATE users 
SET role = 'master',
    is_active = 1
WHERE email = 'dhatzige@act.edu' OR username = 'dhatzige';

-- Verify the update
SELECT id, username, email, role, is_active 
FROM users;