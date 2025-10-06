-- Set Master User Role Migration
-- Run this after logging in with your primary account to grant master privileges

-- Update the master user to have master role
-- This user will be able to invite other users and manage the system
-- IMPORTANT: Replace 'master@example.com' with your actual master user email
UPDATE users 
SET role = 'master' 
WHERE email = 'master@example.com';

-- Verify the update
SELECT id, email, role, is_active 
FROM users 
WHERE email = 'master@example.com';

-- Check all users and their roles
SELECT id, email, role, is_active, created_at 
FROM users 
ORDER BY created_at;