import { Router } from 'express';
import { authenticateSupabaseToken } from '../middleware/supabaseAuth';
import { reportController } from '../controllers/reportController';

const router = Router();

// All routes require authentication
router.use(authenticateSupabaseToken);

// GET /api/reports/daily-summary - Get daily consultation summary
router.get('/daily-summary', reportController.getDailySummary);

// GET /api/reports/weekly-metrics - Get weekly metrics
router.get('/weekly-metrics', reportController.getWeeklyMetrics);

// POST /api/reports/send-daily-email - Send daily summary email
router.post('/send-daily-email', reportController.sendDailySummaryEmail);

// GET /api/reports/export - Export data to CSV
router.get('/export', reportController.exportData);

// POST /api/reports/import - Import data from CSV
router.post('/import', reportController.importData);

export default router;