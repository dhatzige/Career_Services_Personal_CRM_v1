import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import session from 'express-session';
import cookieParser from 'cookie-parser';

// Load environment variables from backend/.env explicitly BEFORE any other imports
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import database from './database';
// import { checkSystemConfiguration } from './middleware/auth'; // Removed - using Supabase auth
import { sanitizeInput, sessionConfig, securityHeaders, doubleCsrfProtection } from './middleware/security';
import logger, { requestLogger, logSecurityEvent } from './utils/logger';
import { initMonitoring, errorTrackingMiddleware } from './utils/monitoring';
import { initCache } from './utils/cache';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import * as Sentry from '@sentry/node';

// Set security-related environment defaults
if (!process.env.SESSION_SECRET) {
  console.warn('⚠️  SESSION_SECRET not set. Using default (CHANGE IN PRODUCTION!)');
}
if (!process.env.CSRF_SECRET) {
  console.warn('⚠️  CSRF_SECRET not set. Using default (CHANGE IN PRODUCTION!)');
}

// Import routes
import authRoutes from './routes/auth';
import teamRoutes from './routes/team';
import studentRoutes from './routes/students';
import noteRoutes from './routes/notes';
import consultationRoutes from './routes/consultations';
import dashboardRoutes from './routes/dashboard';
import aiRoutes from './routes/ai';
import careerRoutes from './routes/career';
import calendarRoutes from './routes/calendar';
import calendarWebhookRoutes from './routes/calendarWebhook';
import reportRoutes from './routes/reports';
// import backupRoutes from './routes/backup'; // Removed - no longer needed

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize monitoring
initMonitoring(app);

// Initialize cache
initCache();

// Request logging
app.use(requestLogger);

// Security middleware - DISABLED for development flexibility
// app.use(helmet({
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"],
//       styleSrc: ["'self'", "'unsafe-inline'"],
//       scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
//       imgSrc: ["'self'", "data:", "https:"],
//       connectSrc: ["'self'", "http://localhost:*", "https://api.anthropic.com"],
//       fontSrc: ["'self'"],
//       objectSrc: ["'none'"],
//       mediaSrc: ["'self'"],
//       frameSrc: ["'self'", "https://calendly.com"],
//     },
//   },
//   crossOriginEmbedderPolicy: false
// }));

// Cookie parser
app.use(cookieParser());

// Session middleware
app.use(session(sessionConfig));

// Additional security headers - DISABLED
// app.use(securityHeaders);

// Input sanitization - DISABLED
// app.use(sanitizeInput);

// Rate limiting - DISABLED
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
//   message: {
//     success: false,
//     message: 'Too many requests from this IP, please try again later.'
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests from localhost ports 5173 and 5174 (Vite dev servers)
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    // Allow requests with no origin (like mobile apps)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Test routes (development only)
if (process.env.NODE_ENV === 'development') {
  const testRoutes = require('./routes/test').default;
  app.use('/api/test', testRoutes);
}

// Health check endpoint (no auth required)
app.get('/health', async (req, res) => {
  try {
    const dbHealth = database.isHealthy();
    const dbStats = database.getStats();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth ? 'healthy' : 'unhealthy',
        api: 'healthy'
      },
      database: dbStats,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// Public webhook endpoints (no auth/CSRF required)
app.use('/api/calendar/webhook', calendarWebhookRoutes); // Webhook endpoints don't need auth

// System configuration check (for most routes) - DISABLED
// app.use('/api', checkSystemConfiguration);

// API routes (CSRF protection DISABLED for all routes)
// Auth routes (registration with invitation)
app.use('/api', authRoutes); // Auth endpoints - no auth required for registration
// Team management routes (includes users and invitations)
app.use('/api', teamRoutes); // Team management - Supabase auth only
app.use('/api/students', studentRoutes); // NO CSRF
app.use('/api/notes', noteRoutes); // NO CSRF
app.use('/api/consultations', consultationRoutes); // NO CSRF
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes); // NO CSRF
app.use('/api/ai-assistant', require('./routes/aiAssistant').default); // Natural language queries
app.use('/api/career', careerRoutes); // NO CSRF
app.use('/api/calendar', calendarRoutes); // Other calendar endpoints with auth
app.use('/api/reports', reportRoutes); // Reports are read-only
// Removed setup routes - using Supabase auth only
// app.use('/api/backup', backupRoutes); // Removed - no longer needed

// Handle 404 errors
app.use('*', notFoundHandler);

// Error tracking middleware (Sentry)
app.use(errorTrackingMiddleware);

// Global error handler (our custom handler)
app.use(errorHandler);

// Sentry error handler is already set up in initMonitoring()

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database
    await database.initialize();
    const dbType = process.env.USE_SUPABASE === 'true' ? 'Supabase' : 'SQLite';
    console.log(`✅ ${dbType} database initialized`);
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 Career Services CRM running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📁 Database: ./data/career_services.db`);
      console.log(`📄 Document uploads: ./uploads/`);
      console.log(`📅 Calendly: Ready for integration`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n💡 First time setup:`);
        console.log(`   1. Visit http://localhost:5173 in your browser`);
        console.log(`   2. Create your admin account`);
        console.log(`   3. Configure Calendly integration in Settings`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle process termination
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  await database.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  await database.close();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

export default app; 