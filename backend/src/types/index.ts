// Database model interfaces
export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  yearOfStudy?: '1st year' | '2nd year' | '3rd year' | '4th year' | 'Graduate' | 'Alumni';
  programType?: "Bachelor's" | "Master's";
  specificProgram?: string;
  major?: string;
  status: 'Active' | 'Inactive' | 'Graduated';
  dateAdded: string;
  lastInteraction?: string;
  academicStartDate?: string;
  expectedGraduation?: string;
  avatar?: string;
  tags?: string[];
  // Career services specific fields
  careerInterests?: string[];
  linkedinUrl?: string;
  resumeOnFile: boolean;
  resumeLastUpdated?: string;
  jobSearchStatus?: 'Not Started' | 'Preparing' | 'Actively Searching' | 'Searching for Internship' | 'Currently Interning' | 'Interviewing' | 'Offer Received' | 'Employed' | 'Not Seeking';
  targetIndustries?: string[];
  targetLocations?: string[];
  quickNote?: string;
  // Attendance tracking
  noShowCount?: number;
  lastNoShowDate?: string;
  lastAttendanceStatus?: 'attended' | 'no-show' | 'cancelled' | 'rescheduled' | 'scheduled';
  // Relations
  notes?: Note[];
  consultations?: Consultation[];
  followUpReminders?: FollowUpReminder[];
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  content: string;
  type: 'General' | 'Academic' | 'Personal' | 'Follow-up' | 'Alert' | 'Career Planning' | 'Interview Prep';
  dateCreated: string;
  studentYearAtTime?: string;
  tags?: string[];
  updatedAt: string;
}

export interface Consultation {
  id: string;
  studentId: string;
  type: string; // More flexible for different consultation types
  date: string;
  duration: number;
  attended: boolean;
  notes?: string;
  followUpRequired: boolean;
  location?: string;
  topic?: string;
  followUpNotes?: string;
  status?: 'scheduled' | 'completed' | 'cancelled' | 'no-show'; // Derived field, not in DB
  needsReview?: boolean; // Flag to indicate consultation type needs manual review (e.g., from Calendly)
  student?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface FollowUpReminder {
  id: string;
  studentId: string;
  date: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  completedAt?: string;
  dateCreated: string;
  dateUpdated: string;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  isConfigured: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// Request/Response interfaces
export interface CreateStudentRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  yearOfStudy?: '1st year' | '2nd year' | '3rd year' | '4th year' | 'Graduate' | 'Alumni';
  programType?: "Bachelor's" | "Master's";
  specificProgram?: string;
  major?: string;
  academicStartDate?: string;
  expectedGraduation?: string;
  careerInterests?: string[];
  linkedinUrl?: string;
  resumeOnFile?: boolean;
  jobSearchStatus?: 'Not Started' | 'Preparing' | 'Actively Searching' | 'Searching for Internship' | 'Currently Interning' | 'Interviewing' | 'Offer Received' | 'Employed' | 'Not Seeking';
  targetIndustries?: string[];
  targetLocations?: string[];
  tags?: string[];
  quickNote?: string;
}

export interface UpdateStudentRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  yearOfStudy?: '1st year' | '2nd year' | '3rd year' | '4th year' | 'Graduate' | 'Alumni';
  programType?: "Bachelor's" | "Master's";
  specificProgram?: string;
  major?: string;
  status?: 'Active' | 'Inactive' | 'Graduated';
  academicStartDate?: string;
  expectedGraduation?: string;
  careerInterests?: string[];
  linkedinUrl?: string;
  resumeOnFile?: boolean;
  jobSearchStatus?: 'Not Started' | 'Preparing' | 'Actively Searching' | 'Searching for Internship' | 'Currently Interning' | 'Interviewing' | 'Offer Received' | 'Employed' | 'Not Seeking';
  targetIndustries?: string[];
  targetLocations?: string[];
  tags?: string[];
  quickNote?: string;
  noShowCount?: number;
  lastNoShowDate?: string;
  lastAttendanceStatus?: 'attended' | 'no-show' | 'cancelled' | 'rescheduled' | 'scheduled';
}

export interface CreateNoteRequest {
  content: string;
  type: 'General' | 'Academic' | 'Personal' | 'Follow-up' | 'Alert' | 'Career Planning' | 'Interview Prep';
  tags?: string[];
}

export interface CreateConsultationRequest {
  studentId?: string;
  type?: string;
  date: string;
  duration: number;
  needsReview?: boolean;
  attended?: boolean;
  status?: 'scheduled' | 'attended' | 'no-show' | 'cancelled' | 'rescheduled';
  notes?: string;
  followUpRequired?: boolean;
  location?: string;
  topic?: string;
  followUpNotes?: string;
}

export interface CreateFollowUpReminderRequest {
  date: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface AuthRequest {
  username?: string;
  password: string;
  email?: string;
  stayLoggedIn?: boolean;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

export interface SearchRequest {
  query?: string;
  filters?: SearchFilters;
  sortBy?: 'firstName' | 'lastName' | 'dateAdded' | 'lastInteraction';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchFilters {
  status?: 'Active' | 'Inactive' | 'Graduated';
  yearOfStudy?: '1st year' | '2nd year' | '3rd year' | '4th year' | 'Graduate' | 'Alumni';
  programType?: "Bachelor's" | "Master's";
  tags?: string[];
}

// API Response interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: any;
}

// AI Report interfaces
export interface AIReportRequest {
  monthlyData: {
    totalStudents: number;
    consultations: number;
    newStudents: number;
    graduatedStudents: number;
  };
  students: Student[];
  consultations: Consultation[];
  trends: {
    consultationGrowth: number;
    studentGrowth: number;
    averageSessionsPerStudent: number;
  };
}

export interface AIReportResponse {
  summary: string;
  insights: string[];
  recommendations: string[];
  trends: Array<{
    label: string;
    value: string;
    trend: 'up' | 'down' | 'stable';
  }>;
  keyMetrics: Array<{
    name: string;
    value: string;
    change: string;
  }>;
}

// Activity Log interface
export interface ActivityLog {
  id: string;
  studentId?: string;
  activityType: 'student_created' | 'student_updated' | 'note_added' | 'consultation_created' | 'consultation_updated' | 'follow_up_completed' | 'login' | 'system_event';
  description: string;
  metadata?: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
} 