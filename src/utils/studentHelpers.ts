import { Student, Consultation } from '../types/student';

// Shared student helper functions to avoid duplication between Grid and Table views

export const isNewStudent = (student: Student): boolean => {
  const createdDate = student.created_at || student.date_added || student.dateAdded || student.createdAt;
  if (!createdDate) return false;
  const daysSinceCreated = Math.floor((new Date().getTime() - new Date(createdDate).getTime()) / (1000 * 3600 * 24));
  return daysSinceCreated <= 2;
};

export const hasUpcomingConsultation = (student: Student, consultations?: Record<string, Consultation[]>): boolean => {
  // Use either student.consultations or consultations lookup
  const studentConsultations = student.consultations || consultations?.[student.id] || [];
  if (studentConsultations.length === 0) return false;
  
  const now = new Date();
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  
  return studentConsultations.some(consultation => {
    const consultDate = new Date(consultation.date || consultation.scheduled_date || consultation.consultation_date);
    return consultDate >= now && consultDate <= weekFromNow && consultation.status !== 'cancelled';
  });
};

export const hasConsultationToday = (student: Student, consultations?: Record<string, Consultation[]>): boolean => {
  // Use either student.consultations or consultations lookup
  const studentConsultations = student.consultations || consultations?.[student.id] || [];
  if (studentConsultations.length === 0) return false;
  
  const now = new Date();
  
  return studentConsultations.some(consultation => {
    const consultDate = new Date(consultation.date || consultation.scheduled_date || consultation.consultation_date);
    
    // Check if consultation is today
    const isToday = consultDate.toDateString() === now.toDateString();
    if (!isToday || consultation.status === 'cancelled') return false;
    
    // Smart timing: Show badge from 30 minutes before until meeting ends
    const thirtyMinsBefore = new Date(consultDate.getTime() - 30 * 60 * 1000);
    const meetingEnd = new Date(consultDate.getTime() + (consultation.duration || 30) * 60 * 1000);
    
    // Show badge if we're in the 30-min window before or during the meeting
    return now >= thirtyMinsBefore && now <= meetingEnd;
  });
};

export const getMostRecentConsultation = (student: Student, consultations?: Record<string, Consultation[]>): Consultation | null => {
  const studentConsultations = student.consultations || consultations?.[student.id] || [];
  if (studentConsultations.length === 0) return null;
  
  // Sort by date and get the most recent
  const sorted = studentConsultations.sort((a, b) => {
    const dateA = new Date(a.date || a.scheduled_date || a.consultation_date);
    const dateB = new Date(b.date || b.scheduled_date || b.consultation_date);
    return dateB.getTime() - dateA.getTime();
  });
  
  return sorted[0];
};