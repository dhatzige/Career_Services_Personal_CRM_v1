import { Router } from 'express';
import { authenticateSupabaseToken } from '../middleware/supabaseAuth';
import { validateFileUpload } from '../middleware/security';
import * as careerController from '../controllers/careerController';
import { body, param } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();

// All routes require authentication (skip in development for easier testing)
if (process.env.NODE_ENV !== 'development') {
  router.use(authenticateSupabaseToken);
}

// Application routes - ALL endpoints
router.get('/applications/all', careerController.getAllApplications);
router.get('/workshops/all', careerController.getAllWorkshops);
router.get('/mock-interviews/all', careerController.getAllMockInterviews);
router.get('/documents/all', careerController.getAllDocuments);
router.get('/employer-connections/all', careerController.getAllEmployerConnections);

// Application routes
router.post('/applications',
  body('student_id').isString().notEmpty(),
  body('type').isIn(['Internship', 'Full-time', 'Part-time', 'Co-op', 'Fellowship']),
  body('company_name').isString().notEmpty(),
  body('position_title').isString().notEmpty(),
  body('application_date').isISO8601(),
  body('status').isIn(['Planning', 'Applied', 'Phone Screen', 'Interview Scheduled', 'Interviewed', 'Offer', 'Rejected', 'Accepted', 'Declined']),
  handleValidationErrors,
  careerController.createApplication
);

router.get('/applications/student/:studentId',
  param('studentId').isString().notEmpty(),
  handleValidationErrors,
  careerController.getApplications
);

router.put('/applications/:id',
  param('id').isString().notEmpty(),
  handleValidationErrors,
  careerController.updateApplication
);

router.delete('/applications/:id',
  param('id').isString().notEmpty(),
  handleValidationErrors,
  careerController.deleteApplication
);

// Workshop routes
router.post('/workshops',
  body('student_id').isString().notEmpty(),
  body('workshop_name').isString().notEmpty(),
  body('workshop_date').isISO8601(),
  body('workshop_type').isIn(['Resume Writing', 'Interview Skills', 'Networking', 'Job Search Strategy', 'LinkedIn', 'Career Fair Prep', 'Industry Specific', 'Other']),
  body('attended').isBoolean(),
  handleValidationErrors,
  careerController.recordWorkshopAttendance
);

router.get('/workshops/student/:studentId',
  param('studentId').isString().notEmpty(),
  handleValidationErrors,
  careerController.getStudentWorkshops
);

router.get('/workshops/upcoming',
  careerController.getUpcomingWorkshops
);

// Mock Interview routes
router.post('/interviews',
  body('student_id').isString().notEmpty(),
  body('interview_date').isISO8601(),
  body('interview_type').isIn(['Behavioral', 'Technical', 'Case Study', 'Panel', 'Phone Screen', 'Final Round']),
  body('duration_minutes').isInt({ min: 1, max: 480 }),
  body('follow_up_required').isBoolean(),
  handleValidationErrors,
  careerController.createMockInterview
);

router.get('/interviews/student/:studentId',
  param('studentId').isString().notEmpty(),
  handleValidationErrors,
  careerController.getStudentInterviews
);

router.put('/interviews/:id',
  param('id').isString().notEmpty(),
  handleValidationErrors,
  careerController.updateMockInterview
);

// Document routes
router.post('/documents',
  careerController.upload.single('document'),
  validateFileUpload(
    ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
    10 * 1024 * 1024 // 10MB
  ),
  body('student_id').isString().notEmpty(),
  body('document_type').isIn(['Resume', 'Cover Letter', 'Portfolio', 'LinkedIn Profile', 'Other']),
  handleValidationErrors,
  careerController.uploadDocument
);

router.get('/documents/student/:studentId',
  param('studentId').isString().notEmpty(),
  handleValidationErrors,
  careerController.getStudentDocuments
);

router.put('/documents/:id/review',
  param('id').isString().notEmpty(),
  body('reviewer_notes').optional().isString(),
  body('improvements_made').optional().isString(),
  handleValidationErrors,
  careerController.reviewDocument
);

// Employer Connection routes
router.post('/connections',
  body('student_id').isString().notEmpty(),
  body('company_name').isString().notEmpty(),
  body('contact_name').isString().notEmpty(),
  body('connection_type').isIn(['Alumni', 'Recruiter', 'Hiring Manager', 'Employee Referral', 'Career Fair', 'Info Session', 'Other']),
  body('interaction_date').isISO8601(),
  body('relationship_strength').isIn(['New', 'Building', 'Strong', 'Champion']),
  handleValidationErrors,
  careerController.createEmployerConnection
);

router.get('/connections/student/:studentId',
  param('studentId').isString().notEmpty(),
  handleValidationErrors,
  careerController.getStudentConnections
);

router.put('/connections/:id',
  param('id').isString().notEmpty(),
  handleValidationErrors,
  careerController.updateEmployerConnection
);

// Career Dashboard
router.get('/dashboard/:studentId',
  param('studentId').isString().notEmpty(),
  handleValidationErrors,
  careerController.getCareerDashboard
);

export default router;