import * as Sentry from '@sentry/node';
import { Express, Request, Response, NextFunction } from 'express';
import logger from './logger';

export function initMonitoring(app: Express) {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';
  
  // Initialize Sentry if DSN is provided
  if (dsn) {
    Sentry.init({
      dsn,
      environment,
      integrations: [
        // Automatically instrument Node.js libraries and frameworks
          // Console logging integration
        Sentry.consoleLoggingIntegration({ 
          levels: ['error', 'warn'] 
        }),
      ],
      // Enable experimental features
      _experiments: {
        enableLogs: true,
      },
      // Performance Monitoring
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
      // Set sample rate for profiling
      profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
      // Release tracking
      release: process.env.npm_package_version || '1.0.0',
      // Server name
      serverName: process.env.SERVER_NAME || 'career-services-backend',
      // Additional options
      beforeSend(event, hint) {
        // Don't send events in test environment
        if (process.env.NODE_ENV === 'test') {
          return null;
        }
        
        // Scrub sensitive data
        if (event.request) {
          // Remove auth headers
          if (event.request.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
          }
          // Remove sensitive body data
          if (event.request.data) {
            const sensitiveFields = ['password', 'token', 'secret', 'key'];
            sensitiveFields.forEach(field => {
              if (event.request.data[field]) {
                event.request.data[field] = '[REDACTED]';
              }
            });
          }
        }
        
        return event;
      },
    });
    
    // Sentry middleware is set up automatically with the new SDK
    
    logger.info('Sentry monitoring initialized');
  } else {
    logger.info('Sentry monitoring disabled (no DSN configured). Set SENTRY_DSN in your .env file to enable.');
  }
}

// Simple error tracking middleware
export function errorTrackingMiddleware(err: any, req: Request, res: Response, next: NextFunction) {
  // Log to Sentry if available
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err, {
      contexts: {
        request: {
          method: req.method,
          url: req.url,
          headers: req.headers,
        },
      },
    });
  }
  
  // Pass to next error handler
  next(err);
}

// Performance monitoring wrapper
export function trackPerformance<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  
  return fn()
    .then(result => {
      const duration = Date.now() - start;
      logger.info(`Performance: ${operation} completed in ${duration}ms`);
      return result;
    })
    .catch(error => {
      const duration = Date.now() - start;
      logger.error(`Performance: ${operation} failed after ${duration}ms`, { error });
      throw error;
    });
}

// Get Sentry logger
export const { logger: sentryLogger } = Sentry;

// Export simple wrappers
export const captureException = (error: Error, context?: any) => {
  logger.error(error.message, { error, ...context });
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, context);
  }
};

export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  logger[level](message);
  if (process.env.SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  }
};

// Structured logging helpers
export const logTrace = (message: string, data?: Record<string, any>) => {
  if (process.env.SENTRY_DSN && sentryLogger) {
    sentryLogger.trace(message, data);
  }
  logger.debug(message, data);
};

export const logDebug = (message: string, data?: Record<string, any>) => {
  if (process.env.SENTRY_DSN && sentryLogger) {
    sentryLogger.debug(message, data);
  }
  logger.debug(message, data);
};

export const logInfo = (message: string, data?: Record<string, any>) => {
  if (process.env.SENTRY_DSN && sentryLogger) {
    sentryLogger.info(message, data);
  }
  logger.info(message, data);
};

export const logWarn = (message: string, data?: Record<string, any>) => {
  if (process.env.SENTRY_DSN && sentryLogger) {
    sentryLogger.warn(message, data);
  }
  logger.warn(message, data);
};

export const logError = (message: string, data?: Record<string, any>) => {
  if (process.env.SENTRY_DSN && sentryLogger) {
    sentryLogger.error(message, data);
  }
  logger.error(message, data);
};

export const logFatal = (message: string, data?: Record<string, any>) => {
  if (process.env.SENTRY_DSN && sentryLogger) {
    sentryLogger.fatal(message, data);
  }
  logger.error(`FATAL: ${message}`, data);
};