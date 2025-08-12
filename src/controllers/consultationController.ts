import { Request, Response } from 'express';
import { ConsultationModel } from '../models/Consultation';
import { StudentModel } from '../models/Student';

export const getConsultationsForStudent = async (req: Request, res: Response) => {
  try {
    const consultations = await ConsultationModel.findByStudentId(req.params.studentId);
    res.json(consultations);
    return;
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch consultations' });
    return;
  }
};

export const getConsultationById = async (req: Request, res: Response) => {
  try {
    const consultation = await ConsultationModel.findById(req.params.id);
    if (!consultation) {
      res.status(404).json({ error: 'Consultation not found' });
      return;
    }
    res.json(consultation);
    return;
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch consultation' });
    return;
  }
};

export const createConsultationForStudent = async (req: Request, res: Response) => {
  try {
    const consultationData = {
      ...req.body,
      studentId: req.params.studentId
    };
    const consultation = await ConsultationModel.create(consultationData);
    res.status(201).json(consultation);
    return;
  } catch (err) {
    res.status(400).json({ error: 'Failed to create consultation' });
    return;
  }
};

export const updateConsultation = async (req: Request, res: Response) => {
  try {
    // Get the current consultation to check for status changes
    const currentConsultation = await ConsultationModel.findById(req.params.id);
    if (!currentConsultation) {
      res.status(404).json({ error: 'Consultation not found' });
      return;
    }

    // Update the consultation
    const updated = await ConsultationModel.update(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Consultation not found' });
      return;
    }

    // If status changed to no-show, update student's no-show counter
    if (req.body.status === 'no-show' && currentConsultation.status !== 'no-show') {
      const student = await StudentModel.findById(currentConsultation.studentId);
      if (student) {
        await StudentModel.update(currentConsultation.studentId, {
          noShowCount: (student.noShowCount || 0) + 1,
          lastNoShowDate: new Date().toISOString()
        });
      }
    }
    // If status changed from no-show to something else, decrement counter
    else if (currentConsultation.status === 'no-show' && req.body.status !== 'no-show') {
      const student = await StudentModel.findById(currentConsultation.studentId);
      if (student && student.noShowCount > 0) {
        await StudentModel.update(currentConsultation.studentId, {
          noShowCount: student.noShowCount - 1
        });
      }
    }

    res.json(updated);
    return;
  } catch (err) {
    console.error('Error updating consultation:', err);
    res.status(400).json({ error: 'Failed to update consultation', details: err.message });
    return;
  }
};

export const deleteConsultation = async (req: Request, res: Response) => {
  try {
    const deleted = await ConsultationModel.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Consultation not found' });
      return;
    }
    res.json({ message: 'Consultation deleted' });
    return;
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete consultation' });
    return;
  }
}; 