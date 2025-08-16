import database, { generateId } from '../database/connection';

export interface MockInterview {
  id: string;
  student_id: string;
  interview_date: Date;
  interview_type: 'Behavioral' | 'Technical' | 'Case Study' | 'Panel' | 'Phone Screen' | 'Final Round';
  company_name?: string;
  position_title?: string;
  interviewer_name?: string;
  duration_minutes: number;
  overall_rating?: number;
  strengths?: string;
  areas_for_improvement?: string;
  detailed_feedback?: string;
  questions_asked?: string;
  follow_up_required: boolean;
  created_at: Date;
  updated_at: Date;
}

export class MockInterviewModel {
  static async create(data: Omit<MockInterview, 'id' | 'created_at' | 'updated_at'>): Promise<MockInterview> {
    const id = generateId();
    const now = new Date().toISOString();
    
    const query = `
      INSERT INTO mock_interviews (
        id, student_id, interview_date, interview_type, company_name,
        position_title, interviewer_name, duration_minutes, overall_rating,
        strengths, areas_for_improvement, detailed_feedback, questions_asked,
        follow_up_required, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      id,
      data.student_id,
      data.interview_date,
      data.interview_type,
      data.company_name || null,
      data.position_title || null,
      data.interviewer_name || null,
      data.duration_minutes,
      data.overall_rating || null,
      data.strengths || null,
      data.areas_for_improvement || null,
      data.detailed_feedback || null,
      data.questions_asked || null,
      data.follow_up_required ? 1 : 0,
      now,
      now
    ];
    
    await database.query(query, values);
    return this.findById(id);
  }
  
  static async findById(id: string): Promise<MockInterview | null> {
    const result = await database.query(
      'SELECT * FROM mock_interviews WHERE id = ?',
      [id]
    );
    
    return result.rows.length > 0 ? this.transformFromDb(result.rows[0]) : null;
  }
  
  static async findByStudent(studentId: string): Promise<MockInterview[]> {
    const result = await database.query(
      'SELECT * FROM mock_interviews WHERE student_id = ? ORDER BY interview_date DESC',
      [studentId]
    );
    
    return result.rows.map(row => this.transformFromDb(row));
  }
  
  static async update(id: string, data: Partial<Omit<MockInterview, 'id' | 'created_at' | 'updated_at'>>): Promise<MockInterview | null> {
    const updates: string[] = [];
    const values: any[] = [];
    
    const fields = [
      'interview_date', 'interview_type', 'company_name', 'position_title',
      'interviewer_name', 'duration_minutes', 'overall_rating', 'strengths',
      'areas_for_improvement', 'detailed_feedback', 'questions_asked', 'follow_up_required'
    ];
    
    fields.forEach(field => {
      if (data[field as keyof typeof data] !== undefined) {
        updates.push(`${field} = ?`);
        const value = data[field as keyof typeof data];
        values.push(field === 'follow_up_required' ? (value ? 1 : 0) : value);
      }
    });
    
    if (updates.length === 0) return this.findById(id);
    
    updates.push('updated_at = datetime("now")');
    values.push(id);
    
    const query = `UPDATE mock_interviews SET ${updates.join(', ')} WHERE id = ?`;
    await database.query(query, values);
    
    return this.findById(id);
  }
  
  static async delete(id: string): Promise<boolean> {
    const result = await database.query('DELETE FROM mock_interviews WHERE id = ?', [id]);
    return result.rowCount > 0;
  }
  
  static async getUpcoming(days: number = 7): Promise<any[]> {
    const query = `
      SELECT 
        mi.*,
        s.name as student_name,
        s.email as student_email
      FROM mock_interviews mi
      JOIN students s ON mi.student_id = s.id
      WHERE mi.interview_date >= datetime('now') 
        AND mi.interview_date <= datetime('now', '+' || ? || ' days')
      ORDER BY mi.interview_date
    `;
    
    const result = await database.query(query, [days]);
    return result.rows;
  }
  
  static async getStats(studentId?: string): Promise<any> {
    let whereClause = '';
    const params: any[] = [];
    
    if (studentId) {
      whereClause = 'WHERE student_id = ?';
      params.push(studentId);
    }
    
    const query = `
      SELECT 
        COUNT(*) as total_interviews,
        AVG(overall_rating) as average_rating,
        COUNT(DISTINCT student_id) as unique_students,
        SUM(CASE WHEN follow_up_required = 1 THEN 1 ELSE 0 END) as follow_ups_needed
      FROM mock_interviews ${whereClause}
    `;
    
    const result = await database.query(query, params);
    return result.rows[0];
  }
  
  private static transformFromDb(row: any): MockInterview {
    return {
      id: row.id,
      student_id: row.student_id,
      interview_date: new Date(row.interview_date),
      interview_type: row.interview_type,
      company_name: row.company_name,
      position_title: row.position_title,
      interviewer_name: row.interviewer_name,
      duration_minutes: row.duration_minutes,
      overall_rating: row.overall_rating,
      strengths: row.strengths,
      areas_for_improvement: row.areas_for_improvement,
      detailed_feedback: row.detailed_feedback,
      questions_asked: row.questions_asked,
      follow_up_required: Boolean(row.follow_up_required),
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }

  static async findByStudentId(studentId: string): Promise<MockInterview[]> {
    return this.findByStudent(studentId);
  }

  static async findByDateRange(startDate: Date, endDate: Date): Promise<MockInterview[]> {
    const result = await database.query(
      'SELECT * FROM mock_interviews WHERE interview_date >= ? AND interview_date <= ? ORDER BY interview_date DESC',
      [startDate.toISOString(), endDate.toISOString()]
    );
    
    return result.rows.map(row => this.transformFromDb(row));
  }

  static async findAll(): Promise<MockInterview[]> {
    const result = await database.query('SELECT * FROM mock_interviews ORDER BY interview_date DESC');
    return result.rows.map(row => this.transformFromDb(row));
  }
}