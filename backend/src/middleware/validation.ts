import { Request, Response, NextFunction } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
import { ApiResponse } from '../types';
import { NOTE_TYPES, CONSULTATION_TYPES } from '../types/shared';

/**
 * Handle validation errors
 */
export const handleValidationErrors = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: {
        details: errors.array().map(error => ({
          field: error.type === 'field' ? error.path : 'unknown',
          message: error.msg
        }))
      }
    });
    return;
  }
  
  next();
};

/**
 * Student validation rules
 */
export const validateStudent = [
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters'),
  
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be between 1 and 100 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  
  body('yearOfStudy')
    .isIn(['1st year', '2nd year', '3rd year', '4th year', 'Graduate', 'Alumni'])
    .withMessage('Invalid year of study'),
  
  body('programType')
    .isIn(["Bachelor's", "Master's"])
    .withMessage('Invalid program type'),
  
  body('specificProgram')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Specific program must be between 1 and 200 characters'),
  
  body('major')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Major must be less than 200 characters'),
  
  body('academicStartDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Academic start date must be a valid date'),
  
  handleValidationErrors
];

/**
 * Student update validation rules (all fields optional)
 */
export const validateStudentUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be between 1 and 100 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  
  body('yearOfStudy')
    .optional()
    .isIn(['1st year', '2nd year', '3rd year', '4th year', 'Graduate', 'Alumni'])
    .withMessage('Invalid year of study'),
  
  body('programType')
    .optional()
    .isIn(["Bachelor's", "Master's"])
    .withMessage('Invalid program type'),
  
  body('specificProgram')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Specific program must be between 1 and 200 characters'),
  
  body('status')
    .optional()
    .isIn(['Active', 'Inactive', 'Graduated'])
    .withMessage('Invalid status'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  handleValidationErrors
];

/**
 * Note validation rules
 */
export const validateNote = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Note content must be between 1 and 5000 characters'),
  
  body('type')
    .isIn(NOTE_TYPES)
    .withMessage('Invalid note type'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  handleValidationErrors
];

/**
 * Consultation validation rules
 */
export const validateConsultation = [
  body('type')
    .optional()
    .isIn(CONSULTATION_TYPES)
    .withMessage('Invalid consultation type'),
  
  body('date')
    .isISO8601()
    .toDate()
    .withMessage('Date must be a valid ISO date'),
  
  body('duration')
    .isInt({ min: 1, max: 480 })
    .withMessage('Duration must be between 1 and 480 minutes'),
  
  body('attended')
    .isBoolean()
    .withMessage('Attended must be a boolean'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Notes must be less than 5000 characters'),
  
  body('followUpRequired')
    .isBoolean()
    .withMessage('Follow-up required must be a boolean'),
  
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Location must be less than 200 characters'),
  
  body('meetingLink')
    .optional()
    .isURL()
    .withMessage('Meeting link must be a valid URL'),
  
  handleValidationErrors
];

/**
 * Follow-up reminder validation rules
 */
export const validateFollowUpReminder = [
  body('date')
    .isISO8601()
    .toDate()
    .withMessage('Date must be a valid ISO date'),
  
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  
  body('priority')
    .isIn(['High', 'Medium', 'Low'])
    .withMessage('Priority must be High, Medium, or Low'),
  
  handleValidationErrors
];

/**
 * Authentication validation rules
 */
export const validateAuth = [
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be between 6 and 100 characters'),
  
  body('stayLoggedIn')
    .optional()
    .isBoolean()
    .withMessage('Stay logged in must be a boolean'),
  
  handleValidationErrors
];

/**
 * User setup validation rules
 */
export const validateUserSetup = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username must be 3-50 characters and contain only letters, numbers, hyphens, and underscores'),
  
  body('password')
    .isLength({ min: 8, max: 100 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters and contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  handleValidationErrors
];

/**
 * Search validation rules
 */
export const validateSearch = [
  body('query')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Search query must be less than 200 characters'),
  
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('Limit must be between 1 and 100'),
  
  body('offset')
    .optional()
    .isInt({ min: 0 })
    .toInt()
    .withMessage('Offset must be a non-negative integer'),
  
  body('sortBy')
    .optional()
    .isIn(['firstName', 'lastName', 'dateAdded', 'lastInteraction'])
    .withMessage('Invalid sort field'),
  
  body('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  handleValidationErrors
];

/**
 * UUID validation for parameters
 */
export const validateUUID = (paramName: string): ValidationChain => {
  return body(paramName)
    .isUUID()
    .withMessage(`${paramName} must be a valid UUID`);
}; 