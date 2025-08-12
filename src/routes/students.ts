import { Router, Request, Response } from 'express';
import { StudentModel } from '../models/Student';
import { authenticateSupabaseToken } from '../middleware/supabaseAuth';
import { validateStudent, validateStudentUpdate, validateSearch } from '../middleware/validation';
import { ApiResponse, Student, CreateStudentRequest, UpdateStudentRequest, SearchRequest } from '../types';
import * as studentController from '../controllers/studentController';

const router = Router();

// Apply authentication to all routes
router.use(authenticateSupabaseToken);

/**
 * Get all students with search and pagination
 */
router.post('/search', validateSearch, async (req: Request, res: Response) => {
  try {
    const searchRequest: SearchRequest = req.body;
    const students = await StudentModel.search(searchRequest.query || '', searchRequest.filters);
    
    res.json({
      success: true,
      data: {
        students: students,
        total: students.length
      },
      message: `Found ${students.length} students`
    });
  } catch (error) {
    console.error('Search students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search students'
    });
  }
});

/**
 * Get all students (simple endpoint for backward compatibility)
 */
router.get('/', studentController.getAllStudents);

/**
 * Get student by ID
 */
router.get('/:id', studentController.getStudentById);

/**
 * Create new student
 */
router.post('/', studentController.createStudent);

/**
 * Update student by ID
 */
router.put('/:id', studentController.updateStudent);

/**
 * Delete student by ID
 */
router.delete('/:id', studentController.deleteStudent);

/**
 * Get student statistics
 */
router.get('/stats/overview', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const stats = await StudentModel.getStats();
    
    res.json({
      success: true,
      data: stats,
      message: 'Statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics'
    });
  }
});

/**
 * Bulk operations endpoint
 */
router.post('/bulk', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { action, studentIds, data } = req.body;
    
    if (!action || !studentIds || !Array.isArray(studentIds)) {
      res.status(400).json({
        success: false,
        message: 'Action and studentIds array are required'
      });
      return;
    }

    // Validate all IDs are UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const invalidIds = studentIds.filter(id => !uuidRegex.test(id));
    if (invalidIds.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Invalid student ID format in bulk operation'
      });
      return;
    }

    let results = [];
    let errorCount = 0;

    switch (action) {
      case 'delete':
        for (const id of studentIds) {
          try {
            await StudentModel.delete(id);
            results.push({ id, success: true });
          } catch (error) {
            results.push({ id, success: false, error: 'Failed to delete' });
            errorCount++;
          }
        }
        break;
        
      case 'update':
        if (!data) {
          res.status(400).json({
            success: false,
            message: 'Update data is required for bulk update operation'
          });
          return;
        }
        
        for (const id of studentIds) {
          try {
            await StudentModel.update(id, data);
            results.push({ id, success: true });
          } catch (error) {
            results.push({ id, success: false, error: 'Failed to update' });
            errorCount++;
          }
        }
        break;
        
      default:
        res.status(400).json({
          success: false,
          message: 'Invalid bulk action. Supported actions: delete, update'
        });
        return;
    }

    res.json({
      success: errorCount === 0,
      data: {
        processed: results.length,
        successful: results.length - errorCount,
        failed: errorCount,
        results
      },
      message: `Bulk ${action} completed. ${results.length - errorCount}/${results.length} successful`
    });
  } catch (error) {
    console.error('Bulk operation error:', error);
    res.status(500).json({
      success: false,
      message: 'Bulk operation failed'
    });
  }
});

export default router; 