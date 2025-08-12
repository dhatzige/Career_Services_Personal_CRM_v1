// Career Services specific types

export interface Application {
  id: string;
  student_id: string;
  type: 'Internship' | 'Full-time' | 'Part-time' | 'Co-op' | 'Fellowship';
  company_name: string;
  position_title: string;
  application_date: string;
  status: 'Planning' | 'Applied' | 'Phone Screen' | 'Interview Scheduled' | 'Interviewed' | 'Offer' | 'Rejected' | 'Accepted' | 'Declined';
  application_method?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  location?: string;
  salary_range?: string;
  notes?: string;
  follow_up_date?: string;
  response_date?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkshopAttendance {
  id: string;
  student_id: string;
  workshop_name: string;
  workshop_date: string;
  workshop_type: 'Resume Writing' | 'Interview Skills' | 'Networking' | 'Job Search Strategy' | 'LinkedIn' | 'Career Fair Prep' | 'Industry Specific' | 'Other';
  attended: boolean;
  feedback?: string;
  created_at: string;
}

export interface CareerDocument {
  id: string;
  student_id: string;
  document_type: 'Resume' | 'Cover Letter' | 'Portfolio' | 'LinkedIn Profile' | 'Other';
  version_number: number;
  review_date?: string;
  reviewer_notes?: string;
  improvements_made?: string;
  file_path?: string;
  created_at: string;
  updated_at: string;
}

export interface MockInterview {
  id: string;
  student_id: string;
  interview_date: string;
  interview_type: 'Behavioral' | 'Technical' | 'Case Study' | 'Phone Screen' | 'Panel' | 'Informational';
  interviewer_name?: string;
  company_focus?: string;
  strengths?: string;
  areas_for_improvement?: string;
  overall_rating?: number;
  resources_recommended?: string;
  follow_up_scheduled: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployerConnection {
  id: string;
  student_id: string;
  company_name: string;
  contact_name?: string;
  contact_title?: string;
  contact_email?: string;
  contact_phone?: string;
  linkedin_profile?: string;
  connection_date?: string;
  connection_type: 'Career Fair' | 'Alumni Referral' | 'Cold Outreach' | 'Campus Event' | 'Informational Interview' | 'Other';
  notes?: string;
  follow_up_status?: string;
  last_contact_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CareerServicesStudent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  year_of_study?: string;
  program_type?: string;
  specific_program?: string;
  major?: string;
  status: string;
  expected_graduation?: string;
  career_interests?: string[];
  linkedin_url?: string;
  resume_on_file: boolean;
  resume_last_updated?: string;
  job_search_status?: 'Not Started' | 'Preparing' | 'Actively Searching' | 'Interviewing' | 'Offer Received' | 'Employed' | 'Not Seeking';
  target_industries?: string[];
  target_locations?: string[];
  last_interaction?: string;
  tags?: string[];
  applications?: Application[];
  workshops?: WorkshopAttendance[];
  documents?: CareerDocument[];
  mock_interviews?: MockInterview[];
  employer_connections?: EmployerConnection[];
}