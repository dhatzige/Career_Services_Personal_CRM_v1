import { Request, Response, NextFunction } from 'express';
import { StudentModel } from '../models/Student';
import { EmailService } from '../services/emailService';
import { studentCache, dashboardCache } from '../utils/cache';
import { asyncHandler, NotFoundError, ValidationError, handleDatabaseError } from '../middleware/errorHandler';
import * as Sentry from '@sentry/node';

export const getAllStudents = asyncHandler(async (req: Request, res: Response) => {
  // Temporarily bypass cache to ensure fresh data with consultations
  const students = await StudentModel.findAll();
  res.json(students);
});

export const getStudentById = asyncHandler(async (req: Request, res: Response) => {
  const student = await studentCache.getById(
    req.params.id,
    () => StudentModel.findById(req.params.id)
  );
  if (!student) {
    throw new NotFoundError('Student not found');
  }
  res.json(student);
});

export const createStudent = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Handle both camelCase (from frontend) and snake_case formats
    const studentData = {
      firstName: req.body.firstName || req.body.first_name,
      lastName: req.body.lastName || req.body.last_name,
      email: req.body.email,
      phone: req.body.phone || null,
      yearOfStudy: req.body.yearOfStudy || req.body.year_of_study || null,
      programType: req.body.programType || req.body.program_type || null,
      specificProgram: req.body.specificProgram || req.body.specific_program || null,
      major: req.body.major || null,
      academicStartDate: req.body.academicStartDate || req.body.academic_start_date || null,
      expectedGraduation: req.body.expectedGraduation || req.body.expected_graduation || null,
      careerInterests: req.body.careerInterests || req.body.career_interests || null,
      linkedinUrl: req.body.linkedinUrl || req.body.linkedin_url || null,
      resumeOnFile: req.body.resumeOnFile || req.body.resume_on_file || false,
      jobSearchStatus: req.body.jobSearchStatus || req.body.job_search_status || 'Not Started',
      targetIndustries: req.body.targetIndustries || req.body.target_industries || null,
      targetLocations: req.body.targetLocations || req.body.target_locations || null,
      tags: req.body.tags || null,
      quickNote: req.body.quickNote || req.body.quick_note || null
    };
    
    const student = await StudentModel.create(studentData);
    
    // Invalidate cache
    await studentCache.invalidate();
    await dashboardCache.invalidate();
    
    // Send welcome email
    if (student.email) {
      await EmailService.sendWelcomeEmail({
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName
      });
    }
    
    res.status(201).json(student);
  } catch (err: any) {
    // Handle database constraint errors
    throw handleDatabaseError(err);
  }
});

export const updateStudent = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Handle both camelCase and snake_case formats
    const updates: any = {};
    const firstName = req.body.firstName || req.body.first_name;
    const lastName = req.body.lastName || req.body.last_name;
    const yearOfStudy = req.body.yearOfStudy || req.body.year_of_study;
    const programType = req.body.programType || req.body.program_type;
    const specificProgram = req.body.specificProgram || req.body.specific_program;
    const academicStartDate = req.body.academicStartDate || req.body.academic_start_date;
    const expectedGraduation = req.body.expectedGraduation || req.body.expected_graduation;
    const careerInterests = req.body.careerInterests || req.body.career_interests;
    const linkedinUrl = req.body.linkedinUrl || req.body.linkedin_url;
    const resumeOnFile = req.body.resumeOnFile || req.body.resume_on_file;
    const jobSearchStatus = req.body.jobSearchStatus || req.body.job_search_status;
    const targetIndustries = req.body.targetIndustries || req.body.target_industries;
    const targetLocations = req.body.targetLocations || req.body.target_locations;
    const quickNote = req.body.quickNote || req.body.quick_note;
    const lastAttendanceStatus = req.body.lastAttendanceStatus || req.body.last_attendance_status;
    
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (req.body.email !== undefined) updates.email = req.body.email;
    if (req.body.phone !== undefined) updates.phone = req.body.phone;
    if (yearOfStudy !== undefined) updates.yearOfStudy = yearOfStudy;
    if (programType !== undefined) updates.programType = programType;
    if (specificProgram !== undefined) updates.specificProgram = specificProgram;
    if (req.body.major !== undefined) updates.major = req.body.major;
    if (academicStartDate !== undefined) updates.academicStartDate = academicStartDate;
    if (expectedGraduation !== undefined) updates.expectedGraduation = expectedGraduation;
    if (careerInterests !== undefined) updates.careerInterests = careerInterests;
    if (linkedinUrl !== undefined) updates.linkedinUrl = linkedinUrl;
    if (resumeOnFile !== undefined) updates.resumeOnFile = resumeOnFile;
    if (jobSearchStatus !== undefined) updates.jobSearchStatus = jobSearchStatus;
    if (targetIndustries !== undefined) updates.targetIndustries = targetIndustries;
    if (targetLocations !== undefined) updates.targetLocations = targetLocations;
    if (req.body.tags !== undefined) updates.tags = req.body.tags;
    if (quickNote !== undefined) updates.quickNote = quickNote;
    if (lastAttendanceStatus !== undefined) updates.lastAttendanceStatus = lastAttendanceStatus;
    
    
    const updated = await StudentModel.update(req.params.id, updates);
    if (!updated) {
      throw new NotFoundError('Student not found');
    }
    
    // Invalidate cache
    await studentCache.invalidate();
    await dashboardCache.invalidate();
    
    res.json(updated);
  } catch (err: any) {
    if (err instanceof NotFoundError) throw err;
    throw handleDatabaseError(err);
  }
});

export const deleteStudent = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await StudentModel.delete(req.params.id);
  if (!deleted) {
    throw new NotFoundError('Student not found');
  }
  
  // Invalidate cache
  await studentCache.invalidate();
  await dashboardCache.invalidate();
  
  res.status(204).send();
}); 