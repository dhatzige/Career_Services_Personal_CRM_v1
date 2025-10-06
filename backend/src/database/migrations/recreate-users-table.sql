-- Recreate users table with security columns
-- This is needed because SQLite has limitations with ALTER TABLE

-- First, rename the existing table
ALTER TABLE users RENAME TO users_old;

-- Create new users table with all columns
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    is_configured INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- New security columns
    role TEXT DEFAULT 'user' CHECK (role IN ('master', 'admin', 'user', 'viewer')),
    is_active INTEGER DEFAULT 1,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until DATETIME,
    last_password_change DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_ip TEXT,
    created_by TEXT REFERENCES users(id)
);

-- Copy data from old table
INSERT INTO users (
    id, username, email, password_hash, salt, 
    is_configured, created_at, last_login, updated_at, 
    role, is_active
)
SELECT 
    id, username, email, password_hash, salt,
    is_configured, created_at, last_login, updated_at,
    'master', -- Set as master for the first user
    1
FROM users_old;

-- Drop old table
DROP TABLE users_old;

-- Create user_invitations table
CREATE TABLE IF NOT EXISTS user_invitations (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'viewer')),
    invited_by TEXT NOT NULL REFERENCES users(id),
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    used INTEGER DEFAULT 0,
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

-- Verify the update
SELECT id, username, email, role, is_active FROM users;