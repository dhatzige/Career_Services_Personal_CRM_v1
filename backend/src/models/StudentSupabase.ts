import { supabase } from '../database/supabase';
import { DbStudent } from '../database/supabase';
import { Student } from '../types';
import { generateId } from '../database';
import logger from '../utils/logger';

export class StudentSupabaseModel {
  // Convert database row to application model
  private static mapDbToModel(dbStudent: DbStudent): Student {
    return {
      id: dbStudent.id,
      firstName: dbStudent.first_name,
      lastName: dbStudent.last_name,
      email: dbStudent.email,
      phone: dbStudent.phone,
      yearOfStudy: dbStudent.year_of_study as any,
      programType: dbStudent.program_type as any,
      specificProgram: dbStudent.specific_program,
      major: dbStudent.major,
      status: dbStudent.status === 'active' ? 'Active' : 
              dbStudent.status === 'inactive' ? 'Inactive' : 'Graduated',
      dateAdded: dbStudent.created_at,
      lastInteraction: dbStudent.updated_at,
      academicStartDate: dbStudent.academic_start_date,
      expectedGraduation: dbStudent.expected_graduation,
      avatar: dbStudent.avatar,
      tags: dbStudent.tags || [],
      careerInterests: dbStudent.career_interests || [],
      linkedinUrl: dbStudent.linkedin_url,
      resumeOnFile: dbStudent.resume_on_file,
      resumeLastUpdated: dbStudent.resume_last_updated,
      jobSearchStatus: dbStudent.job_search_status as any,
      targetIndustries: dbStudent.target_industries || [],
      targetLocations: dbStudent.target_locations || [],
      createdAt: dbStudent.created_at,
      updatedAt: dbStudent.updated_at
    };
  }

  // Convert application model to database row
  private static mapModelToDb(student: Partial<Student>): Partial<DbStudent> {
    const dbStudent: Partial<DbStudent> = {};
    
    if (student.firstName !== undefined) dbStudent.first_name = student.firstName;
    if (student.lastName !== undefined) dbStudent.last_name = student.lastName;
    if (student.email !== undefined) dbStudent.email = student.email;
    if (student.phone !== undefined) dbStudent.phone = student.phone;
    if (student.yearOfStudy !== undefined) dbStudent.year_of_study = student.yearOfStudy;
    if (student.programType !== undefined) dbStudent.program_type = student.programType;
    if (student.specificProgram !== undefined) dbStudent.specific_program = student.specificProgram;
    if (student.major !== undefined) dbStudent.major = student.major;
    if (student.status !== undefined) {
      dbStudent.status = student.status === 'Active' ? 'active' : 
                        student.status === 'Inactive' ? 'inactive' : 'graduated';
    }
    if (student.academicStartDate !== undefined) dbStudent.academic_start_date = student.academicStartDate;
    if (student.expectedGraduation !== undefined) dbStudent.expected_graduation = student.expectedGraduation;
    if (student.avatar !== undefined) dbStudent.avatar = student.avatar;
    if (student.tags !== undefined) dbStudent.tags = student.tags;
    if (student.careerInterests !== undefined) dbStudent.career_interests = student.careerInterests;
    if (student.linkedinUrl !== undefined) dbStudent.linkedin_url = student.linkedinUrl;
    if (student.resumeOnFile !== undefined) dbStudent.resume_on_file = student.resumeOnFile;
    if (student.resumeLastUpdated !== undefined) dbStudent.resume_last_updated = student.resumeLastUpdated;
    if (student.jobSearchStatus !== undefined) dbStudent.job_search_status = student.jobSearchStatus;
    if (student.targetIndustries !== undefined) dbStudent.target_industries = student.targetIndustries;
    if (student.targetLocations !== undefined) dbStudent.target_locations = student.targetLocations;
    
    return dbStudent;
  }

  static async findAll(): Promise<Student[]> {
    if (!supabase) throw new Error('Supabase not initialized');
    
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(this.mapDbToModel);
    } catch (error) {
      logger.error('Failed to fetch students from Supabase', { error });
      throw error;
    }
  }

  static async findById(id: string): Promise<Student | null> {
    if (!supabase) throw new Error('Supabase not initialized');
    
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      
      return data ? this.mapDbToModel(data) : null;
    } catch (error) {
      logger.error('Failed to fetch student from Supabase', { error, id });
      throw error;
    }
  }

  static async create(studentData: Partial<Student>): Promise<Student> {
    if (!supabase) throw new Error('Supabase not initialized');
    
    try {
      const id = generateId();
      const dbData = {
        id,
        ...this.mapModelToDb(studentData),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('students')
        .insert(dbData)
        .select()
        .single();
      
      if (error) throw error;
      
      return this.mapDbToModel(data);
    } catch (error) {
      logger.error('Failed to create student in Supabase', { error, studentData });
      throw error;
    }
  }

  static async update(id: string, updates: Partial<Student>): Promise<boolean> {
    if (!supabase) throw new Error('Supabase not initialized');
    
    try {
      const dbUpdates = {
        ...this.mapModelToDb(updates),
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('students')
        .update(dbUpdates)
        .eq('id', id);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      logger.error('Failed to update student in Supabase', { error, id, updates });
      throw error;
    }
  }

  static async delete(id: string): Promise<boolean> {
    if (!supabase) throw new Error('Supabase not initialized');
    
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      logger.error('Failed to delete student from Supabase', { error, id });
      throw error;
    }
  }

  // Search students with filters
  static async search(filters: {
    query?: string;
    status?: string;
    programType?: string;
    yearOfStudy?: string;
    jobSearchStatus?: string;
  }): Promise<Student[]> {
    if (!supabase) throw new Error('Supabase not initialized');
    
    try {
      let query = supabase.from('students').select('*');
      
      // Text search across multiple fields
      if (filters.query) {
        query = query.or(`first_name.ilike.%${filters.query}%,last_name.ilike.%${filters.query}%,email.ilike.%${filters.query}%`);
      }
      
      // Filter by status
      if (filters.status) {
        const dbStatus = filters.status === 'Active' ? 'active' : 
                        filters.status === 'Inactive' ? 'inactive' : 'graduated';
        query = query.eq('status', dbStatus);
      }
      
      // Filter by program type
      if (filters.programType) {
        query = query.eq('program_type', filters.programType);
      }
      
      // Filter by year of study
      if (filters.yearOfStudy) {
        query = query.eq('year_of_study', filters.yearOfStudy);
      }
      
      // Filter by job search status
      if (filters.jobSearchStatus) {
        query = query.eq('job_search_status', filters.jobSearchStatus);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(this.mapDbToModel);
    } catch (error) {
      logger.error('Failed to search students in Supabase', { error, filters });
      throw error;
    }
  }

  // Get students with pagination
  static async paginate(page: number = 1, limit: number = 20): Promise<{
    students: Student[];
    total: number;
    pages: number;
  }> {
    if (!supabase) throw new Error('Supabase not initialized');
    
    try {
      const offset = (page - 1) * limit;
      
      // Get total count
      const { count } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });
      
      // Get paginated data
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      
      return {
        students: (data || []).map(this.mapDbToModel),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      logger.error('Failed to paginate students in Supabase', { error, page, limit });
      throw error;
    }
  }

  // Real-time subscription for student updates
  static subscribeToChanges(callback: (student: Student, event: 'INSERT' | 'UPDATE' | 'DELETE') => void) {
    if (!supabase) throw new Error('Supabase not initialized');
    
    const subscription = supabase
      .channel('students_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'students' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            callback({ id: payload.old.id } as Student, 'DELETE');
          } else {
            const student = this.mapDbToModel(payload.new as DbStudent);
            callback(student, payload.eventType as 'INSERT' | 'UPDATE');
          }
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }
}