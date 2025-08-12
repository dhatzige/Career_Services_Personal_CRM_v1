import winston from 'winston';
import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';
import * as Sentry from '@sentry/node';
import path from 'path';
import fs from 'fs';
import stream from 'stream';

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    return log;
  })
);

// JSON format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.timestamp()
  ),
  defaultMeta: { 
    service: 'career-crm-backend',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat,
      silent: process.env.NODE_ENV === 'test'
    }),
    
    // File transport for errors
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Daily rotate file transport
    new winston.transports.File({
      filename: path.join(logsDir, `app-${new Date().toISOString().split('T')[0]}.log`),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 30 // Keep 30 days of logs
    })
  ]
});

// Add Logtail transport if configured
if (process.env.LOGTAIL_TOKEN) {
  const logtail = new Logtail(process.env.LOGTAIL_TOKEN);
  logger.add(new LogtailTransport(logtail));
}

// Sentry integration
class SentryTransport extends winston.transports.Stream {
  constructor(options = {}) {
    super({ ...options, stream: new stream.Writable({
      write: function(chunk, encoding, callback) {
        callback();
      }
    })});
  }

  override log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    const { level, message, timestamp, ...meta } = info;
    
    if (level === 'error') {
      Sentry.captureException(new Error(message), {
        level: 'error',
        extra: meta
      });
    } else if (level === 'warn') {
      Sentry.captureMessage(message, 'warning');
    }
    
    callback();
  }
}

// Add Sentry transport if configured
if (process.env.SENTRY_DSN) {
  logger.add(new SentryTransport());
}

// Create specialized loggers
export const httpLogger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'http.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

export const securityLogger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'security.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10
    })
  ]
});

// Request logging middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  // Log request
  httpLogger.info({
    type: 'request',
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  });
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpLogger.info({
      type: 'response',
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      timestamp: new Date().toISOString()
    });
    
    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        duration,
        status: res.statusCode
      });
    }
  });
  
  next();
};

// Security event logger
export const logSecurityEvent = (event: string, details: any) => {
  securityLogger.warn({
    event,
    timestamp: new Date().toISOString(),
    ...details
  });
  
  // Also send to main logger
  logger.warn(`Security Event: ${event}`, details);
};

// Audit logger
export const auditLog = (action: string, userId: string, details: any) => {
  const auditEntry = {
    action,
    userId,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  // Log to file
  logger.info('Audit Log', auditEntry);
  
  // You can also send to a separate audit service here
};

// Error logger with context
export const logError = (error: Error, context?: any) => {
  logger.error(error.message, {
    stack: error.stack,
    ...context
  });
};

// Performance logger
export const logPerformance = (operation: string, duration: number, metadata?: any) => {
  const perfLog = {
    operation,
    duration,
    timestamp: new Date().toISOString(),
    ...metadata
  };
  
  if (duration > 5000) {
    logger.warn('Performance issue detected', perfLog);
  } else {
    logger.info('Performance metric', perfLog);
  }
};

// Export the main logger
export default logger;