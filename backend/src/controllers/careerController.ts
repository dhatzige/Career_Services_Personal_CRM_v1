import { Request, Response } from 'express';
import { ApplicationModel } from '../models/Application';
import { WorkshopAttendanceModel } from '../models/Workshop';
import { MockInterviewModel } from '../models/MockInterview';
import { CareerDocumentModel } from '../models/CareerDocument';
import { EmployerConnectionModel } from '../models/EmployerConnection';
import { logAuditEvent } from '../middleware/security';
import multer from 'multer';
import path from 'path';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'career-documents');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  }
});

// Application Controllers
export const getAllApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    const applications = await ApplicationModel.findAll();
    
    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Get all applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications'
    });
  }
};

export const createApplication = async (req: Request & { user?: any }, res: Response): Promise<void> => {
  try {
    const application = await ApplicationModel.create(req.body);
    logAuditEvent(req, 'CREATE_APPLICATION', 'applications', true, { applicationId: application.id });
    
    res.status(201).json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create application'
    });
  }
};

export const getApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const applications = await ApplicationModel.findByStudent(studentId);
    const stats = await ApplicationModel.getStats(studentId);
    
    res.json({
      success: true,
      data: applications,
      stats
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications'
    });
  }
};

export const updateApplication = async (req: Request & { user?: any }, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const application = await ApplicationModel.update(id, req.body);
    
    if (!application) {
      res.status(404).json({
        success: false,
        message: 'Application not found'
      });
      return;
    }
    
    logAuditEvent(req, 'UPDATE_APPLICATION', 'applications', true, { applicationId: id });
    
    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application'
    });
  }
};

export const deleteApplication = async (req: Request & { user?: any }, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await ApplicationModel.delete(id);
    
    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Application not found'
      });
      return;
    }
    
    logAuditEvent(req, 'DELETE_APPLICATION', 'applications', true, { applicationId: id });
    
    res.json({
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete application'
    });
  }
};

// Workshop Controllers
export const getAllWorkshops = async (req: Request, res: Response): Promise<void> => {
  try {
    const workshops = await WorkshopAttendanceModel.findAll();
    
    res.json({
      success: true,
      data: workshops
    });
  } catch (error) {
    console.error('Get all workshops error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workshops'
    });
  }
};

export const recordWorkshopAttendance = async (req: Request & { user?: any }, res: Response): Promise<void> => {
  try {
    const attendance = await WorkshopAttendanceModel.create(req.body);
    logAuditEvent(req, 'RECORD_WORKSHOP', 'workshops', true, { attendanceId: attendance.id });
    
    res.status(201).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Record workshop error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record workshop attendance'
    });
  }
};

export const getStudentWorkshops = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const workshops = await WorkshopAttendanceModel.findByStudent(studentId);
    const stats = await WorkshopAttendanceModel.getWorkshopStats();
    
    res.json({
      success: true,
      data: workshops,
      stats
    });
  } catch (error) {
    console.error('Get workshops error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workshops'
    });
  }
};

export const getUpcomingWorkshops = async (req: Request, res: Response): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const workshops = await WorkshopAttendanceModel.getUpcomingWorkshops(days);
    
    res.json({
      success: true,
      data: workshops
    });
  } catch (error) {
    console.error('Get upcoming workshops error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming workshops'
    });
  }
};

// Mock Interview Controllers
export const getAllMockInterviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const interviews = await MockInterviewModel.findAll();
    
    res.json({
      success: true,
      data: interviews
    });
  } catch (error) {
    console.error('Get all mock interviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mock interviews'
    });
  }
};

export const createMockInterview = async (req: Request & { user?: any }, res: Response): Promise<void> => {
  try {
    const interview = await MockInterviewModel.create(req.body);
    logAuditEvent(req, 'CREATE_MOCK_INTERVIEW', 'interviews', true, { interviewId: interview.id });
    
    res.status(201).json({
      success: true,
      data: interview
    });
  } catch (error) {
    console.error('Create mock interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create mock interview'
    });
  }
};

export const getStudentInterviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const interviews = await MockInterviewModel.findByStudent(studentId);
    const stats = await MockInterviewModel.getStats(studentId);
    
    res.json({
      success: true,
      data: interviews,
      stats
    });
  } catch (error) {
    console.error('Get interviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interviews'
    });
  }
};

export const updateMockInterview = async (req: Request & { user?: any }, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const interview = await MockInterviewModel.update(id, req.body);
    
    if (!interview) {
      res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
      return;
    }
    
    logAuditEvent(req, 'UPDATE_MOCK_INTERVIEW', 'interviews', true, { interviewId: id });
    
    res.json({
      success: true,
      data: interview
    });
  } catch (error) {
    console.error('Update interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update interview'
    });
  }
};

// Document Controllers
export const getAllDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const documents = await CareerDocumentModel.findAll();
    
    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('Get all documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents'
    });
  }
};

export const uploadDocument = async (req: Request & { user?: any, file?: Express.Multer.File }, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
      return;
    }
    
    const { studentId, documentType } = req.body;
    const filePath = await CareerDocumentModel.saveFile(studentId, documentType, req.file);
    
    const document = await CareerDocumentModel.create({
      student_id: studentId,
      document_type: documentType,
      file_path: filePath,
      file_name: req.file.originalname,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      ...req.body
    });
    
    logAuditEvent(req, 'UPLOAD_DOCUMENT', 'documents', true, { documentId: document.id });
    
    res.status(201).json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document'
    });
  }
};

export const getStudentDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { type } = req.query;
    const documents = await CareerDocumentModel.findByStudent(studentId, type as string);
    const stats = await CareerDocumentModel.getReviewStats();
    
    res.json({
      success: true,
      data: documents,
      stats
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents'
    });
  }
};

export const reviewDocument = async (req: Request & { user?: any }, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const document = await CareerDocumentModel.update(id, {
      review_date: new Date(),
      reviewer_notes: req.body.reviewer_notes,
      improvements_made: req.body.improvements_made
    });
    
    if (!document) {
      res.status(404).json({
        success: false,
        message: 'Document not found'
      });
      return;
    }
    
    logAuditEvent(req, 'REVIEW_DOCUMENT', 'documents', true, { documentId: id });
    
    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Review document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review document'
    });
  }
};

// Employer Connection Controllers
export const getAllEmployerConnections = async (req: Request, res: Response): Promise<void> => {
  try {
    const connections = await EmployerConnectionModel.findAll();
    
    res.json({
      success: true,
      data: connections
    });
  } catch (error) {
    console.error('Get all employer connections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employer connections'
    });
  }
};

export const createEmployerConnection = async (req: Request & { user?: any }, res: Response): Promise<void> => {
  try {
    const connection = await EmployerConnectionModel.create(req.body);
    logAuditEvent(req, 'CREATE_EMPLOYER_CONNECTION', 'connections', true, { connectionId: connection.id });
    
    res.status(201).json({
      success: true,
      data: connection
    });
  } catch (error) {
    console.error('Create connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create employer connection'
    });
  }
};

export const getStudentConnections = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const connections = await EmployerConnectionModel.findByStudent(studentId);
    const stats = await EmployerConnectionModel.getNetworkStats(studentId);
    
    res.json({
      success: true,
      data: connections,
      stats
    });
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch connections'
    });
  }
};

export const updateEmployerConnection = async (req: Request & { user?: any }, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const connection = await EmployerConnectionModel.update(id, req.body);
    
    if (!connection) {
      res.status(404).json({
        success: false,
        message: 'Connection not found'
      });
      return;
    }
    
    logAuditEvent(req, 'UPDATE_EMPLOYER_CONNECTION', 'connections', true, { connectionId: id });
    
    res.json({
      success: true,
      data: connection
    });
  } catch (error) {
    console.error('Update connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update connection'
    });
  }
};

// Career Dashboard
export const getCareerDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    
    const [
      applicationStats,
      interviewStats,
      networkStats,
      recentActivity
    ] = await Promise.all([
      ApplicationModel.getStats(studentId),
      MockInterviewModel.getStats(studentId),
      EmployerConnectionModel.getNetworkStats(studentId),
      getRecentCareerActivity(studentId)
    ]);
    
    res.json({
      success: true,
      data: {
        applications: applicationStats,
        interviews: interviewStats,
        network: networkStats,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Get career dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch career dashboard'
    });
  }
};

// Helper function to get recent career activity
async function getRecentCareerActivity(studentId: string): Promise<any[]> {
  // This would aggregate recent activities across all career tables
  // For now, returning empty array
  return [];
}