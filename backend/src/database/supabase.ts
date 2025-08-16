import { createClient } from '@supabase/supabase-js';
import logger from '../utils/logger';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

export const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Database health check
export async function checkDatabaseHealth(): Promise<boolean> {
  if (!supabase) {
    return false;
  }
  
  try {
    const { error } = await supabase
      .from('students')
      .select('count')
      .limit(1);
    
    return !error;
  } catch (error) {
    logger.error('Database health check failed', { error });
    return false;
  }
}

// Database types matching our schema
export interface DbStudent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  year_of_study?: string;
  program_type?: string;
  specific_program?: string;
  major?: string;
  status: 'active' | 'inactive' | 'graduated';
  academic_start_date?: string;
  expected_graduation?: string;
  avatar?: string;
  tags?: string[];
  career_interests?: string[];
  linkedin_url?: string;
  resume_on_file: boolean;
  resume_last_updated?: string;
  job_search_status?: string;
  target_industries?: string[];
  target_locations?: string[];
  created_at: string;
  updated_at: string;
}

export interface DbNote {
  id: string;
  student_id: string;
  content: string;
  type: string;
  is_private: boolean;
  student_year_at_time?: string;
  tags?: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DbConsultation {
  id: string;
  student_id: string;
  scheduled_date: string;
  duration_minutes: number;
  consultation_type: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  location?: string;
  meeting_link?: string;
  notes?: string;
  follow_up_required: boolean;
  tags?: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DbApplication {
  id: string;
  student_id: string;
  company_name: string;
  position_title: string;
  application_date: string;
  status: 'applied' | 'interviewing' | 'offered' | 'rejected' | 'accepted' | 'withdrawn';
  application_method?: string;
  job_posting_url?: string;
  salary_range_min?: number;
  salary_range_max?: number;
  location?: string;
  work_type?: 'remote' | 'hybrid' | 'onsite';
  notes?: string;
  next_steps?: string;
  referral_source?: string;
  created_at: string;
  updated_at: string;
}

export interface DbMockInterview {
  id: string;
  student_id: string;
  scheduled_date: string;
  interview_type: string;
  interviewer_name?: string;
  position_type?: string;
  company_focus?: string;
  duration_minutes: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  overall_rating?: number;
  strengths?: string[];
  areas_for_improvement?: string[];
  detailed_feedback?: string;
  recording_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DbCareerDocument {
  id: string;
  student_id: string;
  document_type: 'resume' | 'cover_letter' | 'portfolio' | 'transcript' | 'other';
  file_name: string;
  file_url: string;
  file_size: number;
  version_number: number;
  is_current: boolean;
  uploaded_by: string;
  ai_analysis?: any;
  created_at: string;
  updated_at: string;
}

export interface DbEmployerConnection {
  id: string;
  student_id: string;
  contact_name: string;
  contact_title?: string;
  company_name: string;
  contact_email?: string;
  contact_phone?: string;
  contact_linkedin?: string;
  relationship_type: 'recruiter' | 'alumni' | 'hiring_manager' | 'employee' | 'other';
  last_contact_date?: string;
  notes?: string;
  strength_of_connection: 'weak' | 'medium' | 'strong';
  created_at: string;
  updated_at: string;
}

export interface DbFollowUpReminder {
  id: string;
  student_id: string;
  reminder_type: string;
  due_date: string;
  message: string;
  related_entity_type?: string;
  related_entity_id?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  completed_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Helper function to handle Supabase errors
export function handleSupabaseError(error: any): string {
  if (error.code === '23505') {
    return 'A record with this information already exists';
  }
  if (error.code === '23503') {
    return 'Referenced record not found';
  }
  if (error.code === '42P01') {
    return 'Database table not found. Please run migrations.';
  }
  if (error.code === 'PGRST301') {
    return 'Database query failed. Please check your permissions.';
  }
  return error.message || 'Database operation failed';
}