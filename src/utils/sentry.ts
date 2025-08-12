import * as Sentry from '@sentry/react';
import { useEffect } from 'react';
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from 'react-router-dom';

export function initSentry() {
  // Only initialize in production or if explicitly enabled
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE;
  
  console.log('Sentry initialization:', {
    dsn: dsn ? 'DSN is set' : 'DSN is NOT set',
    environment,
    fullDsn: dsn, // Log the actual DSN for debugging
  });
  
  if (!dsn) {
    console.log('Sentry is disabled. Set VITE_SENTRY_DSN in your .env file to enable error tracking.');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
      // Log console messages to Sentry
      Sentry.consoleLoggingIntegration({ 
        levels: ['error', 'warn'] 
      }),
    ],
    // Send default PII (IP addresses, etc.)
    sendDefaultPii: true,
    
    // Performance Monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    
    // Release Tracking
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',
    
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions will be recorded
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    
    // Additional options
    beforeSend(event, hint) {
      // Filter out specific errors
      if (event.exception) {
        const error = hint.originalException;
        // Don't send cancelled requests
        if (error?.name === 'AbortError') {
          return null;
        }
        // Don't send network errors in development
        if (environment === 'development' && error?.name === 'NetworkError') {
          return null;
        }
      }
      
      // Scrub sensitive data
      if (event.request?.cookies) {
        delete event.request.cookies;
      }
      
      return event;
    },
    
    // User identification
    initialScope: {
      tags: {
        component: 'frontend',
      },
    },
  });
  
  console.log('✅ Sentry initialized successfully');
}

// Error boundary wrapper
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Performance profiling
export const SentryProfiler = Sentry.Profiler;

// Manual error capture
export const captureException = Sentry.captureException;
export const captureMessage = Sentry.captureMessage;

// User context
export const setUser = Sentry.setUser;
export const configureScope = Sentry.configureScope;

// Custom breadcrumbs
export const addBreadcrumb = Sentry.addBreadcrumb;

// Transaction tracking
export function trackTransaction(name: string, operation: string) {
  return Sentry.startTransaction({ name, op: operation });
}