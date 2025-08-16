import { Router, Request, Response } from 'express';
import * as Sentry from '@sentry/node';

const router = Router();


// Test endpoint for slow operations
router.get('/slow', async (req: Request, res: Response) => {
  // Simulate slow operation
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  res.json({
    success: true,
    message: 'Slow operation completed',
    duration: '3000ms'
  });
});

// Test endpoint to log a message
router.post('/log', (req: Request, res: Response) => {
  const { level = 'info', message = 'Test message' } = req.body;
  
  switch (level) {
    case 'error':
      Sentry.captureMessage(message, 'error');
      break;
    case 'warning':
      Sentry.captureMessage(message, 'warning');
      break;
    default:
      Sentry.captureMessage(message, 'info');
  }
  
  res.json({
    success: true,
    message: `Logged ${level} message to Sentry`,
    sentMessage: message
  });
});

// Test endpoint to add breadcrumb
router.post('/breadcrumb', (req: Request, res: Response) => {
  const { message = 'Test breadcrumb', category = 'test', level = 'info' } = req.body;
  
  Sentry.addBreadcrumb({
    message,
    category,
    level: level as Sentry.SeverityLevel,
    timestamp: Date.now() / 1000,
  });
  
  res.json({
    success: true,
    message: 'Breadcrumb added',
    breadcrumb: { message, category, level }
  });
});

export default router;