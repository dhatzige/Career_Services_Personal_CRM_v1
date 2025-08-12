-- Set Master User Role Migration
-- Run this after logging in with your primary account to grant master privileges

-- Update the first user (dhatzige@act.edu) to have master role
-- This user will be able to invite other users and manage the system
UPDATE users 
SET role = 'master' 
WHERE email = 'dhatzige@act.edu';

-- Verify the update
SELECT id, email, role, is_active 
FROM users 
WHERE email = 'dhatzige@act.edu';

-- Check all users and their roles
SELECT id, email, role, is_active, created_at 
FROM users 
ORDER BY created_at;