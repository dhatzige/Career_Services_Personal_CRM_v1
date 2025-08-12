import { Student, Consultation, Note, FollowUpReminder } from '../types/student';
import { updateStudentAcademicYear, getStudentYearAtDate } from './academicProgression';

const STUDENTS_KEY = 'crm_students';
const STUDENT_COUNTER_KEY = 'crm_student_counter';

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const getNextStudentNumber = (): number => {
  const current = localStorage.getItem(STUDENT_COUNTER_KEY);
  const next = current ? parseInt(current) + 1 : 1;
  localStorage.setItem(STUDENT_COUNTER_KEY, next.toString());
  return next;
};

export const saveStudents = (students: Student[]): void => {
  // Update academic years before saving
  const updatedStudents = students.map(updateStudentAcademicYear);
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(updatedStudents));
};

export const loadStudents = (): Student[] => {
  const data = localStorage.getItem(STUDENTS_KEY);
  if (!data) return [];
  
  try {
    const students = JSON.parse(data);
    // Update academic years when loading
    return students.map(updateStudentAcademicYear);
  } catch {
    return [];
  }
};

export const addStudent = (student: Omit<Student, 'id' | 'dateAdded' | 'notes' | 'consultations' | 'followUpReminders'>): Student => {
  const students = loadStudents();
  const newStudent: Student = {
    ...student,
    id: generateId(),
    dateAdded: new Date().toISOString(),
    notes: [],
    consultations: [],
    followUpReminders: [],
    status: 'Active'
  };
  
  students.push(newStudent);
  saveStudents(students);
  return newStudent;
};

export const updateStudent = (id: string, updates: Partial<Student>): Student | null => {
  const students = loadStudents();
  const index = students.findIndex(s => s.id === id);
  
  if (index === -1) return null;
  
  students[index] = { ...students[index], ...updates };
  saveStudents(students);
  return students[index];
};

export const deleteStudent = (id: string): boolean => {
  const students = loadStudents();
  const filtered = students.filter(s => s.id !== id);
  
  if (filtered.length === students.length) return false;
  
  saveStudents(filtered);
  return true;
};

export const getStudent = (id: string): Student | null => {
  const students = loadStudents();
  return students.find(s => s.id === id) || null;
};

export const addNoteToStudent = (studentId: string, note: Omit<Note, 'id' | 'dateCreated' | 'studentYearAtTime'>): boolean => {
  const students = loadStudents();
  const student = students.find(s => s.id === studentId);
  
  if (!student) return false;
  
  const noteDate = new Date().toISOString();
  const studentYearAtTime = getStudentYearAtDate(student, noteDate);
  
  const newNote: Note = {
    ...note,
    id: generateId(),
    dateCreated: noteDate,
    studentYearAtTime
  };
  
  student.notes.push(newNote);
  student.lastInteraction = noteDate;
  saveStudents(students);
  return true;
};

export const addConsultationToStudent = (studentId: string, consultation: Omit<Consultation, 'id' | 'studentYearAtTime'>): boolean => {
  const students = loadStudents();
  const student = students.find(s => s.id === studentId);
  
  if (!student) return false;
  
  const studentYearAtTime = getStudentYearAtDate(student, consultation.date);
  
  const newConsultation: Consultation = {
    ...consultation,
    id: generateId(),
    studentYearAtTime
  };
  
  student.consultations.push(newConsultation);
  student.lastInteraction = consultation.date;
  saveStudents(students);
  return true;
};

export const addFollowUpReminder = (studentId: string, reminder: Omit<FollowUpReminder, 'id'>): boolean => {
  const students = loadStudents();
  const student = students.find(s => s.id === studentId);
  
  if (!student) return false;
  
  const newReminder: FollowUpReminder = {
    ...reminder,
    id: generateId()
  };
  
  student.followUpReminders.push(newReminder);
  saveStudents(students);
  return true;
};

export const updateConsultationForStudent = (studentId: string, consultationId: string, updates: Partial<Consultation>): boolean => {
  const students = loadStudents();
  const student = students.find(s => s.id === studentId);
  if (!student) return false;
  const index = student.consultations.findIndex(c => c.id === consultationId);
  if (index === -1) return false;
  student.consultations[index] = { ...student.consultations[index], ...updates };
  saveStudents(students);
  return true;
};

export const deleteConsultationFromStudent = (studentId: string, consultationId: string): boolean => {
  const students = loadStudents();
  const student = students.find(s => s.id === studentId);
  if (!student) return false;
  const originalLength = student.consultations.length;
  student.consultations = student.consultations.filter(c => c.id !== consultationId);
  if (student.consultations.length === originalLength) return false;
  saveStudents(students);
  return true;
};

// Initialize with empty data
export const initializeSampleData = (): void => {
  // No longer initializes sample data - starts with empty state
  return;
};