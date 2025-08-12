import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import logger from '../utils/logger';

// Extend Request interface to include user with role
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        username?: string;
        role?: string;
        is_active?: boolean;
      };
    }
  }
}

// Initialize Supabase client with service role key for verification
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('CRITICAL: Supabase configuration missing! Auth will not work.');
  throw new Error('Supabase configuration required');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Middleware to authenticate Supabase JWT tokens
 */
export const authenticateSupabaseToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required'
      });
      return;
    }

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.error('Supabase auth error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
      return;
    }

    // Get user role from database
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('id, email, role, is_active')
      .eq('id', user.id)
      .single();

    if (dbError || !dbUser) {
      // If user doesn't exist in our users table, create them with default role
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email!,
          role: 'user',
          is_active: true
        })
        .select()
        .single();

      if (createError) {
        logger.error('Failed to create user record', { error: createError });
        res.status(500).json({
          success: false,
          message: 'Failed to initialize user account'
        });
        return;
      }

      req.user = {
        id: newUser.id,
        email: newUser.email,
        username: newUser.email.split('@')[0],
        role: newUser.role,
        is_active: newUser.is_active
      };
    } else {
      // Check if user is active
      if (!dbUser.is_active) {
        res.status(403).json({
          success: false,
          message: 'Account is deactivated'
        });
        return;
      }

      req.user = {
        id: dbUser.id,
        email: dbUser.email,
        username: dbUser.email.split('@')[0],
        role: dbUser.role,
        is_active: dbUser.is_active
      };
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Alias for backwards compatibility
 */
export const requireAuth = authenticateSupabaseToken;

/**
 * Middleware to require specific roles
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!req.user.role || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export const optionalSupabaseAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        // Get user role from database
        const { data: dbUser } = await supabase
          .from('users')
          .select('id, email, role, is_active')
          .eq('id', user.id)
          .single();

        if (dbUser && dbUser.is_active) {
          req.user = {
            id: dbUser.id,
            email: dbUser.email,
            username: dbUser.email.split('@')[0],
            role: dbUser.role,
            is_active: dbUser.is_active
          };
        }
      }
    }

    next();
  } catch (error) {
    // Don't fail on error, just continue without user
    next();
  }
};

export { supabase };