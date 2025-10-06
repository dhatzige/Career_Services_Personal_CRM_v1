import { Router, Request, Response } from 'express';
import { StudentModel } from '../models/Student';
import { NoteModel } from '../models/Note';
import { ConsultationModel } from '../models/Consultation';
import { authenticateSupabaseToken } from '../middleware/supabaseAuth';
import { ApiResponse } from '../types';
import * as dashboardController from '../controllers/dashboardController';

const router = Router();

// Apply authentication to all routes
router.use(authenticateSupabaseToken);

/**
 * Get comprehensive dashboard statistics
 */
router.get('/stats', dashboardController.stats);

/**
 * Get recent activity feed
 */
router.get('/activity', dashboardController.activity);

/**
 * Get performance metrics
 */
router.get('/metrics', dashboardController.metrics);

/**
 * Get upcoming consultations and reminders
 */
router.get('/upcoming', dashboardController.upcoming);

/**
 * Get system health status
 */
router.get('/health', dashboardController.health);

// Helper functions
function getTimeUntil(dateString: string): string {
  const now = new Date();
  const target = new Date(dateString);
  const diffMs = target.getTime() - now.getTime();
  
  if (diffMs < 0) return 'Past due';
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (diffDays > 0) return `${diffDays} day${diffDays === 1 ? '' : 's'}`;
  if (diffHours > 0) return `${diffHours} hour${diffHours === 1 ? '' : 's'}`;
  
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'}`;
}

function getPriorityFromType(type: string): 'high' | 'medium' | 'low' {
  const highPriority = ['Crisis Support', 'Initial Consultation'];
  const lowPriority = ['Progress Review', 'Other'];
  
  if (highPriority.includes(type)) return 'high';
  if (lowPriority.includes(type)) return 'low';
  return 'medium';
}

export default router; 