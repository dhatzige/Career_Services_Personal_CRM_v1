import { Router } from 'express';
import { authenticateSupabaseToken } from '../middleware/supabaseAuth';
import { processNaturalLanguageQuery, getSuggestions } from '../controllers/nlQueryController';

const router = Router();

// Apply authentication to all routes
router.use(authenticateSupabaseToken);

// Process natural language queries
router.post('/query', processNaturalLanguageQuery);

// Get query suggestions
router.get('/suggestions', getSuggestions);

export default router;