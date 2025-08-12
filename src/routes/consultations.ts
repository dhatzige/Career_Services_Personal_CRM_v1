import { Router, Request, Response } from 'express';
import { ConsultationModel } from '../models/Consultation';
import { authenticateSupabaseToken } from '../middleware/supabaseAuth';
import { validateConsultation } from '../middleware/validation';
import { ApiResponse, Consultation, CreateConsultationRequest } from '../types';
import * as consultationController from '../controllers/consultationController';

const router = Router();

// Apply authentication to all routes
router.use(authenticateSupabaseToken);

/**
 * Get all consultations
 */
router.get('/', consultationController.getAllConsultations);

/**
 * Get all consultations for a specific student
 */
router.get('/student/:studentId', consultationController.getConsultationsForStudent);

/**
 * Get consultation by ID
 */
router.get('/:id', consultationController.getConsultationById);

/**
 * Create new consultation for a student
 */
router.post('/student/:studentId', consultationController.createConsultationForStudent);

/**
 * Update consultation by ID
 */
router.put('/:id', consultationController.updateConsultation);

/**
 * Delete consultation by ID
 */
router.delete('/:id', consultationController.deleteConsultation);

/**
 * Get consultations in date range
 */
router.get('/date-range/:startDate/:endDate', async (req: Request, res: Response<ApiResponse<Consultation[]>>) => {
  try {
    const { startDate, endDate } = req.params;
    
    // Validate date format (ISO 8601)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
      return;
    }

    const consultations = await ConsultationModel.findByDateRange(startDate, endDate);
    
    res.json({
      success: true,
      data: consultations,
      message: `Found ${consultations.length} consultations in date range`
    });
  } catch (error) {
    console.error('Get consultations by date range error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve consultations'
    });
  }
});

/**
 * Get consultation statistics
 */
router.get('/stats/overview', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const stats = await ConsultationModel.getStatistics();
    
    res.json({
      success: true,
      data: stats,
      message: 'Consultation statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Get consultation statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve consultation statistics'
    });
  }
});

export default router; 