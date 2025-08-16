import * as Sentry from '@sentry/node';
import { Request, Response, NextFunction } from 'express';

/**
 * Track database operations with Sentry spans
 */
export async function trackDatabaseOperation<T>(
  operation: string,
  tableName: string,
  callback: () => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    {
      op: 'db.query',
      name: `${operation} ${tableName}`,
    },
    async (span) => {
      span.setAttribute('db.operation', operation);
      span.setAttribute('db.table', tableName);
      span.setAttribute('db.system', process.env.USE_SUPABASE === 'true' ? 'postgresql' : 'sqlite');
      
      const startTime = Date.now();
      
      try {
        const result = await callback();
        const duration = Date.now() - startTime;
        
        span.setAttribute('db.duration_ms', duration);
        
        // Log slow queries
        if (duration > 1000) {
          Sentry.captureMessage(`Slow database query: ${operation} ${tableName} took ${duration}ms`, 'warning');
        }
        
        return result;
      } catch (error) {
        span.setStatus({ code: 2 }); // SpanStatusCode.Error
        Sentry.captureException(error, {
          tags: {
            db_operation: operation,
            db_table: tableName,
          },
        });
        throw error;
      }
    }
  );
}

/**
 * Track external API calls
 */
export async function trackExternalAPI<T>(
  service: string,
  endpoint: string,
  callback: () => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    {
      op: 'http.client',
      name: `${service} ${endpoint}`,
    },
    async (span) => {
      span.setAttribute('service.name', service);
      span.setAttribute('http.url', endpoint);
      
      try {
        const result = await callback();
        return result;
      } catch (error) {
        span.setStatus({ code: 2 }); // SpanStatusCode.Error
        Sentry.captureException(error, {
          tags: {
            service,
            endpoint,
          },
        });
        throw error;
      }
    }
  );
}

/**
 * Track email sending operations
 */
export async function trackEmailOperation(
  emailType: string,
  recipient: string,
  callback: () => Promise<boolean>
): Promise<boolean> {
  return Sentry.startSpan(
    {
      op: 'email.send',
      name: `Send ${emailType} email`,
    },
    async (span) => {
      span.setAttribute('email.type', emailType);
      span.setAttribute('email.recipient_domain', recipient.split('@')[1] || 'unknown');
      
      try {
        const success = await callback();
        span.setAttribute('email.success', success);
        
        if (!success) {
          Sentry.captureMessage(`Failed to send ${emailType} email`, 'warning');
        }
        
        return success;
      } catch (error) {
        span.setStatus({ code: 2 }); // SpanStatusCode.Error
        span.setAttribute('email.success', false);
        Sentry.captureException(error, {
          tags: {
            email_type: emailType,
          },
        });
        throw error;
      }
    }
  );
}

/**
 * Track file operations
 */
export async function trackFileOperation<T>(
  operation: string,
  fileType: string,
  callback: () => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    {
      op: 'file.operation',
      name: `${operation} ${fileType} file`,
    },
    async (span) => {
      span.setAttribute('file.operation', operation);
      span.setAttribute('file.type', fileType);
      
      try {
        const result = await callback();
        return result;
      } catch (error) {
        span.setStatus({ code: 2 }); // SpanStatusCode.Error
        Sentry.captureException(error, {
          tags: {
            file_operation: operation,
            file_type: fileType,
          },
        });
        throw error;
      }
    }
  );
}

/**
 * Middleware to create spans for route handlers
 */
export function createRouteSpan(routeName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    Sentry.startSpan(
      {
        op: 'http.server',
        name: `${req.method} ${routeName}`,
      },
      (span) => {
        span.setAttribute('http.method', req.method);
        span.setAttribute('http.route', routeName);
        span.setAttribute('http.url', req.originalUrl);
        
        // Track response
        const originalSend = res.send;
        res.send = function(data: any) {
          span.setAttribute('http.status_code', res.statusCode);
          
          if (res.statusCode >= 400) {
            span.setStatus({ code: 2 }); // SpanStatusCode.Error
          }
          
          return originalSend.call(this, data);
        };
        
        next();
      }
    );
  };
}

/**
 * Add breadcrumb for important actions
 */
export function addActionBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    category,
    message,
    level: 'info',
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Track authentication events
 */
export function trackAuthEvent(
  event: 'login' | 'logout' | 'signup' | 'password_reset',
  userId?: string,
  success: boolean = true
) {
  Sentry.addBreadcrumb({
    category: 'auth',
    message: `User ${event}`,
    level: success ? 'info' : 'warning',
    data: {
      event,
      user_id: userId,
      success,
    },
  });
  
  if (!success) {
    Sentry.captureMessage(`Failed ${event} attempt`, 'warning');
  }
}