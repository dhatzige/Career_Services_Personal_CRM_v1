import { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import { logError, logWarn } from '../utils/monitoring';

// Custom error class for API errors
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  details?: any;

  constructor(
    statusCode: number,
    message: string,
    isOperational = true,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common API errors
export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(400, message, true, details);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, message, true);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(403, message, true);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(404, message, true);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, details?: any) {
    super(409, message, true, details);
  }
}

export class TooManyRequestsError extends ApiError {
  constructor(message = 'Too many requests') {
    super(429, message, true);
  }
}

export class InternalServerError extends ApiError {
  constructor(message = 'Internal server error', details?: any) {
    super(500, message, false, details);
  }
}

// Database constraint error handler
export function handleDatabaseError(error: any): ApiError {
  // SQLite constraint errors
  if (error.code === 'SQLITE_CONSTRAINT') {
    if (error.message.includes('UNIQUE')) {
      return new ConflictError('Resource already exists', { field: error.message });
    }
    if (error.message.includes('FOREIGN KEY')) {
      return new ValidationError('Invalid reference', { field: error.message });
    }
    return new ValidationError('Database constraint violation', { message: error.message });
  }

  // Supabase errors
  if (error.code === '23505') { // Unique violation
    return new ConflictError('Resource already exists');
  }
  if (error.code === '23503') { // Foreign key violation
    return new ValidationError('Invalid reference');
  }
  if (error.code === '23502') { // Not null violation
    return new ValidationError('Required field missing');
  }
  if (error.code === 'PGRST116') { // No rows found
    return new NotFoundError();
  }

  // Default database error
  return new InternalServerError('Database operation failed', { 
    code: error.code, 
    message: error.message 
  });
}

// Async error wrapper
export const asyncHandler = (fn: Function) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Main error handling middleware
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;

  // Convert non-ApiError instances
  if (!(error instanceof ApiError)) {
    const statusCode = (error as any).statusCode || 500;
    const message = error.message || 'Internal server error';
    error = new ApiError(statusCode, message, false);
  }

  const apiError = error as ApiError;

  // Log error
  if (apiError.statusCode >= 500) {
    logError('API Error', { 
      error: apiError.message,
      stack: apiError.stack,
      url: req.url,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
      user: (req as any).user?.id
    });
  } else if (apiError.statusCode >= 400) {
    logWarn('Client Error', { 
      message: apiError.message,
      statusCode: apiError.statusCode,
      url: req.url,
      method: req.method
    });
  }

  // Send to Sentry
  if (!apiError.isOperational) {
    Sentry.captureException(error, {
      tags: {
        type: 'api_error',
        statusCode: apiError.statusCode
      },
      extra: {
        url: req.url,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query,
        user: (req as any).user?.id
      }
    });
  }

  // Send response
  res.status(apiError.statusCode).json({
    error: {
      message: apiError.message,
      statusCode: apiError.statusCode,
      ...(process.env.NODE_ENV === 'development' && {
        stack: apiError.stack,
        details: apiError.details
      })
    }
  });
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  res.status(error.statusCode).json({
    error: {
      message: error.message,
      statusCode: error.statusCode
    }
  });
};