import { Router } from 'express';
import { authenticateSupabaseToken } from '../middleware/supabaseAuth';
import * as calendarController from '../controllers/calendarController';

const router = Router();

// Protected endpoints - all routes here require authentication
router.use(authenticateSupabaseToken);

// Get Calendly configuration
router.get('/config/calendly', calendarController.getCalendlyConfig);

// Get upcoming meetings
router.get('/meetings/upcoming', calendarController.getUpcomingMeetings);

// Sync Calendly events
router.post('/sync/calendly', calendarController.syncCalendlyEvents);

export default router;