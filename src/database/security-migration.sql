-- Security Enhancement Migration for Career Services CRM
-- This implements invite-only registration and enhanced security

-- Disable public sign-ups in Supabase Auth (this must be done in Supabase dashboard)
-- Go to Authentication > Settings > User Signups and disable "Enable email signups"

-- Create invitations table
CREATE TABLE IF NOT EXISTS user_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'viewer')),
    invited_by UUID NOT NULL REFERENCES users(id),
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    used_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add security fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('master', 'admin', 'user', 'viewer')),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
ADD COLUMN IF NOT EXISTS session_token TEXT,
ADD COLUMN IF NOT EXISTS session_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ip_whitelist JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS last_ip INET,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Create audit log for security events
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    event_type TEXT NOT NULL CHECK (event_type IN (
        'login_success', 'login_failed', 'logout', 'password_change',
        'account_locked', 'account_unlocked', 'invitation_sent',
        'invitation_used', 'user_created', 'user_deleted', 'permission_changed',
        'suspicious_activity', 'data_export', 'data_access'
    )),
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    risk_score INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for rate limiting
CREATE TABLE IF NOT EXISTS rate_limit_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier TEXT NOT NULL, -- IP address or user ID
    action TEXT NOT NULL,
    attempts INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    blocked_until TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_expires ON user_invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_security_audit_user ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_type ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_timestamp ON security_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier ON rate_limit_tracking(identifier, action);

-- Enable RLS on new tables
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_tracking ENABLE ROW LEVEL SECURITY;

-- Drop existing user policies to recreate with better security
DROP POLICY IF EXISTS "Authenticated users can view students" ON students;
DROP POLICY IF EXISTS "View notes policy" ON notes;
DROP POLICY IF EXISTS "Create notes policy" ON notes;
DROP POLICY IF EXISTS "Update notes policy" ON notes;

-- Enhanced RLS Policies

-- Users table: Only master/admin can view all users
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::uuid = id);

CREATE POLICY "Master and admin can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::uuid 
            AND role IN ('master', 'admin')
            AND is_active = true
        )
    );

CREATE POLICY "Only master can create users" ON users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::uuid 
            AND role = 'master'
            AND is_active = true
        )
    );

CREATE POLICY "Master can update any user" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::uuid 
            AND role = 'master'
            AND is_active = true
        )
    );

CREATE POLICY "Users can update own non-critical fields" ON users
    FOR UPDATE USING (
        auth.uid()::uuid = id
        AND NOT (role IS DISTINCT FROM OLD.role)
        AND NOT (is_active IS DISTINCT FROM OLD.is_active)
    );

-- Students table: Role-based access
CREATE POLICY "Active users can view students" ON students
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::uuid 
            AND is_active = true
            AND role IN ('master', 'admin', 'user')
        )
    );

CREATE POLICY "Only admin and master can create students" ON students
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::uuid 
            AND is_active = true
            AND role IN ('master', 'admin')
        )
    );

CREATE POLICY "Admin and master can update students" ON students
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::uuid 
            AND is_active = true
            AND role IN ('master', 'admin')
        )
    );

CREATE POLICY "Only master can delete students" ON students
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::uuid 
            AND is_active = true
            AND role = 'master'
        )
    );

-- Notes: Enhanced privacy
CREATE POLICY "Users can view non-private notes" ON notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::uuid 
            AND is_active = true
        )
        AND (
            is_private = false 
            OR created_by = auth.uid()::uuid
            OR EXISTS (
                SELECT 1 FROM users 
                WHERE id = auth.uid()::uuid 
                AND role IN ('master', 'admin')
            )
        )
    );

CREATE POLICY "Active users can create notes" ON notes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::uuid 
            AND is_active = true
            AND role IN ('master', 'admin', 'user')
        )
    );

-- Invitations: Only master/admin can manage
CREATE POLICY "Master and admin can view invitations" ON user_invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::uuid 
            AND role IN ('master', 'admin')
            AND is_active = true
        )
    );

CREATE POLICY "Master and admin can create invitations" ON user_invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::uuid 
            AND role IN ('master', 'admin')
            AND is_active = true
        )
    );

-- Security audit log: Only master can view
CREATE POLICY "Only master can view audit log" ON security_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::uuid 
            AND role = 'master'
            AND is_active = true
        )
    );

-- Service role can always insert audit logs
CREATE POLICY "Service role can insert audit logs" ON security_audit_log
    FOR INSERT WITH CHECK (true);

-- Rate limiting: Service role only
CREATE POLICY "Service role manages rate limits" ON rate_limit_tracking
    FOR ALL USING (auth.role() = 'service_role');

-- Create function to check if user can access system
CREATE OR REPLACE FUNCTION check_user_access(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_id 
        AND is_active = true
        AND (locked_until IS NULL OR locked_until < NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_details JSONB DEFAULT '{}',
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_risk_score INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO security_audit_log (
        user_id, event_type, details, ip_address, 
        user_agent, risk_score
    ) VALUES (
        p_user_id, p_event_type, p_details, p_ip_address,
        p_user_agent, p_risk_score
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle failed login attempts
CREATE OR REPLACE FUNCTION handle_failed_login(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_attempts INTEGER;
    v_lockout_threshold INTEGER := 5;
    v_lockout_duration INTERVAL := '30 minutes';
BEGIN
    UPDATE users 
    SET failed_login_attempts = failed_login_attempts + 1
    WHERE id = p_user_id
    RETURNING failed_login_attempts INTO v_attempts;
    
    IF v_attempts >= v_lockout_threshold THEN
        UPDATE users 
        SET locked_until = NOW() + v_lockout_duration
        WHERE id = p_user_id;
        
        PERFORM log_security_event(
            p_user_id, 
            'account_locked',
            jsonb_build_object('reason', 'too_many_failed_attempts', 'attempts', v_attempts)
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to reset failed login attempts
CREATE OR REPLACE FUNCTION reset_failed_login_attempts(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE users 
    SET failed_login_attempts = 0,
        locked_until = NULL
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set up the master account (replace with your actual user ID after first login)
-- This should be run after you create your first account
-- UPDATE users SET role = 'master' WHERE email = 'dhatzige@act.edu';