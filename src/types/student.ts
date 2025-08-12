import { NoteType, ConsultationType } from './shared';

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  yearOfStudy: '1st year' | '2nd year' | '3rd year' | '4th year' | 'Graduate' | 'Alumni';
  programType: "Bachelor's" | "Master's";
  specificProgram: string;
  major?: string; // For Business Administration specializations
  dateAdded: string;
  lastInteraction?: string;
  status: 'Active' | 'Inactive' | 'Graduated';
  avatar?: string;
  notes: Note[];
  consultations: Consultation[];
  followUpReminders: FollowUpReminder[];
  academicStartDate?: string; // When they started their program
  expectedGraduationDate?: string; // When they're expected to graduate
  // Career services specific fields
  careerInterests?: string[];
  linkedinUrl?: string;
  resumeOnFile?: boolean;
  resumeLastUpdated?: string;
  jobSearchStatus?: 'Not Started' | 'Preparing' | 'Actively Searching' | 'Interviewing' | 'Offer Received' | 'Employed' | 'Not Seeking';
  targetIndustries?: string[];
  targetLocations?: string[];
  tags?: string[];
  quickNote?: string;
  // Attendance tracking
  noShowCount?: number;
  lastNoShowDate?: string;
  lastAttendanceStatus?: 'attended' | 'no-show' | 'cancelled' | 'rescheduled' | 'scheduled';
}

export interface Note {
  id: string;
  content: string;
  date: string;
  dateCreated?: string; // Alternative field name when notes come from API directly
  type: NoteType;
  tags: string[];
  isPinned?: boolean;
  color?: string;
  createdBy?: string;
  isImportant?: boolean;
  studentYearAtTime?: string; // What year the student was when this note was created
  updatedAt?: string;
}

export interface Consultation {
  id: string;
  type: ConsultationType;
  date: string;
  duration?: number; // in minutes
  attended: boolean;
  notes: string;
  followUpRequired: boolean;
  followUpDate?: string;
  outcome?: string;
  studentYearAtTime?: string; // What year the student was when this consultation happened
  // New fields for status and tags
  status?: 'scheduled' | 'attended' | 'no-show' | 'cancelled' | 'rescheduled';
  statusUpdatedAt?: string;
  statusUpdatedBy?: string;
  cancellationReason?: string;
  cancellationMethod?: 'calendly' | 'email' | 'phone' | 'no-notice' | 'other';
  meetingLink?: string;
  needsReview?: boolean; // Flag to indicate consultation type needs manual review (e.g., from Calendly)
  tags?: Array<{
    id: string;
    name: string;
    color: string;
    icon?: string;
    category?: string;
  }>;
}

export interface FollowUpReminder {
  id: string;
  date: string;
  description: string;
  completed: boolean;
  consultationId?: string;
}

// ConsultationType is now imported from shared/types

export interface StudentFilters {
  search: string;
  yearOfStudy: string;
  programType: string;
  specificProgram: string;
  status: string;
  sortBy: 'name' | 'dateAdded' | 'lastInteraction';
  sortOrder: 'asc' | 'desc';
}

export interface ViewSettings {
  viewMode: 'table' | 'cards';
  itemsPerPage: number;
  currentPage: number;
}