import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { doubleCsrf } from 'csrf-csrf';
import mongoSanitize from 'express-mongo-sanitize';

// Extend Express Request type
declare module 'express' {
  interface Request {
    sessionID?: string;
    session?: any;
    file?: any;
    files?: any[];
  }
}

// CSRF Protection Setup
const { invalidCsrfTokenError, generateCsrfToken, validateRequest, doubleCsrfProtection }: any = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'super-secret-csrf-key-change-in-production',
  cookieName: 'psifi.x-csrf-token',
  cookieOptions: {
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token'] as string,
  getSessionIdentifier: (req) => req.sessionID || req.ip || 'anonymous',
});

// Input sanitization middleware
export const sanitizeInput = mongoSanitize({
  allowDots: true,
  replaceWith: '_'
});

// Validation error handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
    return;
  }
  next();
};

// Password complexity validator
export const validatePasswordComplexity = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Session configuration
export const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict' as const
  }
};

// Account lockout tracking
const failedAttempts = new Map<string, { count: number; firstAttempt: Date }>();
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export const checkAccountLockout = (username: string): { locked: boolean; remainingTime?: number } => {
  const attempts = failedAttempts.get(username);
  
  if (!attempts) {
    return { locked: false };
  }
  
  const timePassed = Date.now() - attempts.firstAttempt.getTime();
  
  if (attempts.count >= LOCKOUT_THRESHOLD && timePassed < LOCKOUT_DURATION) {
    return {
      locked: true,
      remainingTime: Math.ceil((LOCKOUT_DURATION - timePassed) / 1000 / 60) // minutes
    };
  }
  
  if (timePassed >= LOCKOUT_DURATION) {
    failedAttempts.delete(username);
  }
  
  return { locked: false };
};

export const recordFailedAttempt = (username: string): void => {
  const attempts = failedAttempts.get(username);
  
  if (!attempts) {
    failedAttempts.set(username, { count: 1, firstAttempt: new Date() });
  } else {
    attempts.count++;
  }
};

export const clearFailedAttempts = (username: string): void => {
  failedAttempts.delete(username);
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Additional security headers not covered by helmet
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
};

// File upload validation
export const validateFileUpload = (
  allowedTypes: string[],
  maxSize: number
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.file) {
      next();
      return;
    }
    
    // Check file type
    if (!allowedTypes.includes(req.file.mimetype)) {
      res.status(400).json({
        success: false,
        message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      });
      return;
    }
    
    // Check file size
    if (req.file.size > maxSize) {
      res.status(400).json({
        success: false,
        message: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`
      });
      return;
    }
    
    next();
  };
};

// Audit logging
export interface AuditLog {
  userId?: string;
  username?: string;
  action: string;
  resource: string;
  resourceId?: string;
  timestamp: Date;
  ip: string;
  userAgent: string;
  success: boolean;
  details?: any;
}

const auditLogs: AuditLog[] = [];

export const logAuditEvent = (req: Request & { user?: any }, action: string, resource: string, success: boolean, details?: any): void => {
  const log: AuditLog = {
    userId: req.user?.id,
    username: req.user?.username,
    action,
    resource,
    resourceId: req.params.id,
    timestamp: new Date(),
    ip: req.ip || 'unknown',
    userAgent: req.get('user-agent') || 'unknown',
    success,
    details
  };
  
  auditLogs.push(log);
  
  // In production, this should write to a database or external service
  console.log('AUDIT:', JSON.stringify(log));
};

export const getAuditLogs = (filters?: { userId?: string; action?: string; resource?: string; limit?: number }): AuditLog[] => {
  let logs = [...auditLogs];
  
  if (filters?.userId) {
    logs = logs.filter(log => log.userId === filters.userId);
  }
  
  if (filters?.action) {
    logs = logs.filter(log => log.action === filters.action);
  }
  
  if (filters?.resource) {
    logs = logs.filter(log => log.resource === filters.resource);
  }
  
  // Sort by timestamp descending
  logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  
  if (filters?.limit) {
    logs = logs.slice(0, filters.limit);
  }
  
  return logs;
};

// Export CSRF middleware
export { generateCsrfToken as generateCSRFToken, doubleCsrfProtection, invalidCsrfTokenError, validateRequest };