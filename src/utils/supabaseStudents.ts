import { supabase } from '../contexts/CleanSupabaseAuth';
import { Student } from '../types/student';

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const addStudentToSupabase = async (
  studentData: Omit<Student, 'id' | 'dateAdded' | 'notes' | 'consultations' | 'followUpReminders'>
): Promise<Student> => {
  try {
    // Insert the student into Supabase
    const { data, error } = await supabase
      .from('students')
      .insert({
        first_name: studentData.firstName,
        last_name: studentData.lastName,
        email: studentData.email,
        phone: studentData.phone || null,
        year_of_study: studentData.yearOfStudy,
        program_type: studentData.programType,
        specific_program: studentData.specificProgram,
        major: studentData.major || null,
        status: studentData.status || 'Active',
        academic_start_date: studentData.academicStartDate,
        avatar: studentData.avatar || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Transform back to Student type
    const newStudent: Student = {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      yearOfStudy: data.year_of_study,
      programType: data.program_type,
      specificProgram: data.specific_program,
      major: data.major,
      status: data.status,
      avatar: data.avatar,
      dateAdded: data.created_at,
      academicStartDate: data.academic_start_date,
      notes: [],
      consultations: [],
      followUpReminders: []
    };

    return newStudent;
  } catch (error) {
    console.error('Error adding student to Supabase:', error);
    throw error;
  }
};

export const updateStudentInSupabase = async (
  id: string, 
  updates: Partial<Student>
): Promise<Student | null> => {
  try {
    const supabaseUpdates: any = {};
    
    // Map Student fields to Supabase columns
    if (updates.firstName !== undefined) supabaseUpdates.first_name = updates.firstName;
    if (updates.lastName !== undefined) supabaseUpdates.last_name = updates.lastName;
    if (updates.email !== undefined) supabaseUpdates.email = updates.email;
    if (updates.phone !== undefined) supabaseUpdates.phone = updates.phone;
    if (updates.yearOfStudy !== undefined) supabaseUpdates.year_of_study = updates.yearOfStudy;
    if (updates.programType !== undefined) supabaseUpdates.program_type = updates.programType;
    if (updates.specificProgram !== undefined) supabaseUpdates.specific_program = updates.specificProgram;
    if (updates.major !== undefined) supabaseUpdates.major = updates.major;
    if (updates.status !== undefined) supabaseUpdates.status = updates.status;
    if (updates.avatar !== undefined) supabaseUpdates.avatar = updates.avatar;
    if (updates.academicStartDate !== undefined) supabaseUpdates.academic_start_date = updates.academicStartDate;
    if (updates.expectedGraduationDate !== undefined) supabaseUpdates.expected_graduation = updates.expectedGraduationDate;
    // Career fields
    if (updates.careerInterests !== undefined) supabaseUpdates.career_interests = updates.careerInterests;
    if (updates.linkedinUrl !== undefined) supabaseUpdates.linkedin_url = updates.linkedinUrl;
    if (updates.resumeOnFile !== undefined) supabaseUpdates.resume_on_file = updates.resumeOnFile;
    if (updates.resumeLastUpdated !== undefined) supabaseUpdates.resume_last_updated = updates.resumeLastUpdated;
    if (updates.jobSearchStatus !== undefined) supabaseUpdates.job_search_status = updates.jobSearchStatus;
    if (updates.targetIndustries !== undefined) supabaseUpdates.target_industries = updates.targetIndustries;
    if (updates.targetLocations !== undefined) supabaseUpdates.target_locations = updates.targetLocations;
    if (updates.tags !== undefined) supabaseUpdates.tags = updates.tags;
    
    const { data, error } = await supabase
      .from('students')
      .update(supabaseUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return null;

    // Transform back to Student type
    const updatedStudent: Student = {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      yearOfStudy: data.year_of_study,
      programType: data.program_type,
      specificProgram: data.specific_program,
      major: data.major,
      status: data.status,
      avatar: data.avatar,
      dateAdded: data.created_at,
      academicStartDate: data.academic_start_date,
      notes: [], // These would need to be fetched separately
      consultations: [],
      followUpReminders: []
    };

    return updatedStudent;
  } catch (error) {
    console.error('Error updating student in Supabase:', error);
    return null;
  }
};

export const deleteStudentFromSupabase = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting student from Supabase:', error);
    return false;
  }
};

// Helper function to check if email already exists
export const checkDuplicateEmailInSupabase = async (email: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('id')
      .eq('email', email)
      .single();

    if (error && error.code === 'PGRST116') {
      // No rows returned - email doesn't exist
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Error checking duplicate email:', error);
    return false;
  }
};

// Note operations
export const addNoteToSupabase = async (
  studentId: string,
  content: string,
  type: string = 'General',
  isPrivate: boolean = false,
  _tags: string[] = []
): Promise<any> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('notes')
      .insert({
        student_id: studentId,
        content,
        type,
        is_private: isPrivate,
        created_by: user?.id // Re-add created_by field to match RLS policy
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding note:', error);
    throw error;
  }
};

// Consultation operations
export const updateConsultationInSupabase = async (
  consultationId: string,
  updates: {
    status?: string;
    attended?: boolean;
    notes?: string;
  }
): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('consultations')
      .update(updates)
      .eq('id', consultationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating consultation:', error);
    throw error;
  }
};

export const addConsultationToSupabase = async (
  studentId: string,
  consultationData: {
    type: string;
    scheduledDate: string;
    duration: number;
    notes?: string;
    location?: string;
    meetingLink?: string;
    attended?: boolean;
    status?: string;
  }
): Promise<any> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('consultations')
      .insert({
        student_id: studentId,
        type: consultationData.type,
        consultation_date: consultationData.scheduledDate,
        duration: consultationData.duration,
        attended: consultationData.attended ?? true,
        status: consultationData.status || (consultationData.attended ? 'attended' : 'scheduled'),
        notes: consultationData.notes,
        location: consultationData.location,
        meeting_link: consultationData.meetingLink,
        created_by: user?.id // Re-add created_by field to match RLS policy
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding consultation:', error);
    throw error;
  }
};