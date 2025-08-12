import database, { generateId } from '../database/connection';

export interface Application {
  id: string;
  student_id: string;
  type: 'Internship' | 'Full-time' | 'Part-time' | 'Co-op' | 'Fellowship';
  company_name: string;
  position_title: string;
  application_date: Date;
  status: 'Planning' | 'Applied' | 'Phone Screen' | 'Interview Scheduled' | 'Interviewed' | 'Offer' | 'Rejected' | 'Accepted' | 'Declined';
  salary_range?: string;
  location?: string;
  job_description?: string;
  notes?: string;
  response_date?: Date;
  interview_dates?: string;
  offer_deadline?: Date;
  created_at: Date;
  updated_at: Date;
}

export class ApplicationModel {
  static async create(data: Omit<Application, 'id' | 'created_at' | 'updated_at'>): Promise<Application> {
    const id = generateId();
    const now = new Date().toISOString();
    
    const query = `
      INSERT INTO applications (
        id, student_id, type, company_name, position_title, 
        application_date, status, salary_range, location, 
        job_description, notes, response_date, interview_dates, 
        offer_deadline, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      id,
      data.student_id,
      data.type,
      data.company_name,
      data.position_title,
      data.application_date,
      data.status,
      data.salary_range || null,
      data.location || null,
      data.job_description || null,
      data.notes || null,
      data.response_date || null,
      data.interview_dates || null,
      data.offer_deadline || null,
      now,
      now
    ];
    
    await database.query(query, values);
    return this.findById(id);
  }
  
  static async findById(id: string): Promise<Application | null> {
    const result = await database.query(
      'SELECT * FROM applications WHERE id = ?',
      [id]
    );
    
    return result.rows.length > 0 ? this.transformFromDb(result.rows[0]) : null;
  }
  
  static async findByStudent(studentId: string): Promise<Application[]> {
    const result = await database.query(
      'SELECT * FROM applications WHERE student_id = ? ORDER BY application_date DESC',
      [studentId]
    );
    
    return result.rows.map(row => this.transformFromDb(row));
  }
  
  static async update(id: string, data: Partial<Omit<Application, 'id' | 'created_at' | 'updated_at'>>): Promise<Application | null> {
    const updates: string[] = [];
    const values: any[] = [];
    
    const fields = [
      'type', 'company_name', 'position_title', 'application_date',
      'status', 'salary_range', 'location', 'job_description',
      'notes', 'response_date', 'interview_dates', 'offer_deadline'
    ];
    
    fields.forEach(field => {
      if (data[field as keyof typeof data] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(data[field as keyof typeof data]);
      }
    });
    
    if (updates.length === 0) return this.findById(id);
    
    updates.push('updated_at = datetime("now")');
    values.push(id);
    
    const query = `UPDATE applications SET ${updates.join(', ')} WHERE id = ?`;
    await database.query(query, values);
    
    return this.findById(id);
  }
  
  static async delete(id: string): Promise<boolean> {
    const result = await database.query('DELETE FROM applications WHERE id = ?', [id]);
    return result.rowCount > 0;
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
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Applied' THEN 1 ELSE 0 END) as applied,
        SUM(CASE WHEN status IN ('Interview Scheduled', 'Interviewed') THEN 1 ELSE 0 END) as interviewing,
        SUM(CASE WHEN status = 'Offer' THEN 1 ELSE 0 END) as offers,
        SUM(CASE WHEN status = 'Accepted' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected
      FROM applications ${whereClause}
    `;
    
    const result = await database.query(query, params);
    return result.rows[0];
  }

  static async findByStudentId(studentId: string): Promise<Application[]> {
    return this.findByStudent(studentId);
  }

  static async findByDateRange(startDate: Date, endDate: Date): Promise<Application[]> {
    const result = await database.query(
      'SELECT * FROM applications WHERE application_date >= ? AND application_date <= ? ORDER BY application_date DESC',
      [startDate.toISOString(), endDate.toISOString()]
    );
    
    return result.rows.map(row => this.transformFromDb(row));
  }

  static async findAll(): Promise<Application[]> {
    const result = await database.query('SELECT * FROM applications ORDER BY application_date DESC');
    return result.rows.map(row => this.transformFromDb(row));
  }
  
  private static transformFromDb(row: any): Application {
    return {
      id: row.id,
      student_id: row.student_id,
      type: row.type,
      company_name: row.company_name,
      position_title: row.position_title,
      application_date: new Date(row.application_date),
      status: row.status,
      salary_range: row.salary_range,
      location: row.location,
      job_description: row.job_description,
      notes: row.notes,
      response_date: row.response_date ? new Date(row.response_date) : undefined,
      interview_dates: row.interview_dates,
      offer_deadline: row.offer_deadline ? new Date(row.offer_deadline) : undefined,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }
}