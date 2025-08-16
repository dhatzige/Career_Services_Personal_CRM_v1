import database, { generateId } from '../database/connection';
import { Student as StudentType, CreateStudentRequest, UpdateStudentRequest } from '../types';

export class StudentModel {
  /**
   * Create a new student
   */
  static async create(data: CreateStudentRequest): Promise<StudentType> {
    const id = generateId();
    const query = `
      INSERT INTO students (
        id, first_name, last_name, email, phone, year_of_study, 
        program_type, specific_program, major, academic_start_date,
        expected_graduation, career_interests, linkedin_url,
        resume_on_file, job_search_status, target_industries,
        target_locations, tags, quick_note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      id,
      data.firstName,
      data.lastName,
      data.email,
      data.phone || null,
      data.yearOfStudy || null,
      data.programType || null,
      data.specificProgram || null,
      data.major || null,
      data.academicStartDate || null,
      data.expectedGraduation || null,
      JSON.stringify(data.careerInterests || []),
      data.linkedinUrl || null,
      data.resumeOnFile ? 1 : 0,
      data.jobSearchStatus || 'Not Started',
      JSON.stringify(data.targetIndustries || []),
      JSON.stringify(data.targetLocations || []),
      JSON.stringify(data.tags || []),
      data.quickNote || null
    ];

    await database.query(query, values);
    
    // Fetch the created student
    const result = await database.query('SELECT * FROM students WHERE id = ?', [id]);
    return this.transformFromDb(result.rows[0]);
  }

  /**
   * Find student by ID
   */
  static async findById(id: string): Promise<StudentType | null> {
    const query = 'SELECT * FROM students WHERE id = ?';
    const result = await database.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.transformFromDb(result.rows[0]);
  }

  /**
   * Find student by email
   */
  static async findByEmail(email: string): Promise<StudentType | null> {
    const query = 'SELECT * FROM students WHERE email = ?';
    const result = await database.query(query, [email]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.transformFromDb(result.rows[0]);
  }

  /**
   * Get all students with optional filters
   */
  static async findAll(filters?: any): Promise<StudentType[]> {
    // First get students without JSON aggregation
    let query = `
      SELECT s.*
      FROM students s
      WHERE 1=1
    `;
    const values: any[] = [];
    let paramIndex = 1;

    if (filters) {
      if (filters.status) {
        query += ` AND s.status = ?`;
        values.push(filters.status);
      }
      if (filters.yearOfStudy) {
        query += ` AND s.year_of_study = ?`;
        values.push(filters.yearOfStudy);
      }
      if (filters.programType) {
        query += ` AND s.program_type = ?`;
        values.push(filters.programType);
      }
      if (filters.jobSearchStatus) {
        query += ` AND s.job_search_status = ?`;
        values.push(filters.jobSearchStatus);
      }
    }

    // Sort by most recently added/updated students first
    query += ' ORDER BY COALESCE(s.updated_at, s.created_at, s.date_added) DESC';

    const result = await database.query(query, values);
    const students = result.rows.map(row => this.transformFromDb(row));
    
    // Now fetch consultations and notes for each student
    for (const student of students) {
      // Get consultations
      const consultationsQuery = `
        SELECT id, consultation_date as date, attended, type, duration, notes, 
               follow_up_required as followUpRequired,
               CASE WHEN attended = 1 THEN 'attended' ELSE 'scheduled' END as status
        FROM consultations
        WHERE student_id = ?
        ORDER BY consultation_date DESC
      `;
      const consultationsResult = await database.query(consultationsQuery, [student.id]);
      (student as any).consultations = consultationsResult.rows || [];
      
      
      // Get notes
      const notesQuery = `
        SELECT id, content, type, date_created as date, tags
        FROM notes
        WHERE student_id = ?
        ORDER BY date_created DESC
      `;
      const notesResult = await database.query(notesQuery, [student.id]);
      (student as any).notes = notesResult.rows.map((note: any) => ({
        ...note,
        tags: note.tags ? JSON.parse(note.tags) : []
      }));
    }
    
    return students;
  }

  /**
   * Update student
   */
  static async update(id: string, data: UpdateStudentRequest): Promise<StudentType | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic update query
    if (data.firstName !== undefined) {
      updates.push(`first_name = ?`);
      values.push(data.firstName);
    }
    if (data.lastName !== undefined) {
      updates.push(`last_name = ?`);
      values.push(data.lastName);
    }
    if (data.email !== undefined) {
      updates.push(`email = ?`);
      values.push(data.email);
    }
    if (data.phone !== undefined) {
      updates.push(`phone = ?`);
      values.push(data.phone);
    }
    if (data.yearOfStudy !== undefined) {
      updates.push(`year_of_study = ?`);
      values.push(data.yearOfStudy);
    }
    if (data.programType !== undefined) {
      updates.push(`program_type = ?`);
      values.push(data.programType);
    }
    if (data.specificProgram !== undefined) {
      updates.push(`specific_program = ?`);
      values.push(data.specificProgram);
    }
    if (data.major !== undefined) {
      updates.push(`major = ?`);
      values.push(data.major);
    }
    if (data.status !== undefined) {
      updates.push(`status = ?`);
      values.push(data.status);
    }
    if (data.expectedGraduation !== undefined) {
      updates.push(`expected_graduation = ?`);
      values.push(data.expectedGraduation);
    }
    if (data.careerInterests !== undefined) {
      updates.push(`career_interests = ?`);
      values.push(JSON.stringify(data.careerInterests));
    }
    if (data.linkedinUrl !== undefined) {
      updates.push(`linkedin_url = ?`);
      values.push(data.linkedinUrl);
    }
    if (data.resumeOnFile !== undefined) {
      updates.push(`resume_on_file = ?`);
      values.push(data.resumeOnFile ? 1 : 0);
    }
    if (data.jobSearchStatus !== undefined) {
      updates.push(`job_search_status = ?`);
      values.push(data.jobSearchStatus);
    }
    if (data.targetIndustries !== undefined) {
      updates.push(`target_industries = ?`);
      values.push(JSON.stringify(data.targetIndustries));
    }
    if (data.targetLocations !== undefined) {
      updates.push(`target_locations = ?`);
      values.push(JSON.stringify(data.targetLocations));
    }
    if (data.tags !== undefined) {
      updates.push(`tags = ?`);
      values.push(JSON.stringify(data.tags));
    }
    if (data.academicStartDate !== undefined) {
      updates.push(`academic_start_date = ?`);
      values.push(data.academicStartDate);
    }
    if (data.quickNote !== undefined) {
      updates.push(`quick_note = ?`);
      values.push(data.quickNote);
    }
    if (data.noShowCount !== undefined) {
      updates.push(`no_show_count = ?`);
      values.push(data.noShowCount);
    }
    if (data.lastNoShowDate !== undefined) {
      updates.push(`last_no_show_date = ?`);
      values.push(data.lastNoShowDate);
    }
    if (data.lastAttendanceStatus !== undefined) {
      updates.push(`last_attendance_status = ?`);
      values.push(data.lastAttendanceStatus);
    }

    updates.push(`updated_at = datetime('now')`);

    if (updates.length === 1) { // Only updated_at
      return this.findById(id);
    }

    values.push(id);
    const query = `UPDATE students SET ${updates.join(', ')} WHERE id = ?`;
    
    await database.query(query, values);
    
    const updated = await this.findById(id);
    return updated;
  }

  /**
   * Delete student
   */
  static async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM students WHERE id = ?';
    const result = await database.query(query, [id]);
    return result.rowCount > 0;
  }

  /**
   * Search students
   */
  static async search(searchTerm: string, filters?: any): Promise<StudentType[]> {
    let query = `
      SELECT * FROM students 
      WHERE (
        first_name LIKE ? OR 
        last_name LIKE ? OR 
        email LIKE ? OR
        major LIKE ? OR
        tags LIKE ?
      )
    `;
    
    const searchPattern = `%${searchTerm}%`;
    const values = [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern];

    if (filters) {
      if (filters.status) {
        query += ` AND status = ?`;
        values.push(filters.status);
      }
      if (filters.yearOfStudy) {
        query += ` AND year_of_study = ?`;
        values.push(filters.yearOfStudy);
      }
      if (filters.jobSearchStatus) {
        query += ` AND job_search_status = ?`;
        values.push(filters.jobSearchStatus);
      }
    }

    query += ' ORDER BY last_name, first_name LIMIT 100';

    const result = await database.query(query, values);
    return result.rows.map(row => this.transformFromDb(row));
  }

  /**
   * Get statistics
   */
  static async getStats(): Promise<any> {
    const totalQuery = 'SELECT COUNT(*) as total FROM students';
    const activeQuery = 'SELECT COUNT(*) as active FROM students WHERE status = ?';
    const byYearQuery = 'SELECT year_of_study, COUNT(*) as count FROM students GROUP BY year_of_study';
    const byStatusQuery = 'SELECT job_search_status, COUNT(*) as count FROM students GROUP BY job_search_status';

    const [total, active, byYear, byStatus] = await Promise.all([
      database.query(totalQuery),
      database.query(activeQuery, ['Active']),
      database.query(byYearQuery),
      database.query(byStatusQuery)
    ]);

    return {
      total: (total.rows[0] as any).total,
      active: (active.rows[0] as any).active,
      byYear: byYear.rows,
      byJobSearchStatus: byStatus.rows
    };
  }

  /**
   * Safe JSON parse with fallback
   */
  private static safeJsonParse(value: any, fallback: any = []): any {
    if (!value) return fallback;
    if (typeof value !== 'string') return fallback;
    
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  /**
   * Transform database row to Student object
   */
  private static transformFromDb(row: any): StudentType {
    if (!row) return row;

    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      yearOfStudy: row.year_of_study,
      programType: row.program_type,
      specificProgram: row.specific_program,
      major: row.major,
      status: row.status,
      dateAdded: row.date_added,
      lastInteraction: row.last_interaction,
      academicStartDate: row.academic_start_date,
      expectedGraduation: row.expected_graduation,
      avatar: row.avatar,
      tags: StudentModel.safeJsonParse(row.tags, []),
      careerInterests: StudentModel.safeJsonParse(row.career_interests, []),
      linkedinUrl: row.linkedin_url,
      resumeOnFile: Boolean(row.resume_on_file),
      resumeLastUpdated: row.resume_last_updated,
      jobSearchStatus: row.job_search_status,
      targetIndustries: StudentModel.safeJsonParse(row.target_industries, []),
      targetLocations: StudentModel.safeJsonParse(row.target_locations, []),
      noShowCount: row.no_show_count || 0,
      lastNoShowDate: row.last_no_show_date,
      lastAttendanceStatus: row.last_attendance_status || 'scheduled',
      quickNote: row.quick_note,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Get all students for CSV export (raw database format)
   */
  static async getAllStudentsForExport(): Promise<any[]> {
    const query = `
      SELECT 
        s.id,
        s.first_name,
        s.last_name,
        s.email,
        s.phone,
        s.year_of_study,
        s.program_type,
        s.specific_program,
        s.major,
        s.status,
        s.date_added,
        s.last_interaction,
        s.academic_start_date,
        s.expected_graduation,
        s.avatar,
        s.tags,
        s.career_interests,
        s.linkedin_url,
        s.resume_on_file,
        s.resume_last_updated,
        s.job_search_status,
        s.target_industries,
        s.target_locations,
        s.no_show_count,
        s.last_no_show_date,
        s.last_attendance_status,
        s.quick_note,
        s.date_added as created_at,
        s.updated_at,
        -- Include notes count and latest note
        (SELECT COUNT(*) FROM notes WHERE student_id = s.id) as notes_count,
        (SELECT content FROM notes WHERE student_id = s.id ORDER BY date_created DESC LIMIT 1) as latest_note,
        -- Include consultations count and latest consultation
        (SELECT COUNT(*) FROM consultations WHERE student_id = s.id) as consultations_count,
        (SELECT type FROM consultations WHERE student_id = s.id ORDER BY consultation_date DESC LIMIT 1) as latest_consultation_type
      FROM students s
      ORDER BY s.last_name, s.first_name
    `;
    
    const result = await database.query(query);
    
    // Process the raw data to handle JSON fields properly for CSV
    return result.rows.map(row => ({
      ...row,
      // Convert JSON arrays to readable strings for CSV
      tags: row.tags ? (typeof row.tags === 'string' ? row.tags : JSON.stringify(row.tags)) : '',
      career_interests: row.career_interests ? (typeof row.career_interests === 'string' ? row.career_interests : JSON.stringify(row.career_interests)) : '',
      target_industries: row.target_industries ? (typeof row.target_industries === 'string' ? row.target_industries : JSON.stringify(row.target_industries)) : '',
      target_locations: row.target_locations ? (typeof row.target_locations === 'string' ? row.target_locations : JSON.stringify(row.target_locations)) : '',
      // Convert boolean to readable string
      resume_on_file: row.resume_on_file ? 'Yes' : 'No'
    }));
  }

  /**
   * Get all students (for reports)
   */
  static async getAllStudents(): Promise<any[]> {
    const query = `
      SELECT s.*,
             (SELECT COUNT(*) FROM consultations WHERE student_id = s.id) as consultation_count,
             (SELECT json_group_array(json_object(
               'id', c.id,
               'date', c.consultation_date,
               'type', c.type,
               'attended', c.attended,
               'status', CASE WHEN c.attended = 1 THEN 'attended' ELSE 'scheduled' END
             )) FROM consultations c WHERE c.student_id = s.id) as consultations
      FROM students s
      ORDER BY s.last_name, s.first_name
    `;
    
    const result = await database.query(query);
    return result.rows.map(row => ({
      ...this.transformFromDb(row),
      consultations: row.consultations ? JSON.parse(row.consultations) : []
    }));
  }

  /**
   * Get students with no-shows on a specific date (for reports)
   */
  static async getStudentsWithNoShowsOnDate(date: string): Promise<any[]> {
    const query = `
      SELECT DISTINCT s.*
      FROM students s
      JOIN consultations c ON s.id = c.student_id
      WHERE DATE(c.consultation_date) = DATE(?)
        AND c.attended = 0
      ORDER BY s.last_name, s.first_name
    `;
    
    const result = await database.query(query, [date]);
    return result.rows.map(row => this.transformFromDb(row));
  }
}

// Export for use in report controller
export const Student = StudentModel;