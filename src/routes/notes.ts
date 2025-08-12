import { Router, Request, Response } from 'express';
import { NoteModel } from '../models/Note';
import { authenticateSupabaseToken } from '../middleware/supabaseAuth';
import { validateNote } from '../middleware/validation';
import { ApiResponse, Note, CreateNoteRequest } from '../types';
import * as noteController from '../controllers/noteController';

const router = Router();

// Apply authentication to all routes
router.use(authenticateSupabaseToken);

/**
 * Get all notes for a specific student
 */
router.get('/student/:studentId', noteController.getNotesForStudent);

/**
 * Get note by ID
 */
router.get('/:id', noteController.getNoteById);

/**
 * Create new note for a student
 */
router.post('/student/:studentId', validateNote, noteController.createNoteForStudent);

/**
 * Update note by ID
 */
router.put('/:id', noteController.updateNote);

/**
 * Delete note by ID
 */
router.delete('/:id', noteController.deleteNote);

/**
 * Get notes statistics
 */
router.get('/stats/overview', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const stats = await NoteModel.getStats();
    
    res.json({
      success: true,
      data: stats,
      message: 'Notes statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Get notes statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notes statistics'
    });
  }
});

export default router; 