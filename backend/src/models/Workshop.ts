import database, { generateId } from '../database/connection';

export interface WorkshopAttendance {
  id: string;
  student_id: string;
  workshop_name: string;
  workshop_date: Date;
  workshop_type: 'Resume Writing' | 'Interview Skills' | 'Networking' | 'Job Search Strategy' | 'LinkedIn' | 'Career Fair Prep' | 'Industry Specific' | 'Other';
  attended: boolean;
  feedback?: string;
  created_at: Date;
}

export class WorkshopAttendanceModel {
  static async create(data: Omit<WorkshopAttendance, 'id' | 'created_at'>): Promise<WorkshopAttendance> {
    const id = generateId();
    const now = new Date().toISOString();
    
    const query = `
      INSERT INTO workshop_attendance (
        id, student_id, workshop_name, workshop_date, workshop_type,
        attended, feedback, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      id,
      data.student_id,
      data.workshop_name,
      data.workshop_date,
      data.workshop_type,
      data.attended ? 1 : 0,
      data.feedback || null,
      now
    ];
    
    await database.query(query, values);
    return this.findById(id);
  }
  
  static async findById(id: string): Promise<WorkshopAttendance | null> {
    const result = await database.query(
      'SELECT * FROM workshop_attendance WHERE id = ?',
      [id]
    );
    
    return result.rows.length > 0 ? this.transformFromDb(result.rows[0]) : null;
  }
  
  static async findByStudent(studentId: string): Promise<WorkshopAttendance[]> {
    const result = await database.query(
      'SELECT * FROM workshop_attendance WHERE student_id = ? ORDER BY workshop_date DESC',
      [studentId]
    );
    
    return result.rows.map(row => this.transformFromDb(row));
  }
  
  static async update(id: string, data: Partial<Omit<WorkshopAttendance, 'id' | 'created_at'>>): Promise<WorkshopAttendance | null> {
    const updates: string[] = [];
    const values: any[] = [];
    
    const fields = ['workshop_name', 'workshop_date', 'workshop_type', 'attended', 'feedback'];
    
    fields.forEach(field => {
      if (data[field as keyof typeof data] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(field === 'attended' ? (data.attended ? 1 : 0) : data[field as keyof typeof data]);
      }
    });
    
    if (updates.length === 0) return this.findById(id);
    
    values.push(id);
    const query = `UPDATE workshop_attendance SET ${updates.join(', ')} WHERE id = ?`;
    await database.query(query, values);
    
    return this.findById(id);
  }
  
  static async delete(id: string): Promise<boolean> {
    const result = await database.query('DELETE FROM workshop_attendance WHERE id = ?', [id]);
    return result.rowCount > 0;
  }
  
  static async getWorkshopStats(): Promise<any> {
    const query = `
      SELECT 
        workshop_type,
        COUNT(*) as total_attendance,
        SUM(attended) as actual_attendance,
        COUNT(DISTINCT student_id) as unique_students
      FROM workshop_attendance
      GROUP BY workshop_type
      ORDER BY total_attendance DESC
    `;
    
    const result = await database.query(query);
    return result.rows;
  }
  
  static async getUpcomingWorkshops(days: number = 30): Promise<any[]> {
    const query = `
      SELECT 
        workshop_name,
        workshop_date,
        workshop_type,
        COUNT(*) as registered_count
      FROM workshop_attendance
      WHERE workshop_date > datetime('now') 
        AND workshop_date <= datetime('now', '+' || ? || ' days')
      GROUP BY workshop_name, workshop_date, workshop_type
      ORDER BY workshop_date
    `;
    
    const result = await database.query(query, [days]);
    return result.rows;
  }
  
  static async getByWorkshopName(workshopName: string, workshopDate: string): Promise<WorkshopAttendance[]> {
    const query = `
      SELECT wa.*, s.name as student_name, s.email as student_email
      FROM workshop_attendance wa
      JOIN students s ON wa.student_id = s.id
      WHERE wa.workshop_name = ? AND date(wa.workshop_date) = date(?)
      ORDER BY s.name
    `;
    
    const result = await database.query(query, [workshopName, workshopDate]);
    return result.rows.map(row => ({
      ...this.transformFromDb(row),
      student_name: row.student_name,
      student_email: row.student_email
    }));
  }
  
  private static transformFromDb(row: any): WorkshopAttendance {
    return {
      id: row.id,
      student_id: row.student_id,
      workshop_name: row.workshop_name,
      workshop_date: new Date(row.workshop_date),
      workshop_type: row.workshop_type,
      attended: Boolean(row.attended),
      feedback: row.feedback,
      created_at: new Date(row.created_at)
    };
  }

  static async findByStudentId(studentId: string): Promise<WorkshopAttendance[]> {
    return this.findByStudent(studentId);
  }

  static async findByDateRange(startDate: Date, endDate: Date): Promise<WorkshopAttendance[]> {
    const result = await database.query(
      'SELECT * FROM workshop_attendance WHERE workshop_date >= ? AND workshop_date <= ? ORDER BY workshop_date DESC',
      [startDate.toISOString(), endDate.toISOString()]
    );
    
    return result.rows.map(row => this.transformFromDb(row));
  }

  static async findAll(): Promise<WorkshopAttendance[]> {
    const result = await database.query('SELECT * FROM workshop_attendance ORDER BY workshop_date DESC');
    return result.rows.map(row => this.transformFromDb(row));
  }
}

// Alias for consistency with controller
export const WorkshopModel = WorkshopAttendanceModel;