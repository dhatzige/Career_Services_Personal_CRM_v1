import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { requireAuth, requireRole, supabase } from '../middleware/supabaseAuth';
import { handleValidationErrors } from '../middleware/security';
import { secureConfig } from '../utils/secureConfig';
import crypto from 'crypto';
import logger from '../utils/logger';

const router = Router();

// Get all users (master/admin only)
router.get('/users',
  requireAuth,
  requireRole(['master', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, role, is_active, created_at, last_login, created_by')
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json({
        success: true,
        users: users || []
      });
      return;
    } catch (error) {
      logger.error('Failed to fetch users', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users'
      });
      return;
    }
  }
);

// Get all invitations (master/admin only)
router.get('/invitations',
  requireAuth,
  requireRole(['master', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const { data: invitations, error } = await supabase
        .from('user_invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Add invitation URLs using canonical frontend URL
      const invitationsWithUrls = invitations?.map(inv => ({
        ...inv,
        invitation_url: `${secureConfig.getFrontendUrl()}/register?token=${inv.token}`
      })) || [];

      res.json({
        success: true,
        data: invitationsWithUrls
      });
      return;
    } catch (error) {
      logger.error('Failed to fetch invitations', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch invitations'
      });
      return;
    }
  }
);

// Get invitation stats (master/admin only)
router.get('/invitations/stats',
  requireAuth,
  requireRole(['master', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const { data: invitations, error } = await supabase
        .from('user_invitations')
        .select('used, expires_at');

      if (error) throw error;

      const now = new Date();
      const stats = {
        total: invitations?.length || 0,
        active: 0,
        used: 0,
        expired: 0
      };

      invitations?.forEach(inv => {
        if (inv.used) {
          stats.used++;
        } else if (new Date(inv.expires_at) < now) {
          stats.expired++;
        } else {
          stats.active++;
        }
      });

      res.json({
        success: true,
        data: stats
      });
      return;
    } catch (error) {
      logger.error('Failed to fetch invitation stats', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch invitation statistics'
      });
      return;
    }
  }
);

// Create invitation (master/admin only)
router.post('/invitations',
  requireAuth,
  requireRole(['master', 'admin']),
  [
    body('email').isEmail().normalizeEmail(),
    body('role').isIn(['admin', 'user', 'viewer']),
    body('expiresInDays').optional().isInt({ min: 1, max: 90 }).default(7)
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { email, role, expiresInDays } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      // Check if user's role allows them to invite this role
      const { data: inviter } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (!inviter) {
        res.status(403).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Only master can invite admins
      if (role === 'admin' && inviter.role !== 'master') {
        res.status(403).json({
          success: false,
          message: 'Only master users can invite administrators'
        });
        return;
      }

      // Check if email already has an active invitation
      const { data: existingInvite } = await supabase
        .from('user_invitations')
        .select('id')
        .eq('email', email)
        .eq('used', false)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (existingInvite) {
        res.status(400).json({
          success: false,
          message: 'An active invitation already exists for this email'
        });
        return;
      }

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'User already exists with this email'
        });
        return;
      }

      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex');
      
      // Calculate expiration
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      // Create invitation
      const { data: invitation, error } = await supabase
        .from('user_invitations')
        .insert({
          email,
          role,
          invited_by: userId,
          token,
          expires_at: expiresAt.toISOString(),
          used: false
        })
        .select()
        .single();

      if (error) throw error;

      // TODO: Send invitation email using your email service
      // For now, just return the invitation URL using canonical frontend URL
      const invitationUrl = `${secureConfig.getFrontendUrl()}/register?token=${token}`;

      res.json({
        success: true,
        message: 'Invitation created successfully',
        data: {
          ...invitation,
          invitation_url: invitationUrl
        }
      });
      return;
    } catch (error) {
      logger.error('Failed to create invitation', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to create invitation'
      });
      return;
    }
  }
);

// Revoke invitation (master/admin only)
router.delete('/invitations/:id',
  requireAuth,
  requireRole(['master', 'admin']),
  [param('id').isUUID()],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Check if invitation exists and is not used
      const { data: invitation } = await supabase
        .from('user_invitations')
        .select('used')
        .eq('id', id)
        .single();

      if (!invitation) {
        res.status(404).json({
          success: false,
          message: 'Invitation not found'
        });
        return;
      }

      if (invitation.used) {
        res.status(400).json({
          success: false,
          message: 'Cannot revoke an already used invitation'
        });
        return;
      }

      // Delete invitation
      const { error } = await supabase
        .from('user_invitations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.json({
        success: true,
        message: 'Invitation revoked successfully'
      });
      return;
    } catch (error) {
      logger.error('Failed to revoke invitation', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to revoke invitation'
      });
      return;
    }
  }
);

// Toggle user status (master/admin only)
router.patch('/users/:id/status',
  requireAuth,
  requireRole(['master', 'admin']),
  [
    param('id').isUUID(),
    body('is_active').isBoolean()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { is_active } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      // Check target user
      const { data: targetUser } = await supabase
        .from('users')
        .select('role, email')
        .eq('id', id)
        .single();

      if (!targetUser) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Check permissions
      const { data: currentUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (!currentUser) {
        res.status(403).json({
          success: false,
          message: 'Current user not found'
        });
        return;
      }

      // Can't modify master users
      if (targetUser.role === 'master') {
        res.status(403).json({
          success: false,
          message: 'Cannot modify master users'
        });
        return;
      }

      // Admins can't modify other admins
      if (currentUser.role === 'admin' && targetUser.role === 'admin') {
        res.status(403).json({
          success: false,
          message: 'Administrators cannot modify other administrators'
        });
        return;
      }

      // Update user status
      const { error } = await supabase
        .from('users')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;

      res.json({
        success: true,
        message: `User ${is_active ? 'activated' : 'deactivated'} successfully`
      });
      return;
    } catch (error) {
      logger.error('Failed to update user status', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to update user status'
      });
      return;
    }
  }
);

// Change user role (master only)
router.patch('/users/:id/role',
  requireAuth,
  requireRole(['master']),
  [
    param('id').isUUID(),
    body('role').isIn(['admin', 'user', 'viewer'])
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      // Check if user exists
      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', id)
        .single();

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Can't change master role
      if (user.role === 'master') {
        res.status(403).json({
          success: false,
          message: 'Cannot change master user role'
        });
        return;
      }

      // Update role
      const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', id);

      if (error) throw error;

      res.json({
        success: true,
        message: 'User role updated successfully'
      });
      return;
    } catch (error) {
      logger.error('Failed to update user role', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to update user role'
      });
      return;
    }
  }
);

// Delete user (master only)
router.delete('/users/:id',
  requireAuth,
  requireRole(['master']),
  async (req: Request, res: Response) => {
    try {
      const { id: targetUserId } = req.params;
      const userId = (req as any).user.id;

      // Prevent self-deletion
      if (targetUserId === userId) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete your own account'
        });
        return;
      }

      // Check if target user exists
      const { data: targetUser } = await supabase
        .from('users')
        .select('email, role')
        .eq('id', targetUserId)
        .single();

      if (!targetUser) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Prevent deletion of other master users
      if (targetUser.role === 'master') {
        res.status(403).json({
          success: false,
          message: 'Cannot delete another master user'
        });
        return;
      }

      // Clear any invitation references
      await supabase
        .from('user_invitations')
        .update({ used_by: null })
        .eq('used_by', targetUserId);

      // Delete from users table
      const { error: deleteUserError } = await supabase
        .from('users')
        .delete()
        .eq('id', targetUserId);

      if (deleteUserError) throw deleteUserError;

      // Delete from auth.users
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(targetUserId);

      if (deleteAuthError) {
        // Log the error but don't fail if auth deletion fails
        logger.error('Failed to delete auth user', { error: deleteAuthError });
      }

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      logger.error('Failed to delete user', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to delete user'
      });
    }
  }
);

export default router;