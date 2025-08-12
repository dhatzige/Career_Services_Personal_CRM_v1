import { Request, Response, NextFunction } from 'express';
import { StudentModel } from '../models/Student';
import { EmailService } from '../services/emailService';
import { studentCache, dashboardCache } from '../utils/cache';
import { asyncHandler, NotFoundError, ValidationError, handleDatabaseError } from '../middleware/errorHandler';
import * as Sentry from '@sentry/node';

export const getAllStudents = asyncHandler(async (req: Request, res: Response) => {
  const students = await studentCache.getList(() => StudentModel.findAll());
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
    // Transform snake_case to camelCase for the model
    const studentData = {
      firstName: req.body.first_name,
      lastName: req.body.last_name,
      email: req.body.email,
      phone: req.body.phone,
      yearOfStudy: req.body.year_of_study,
      programType: req.body.program_type,
      specificProgram: req.body.specific_program,
      major: req.body.major,
      academicStartDate: req.body.academic_start_date,
      expectedGraduation: req.body.expected_graduation,
      careerInterests: req.body.career_interests,
      linkedinUrl: req.body.linkedin_url,
      resumeOnFile: req.body.resume_on_file,
      jobSearchStatus: req.body.job_search_status,
      targetIndustries: req.body.target_industries,
      targetLocations: req.body.target_locations,
      tags: req.body.tags,
      quickNote: req.body.quick_note
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
    // Transform snake_case to camelCase for the model
    const updates: any = {};
    if (req.body.first_name !== undefined) updates.firstName = req.body.first_name;
    if (req.body.last_name !== undefined) updates.lastName = req.body.last_name;
    if (req.body.email !== undefined) updates.email = req.body.email;
    if (req.body.phone !== undefined) updates.phone = req.body.phone;
    if (req.body.year_of_study !== undefined) updates.yearOfStudy = req.body.year_of_study;
    if (req.body.program_type !== undefined) updates.programType = req.body.program_type;
    if (req.body.specific_program !== undefined) updates.specificProgram = req.body.specific_program;
    if (req.body.major !== undefined) updates.major = req.body.major;
    if (req.body.academic_start_date !== undefined) updates.academicStartDate = req.body.academic_start_date;
    if (req.body.expected_graduation !== undefined) updates.expectedGraduation = req.body.expected_graduation;
    if (req.body.career_interests !== undefined) updates.careerInterests = req.body.career_interests;
    if (req.body.linkedin_url !== undefined) updates.linkedinUrl = req.body.linkedin_url;
    if (req.body.resume_on_file !== undefined) updates.resumeOnFile = req.body.resume_on_file;
    if (req.body.job_search_status !== undefined) updates.jobSearchStatus = req.body.job_search_status;
    if (req.body.target_industries !== undefined) updates.targetIndustries = req.body.target_industries;
    if (req.body.target_locations !== undefined) updates.targetLocations = req.body.target_locations;
    if (req.body.tags !== undefined) updates.tags = req.body.tags;
    if (req.body.quick_note !== undefined) updates.quickNote = req.body.quick_note;
    if (req.body.lastAttendanceStatus !== undefined) updates.lastAttendanceStatus = req.body.lastAttendanceStatus;
    
    
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