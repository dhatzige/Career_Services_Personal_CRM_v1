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
    let query = `
      SELECT s.*,
             (
               SELECT json_group_array(
                 json_object(
                   'id', c.id,
                   'date', c.consultation_date,
                   'attended', CASE WHEN c.status = 'attended' THEN 1 ELSE 0 END,
                   'status', c.status,
                   'type', c.type,
                   'duration', c.duration,
                   'notes', c.notes,
                   'followUpRequired', c.follow_up_required
                 )
               )
               FROM consultations c
               WHERE c.student_id = s.id
               ORDER BY c.consultation_date DESC
             ) as consultations,
             (
               SELECT json_group_array(
                 json_object(
                   'id', n.id,
                   'content', n.content,
                   'type', n.type,
                   'date', n.date_created,
                   'tags', n.tags
                 )
               )
               FROM notes n
               WHERE n.student_id = s.id
               ORDER BY n.date_created DESC
             ) as notes
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
    return result.rows.map(row => ({
      ...this.transformFromDb(row),
      consultations: row.consultations ? JSON.parse(row.consultations) : [],
      notes: row.notes ? JSON.parse(row.notes) : []
    }));
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
    if (data.noShowCount !== undefined) {
      updates.push(`no_show_count = ?`);
      values.push(data.noShowCount);
    }
    if (data.lastNoShowDate !== undefined) {
      updates.push(`last_no_show_date = ?`);
      values.push(data.lastNoShowDate);
    }
    if (data.lastAttendanceStatus !== undefined) {
      updates.push(`lastAttendanceStatus = ?`);
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
      tags: row.tags ? JSON.parse(row.tags) : [],
      careerInterests: row.career_interests ? JSON.parse(row.career_interests) : [],
      linkedinUrl: row.linkedin_url,
      resumeOnFile: Boolean(row.resume_on_file),
      resumeLastUpdated: row.resume_last_updated,
      jobSearchStatus: row.job_search_status,
      targetIndustries: row.target_industries ? JSON.parse(row.target_industries) : [],
      targetLocations: row.target_locations ? JSON.parse(row.target_locations) : [],
      noShowCount: row.no_show_count || 0,
      lastNoShowDate: row.last_no_show_date,
      lastAttendanceStatus: row.lastAttendanceStatus || 'scheduled',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
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
               'status', c.status
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
        AND c.status = 'no-show'
      ORDER BY s.last_name, s.first_name
    `;
    
    const result = await database.query(query, [date]);
    return result.rows.map(row => this.transformFromDb(row));
  }
}

// Export for use in report controller
export const Student = StudentModel;