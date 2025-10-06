import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { supabase } from '../middleware/supabaseAuth';
import { handleValidationErrors } from '../middleware/security';
import logger from '../utils/logger';

const router = Router();

// Check invitation token validity
router.post('/auth/check-invitation',
  [body('token').isString().isLength({ min: 32 })],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      
      // Check if invitation exists and is valid
      const { data: invitation, error } = await supabase
        .from('user_invitations')
        .select('email, role, expires_at, used')
        .eq('token', token)
        .single();
      
      if (error || !invitation) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired invitation'
        });
        return;
      }
      
      // Check if already used
      if (invitation.used) {
        res.status(400).json({
          success: false,
          message: 'This invitation has already been used'
        });
        return;
      }
      
      // Check if expired
      if (new Date(invitation.expires_at) < new Date()) {
        res.status(400).json({
          success: false,
          message: 'This invitation has expired'
        });
        return;
      }
      
      res.json({
        success: true,
        data: {
          email: invitation.email,
          role: invitation.role,
          expires_at: invitation.expires_at
        }
      });
    } catch (error) {
      logger.error('Failed to check invitation', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to verify invitation'
      });
    }
  }
);

// Register with invitation token
router.post('/auth/register',
  [
    body('token').isString().isLength({ min: 32 }),
    body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
    body('password').isString().isLength({ min: 8 })
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { token, email, password } = req.body;
      
      // Verify invitation again
      const { data: invitation, error: invError } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('token', token)
        .eq('email', email)
        .single();
      
      if (invError || !invitation) {
        res.status(400).json({
          success: false,
          message: 'Invalid invitation'
        });
        return;
      }
      
      if (invitation.used) {
        res.status(400).json({
          success: false,
          message: 'Invitation already used'
        });
        return;
      }
      
      if (new Date(invitation.expires_at) < new Date()) {
        res.status(400).json({
          success: false,
          message: 'Invitation expired'
        });
        return;
      }
      
      // Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true // Auto-confirm email since they have invitation
      });
      
      if (authError) {
        if (authError.message?.includes('already registered')) {
          res.status(400).json({
            success: false,
            message: 'User already exists'
          });
          return;
        }
        throw authError;
      }
      
      if (!authData.user) {
        throw new Error('Failed to create auth user');
      }
      
      // Create user in our users table
      const { error: dbError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: email,
          role: invitation.role,
          is_active: true,
          created_by: invitation.invited_by
        });
      
      if (dbError) {
        // Rollback auth user creation if database insert fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw dbError;
      }
      
      // Mark invitation as used
      await supabase
        .from('user_invitations')
        .update({
          used: true,
          used_at: new Date().toISOString(),
          used_by: authData.user.id
        })
        .eq('id', invitation.id);
      
      res.json({
        success: true,
        message: 'Registration successful! Please login with your new account.',
        data: {
          email,
          role: invitation.role
        }
      });
    } catch (error) {
      logger.error('Registration failed', { error });
      res.status(500).json({
        success: false,
        message: 'Registration failed'
      });
    }
  }
);

export default router;