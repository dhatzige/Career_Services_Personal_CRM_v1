import database from '../database/connection';
import { Consultation as ConsultationType, CreateConsultationRequest } from '../types';

export class ConsultationModel {
  /**
   * Create a new consultation for a student
   */
  static async create(data: any): Promise<ConsultationType> {
    // Generate a unique ID for SQLite
    const id = `consultation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const query = `
      INSERT INTO consultations (
        id, student_id, type, consultation_date, duration, attended, 
        notes, follow_up_required, location, topic, follow_up_notes, needs_review
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `;
    
    const values = [
      id,
      data.studentId,
      data.type || 'General',
      data.date,
      data.duration || 30,
      data.attended !== undefined ? (data.attended ? 1 : 0) : 0,
      data.notes || '',
      data.followUpRequired ? 1 : 0,
      data.location || 'Online',
      data.topic || '',
      data.followUpNotes || '',
      data.needsReview ? 1 : 0
    ];

    await database.query(query, values);
    
    // Update the student's updated_at timestamp when a new consultation is added
    await database.query(
      "UPDATE students SET updated_at = datetime('now') WHERE id = $1",
      [data.studentId]
    );
    
    // SQLite doesn't support RETURNING, so we need to fetch the inserted record
    const selectQuery = 'SELECT * FROM consultations WHERE id = $1';
    const result = await database.query(selectQuery, [id]);
    return this.transformFromDb(result.rows[0]);
  }

  /**
   * Find all consultations for a student
   */
  static async findByStudentId(studentId: string): Promise<ConsultationType[]> {
    const query = `
      SELECT * FROM consultations 
      WHERE student_id = $1 
      ORDER BY consultation_date DESC
    `;
    
    const result = await database.query(query, [studentId]);
    return result.rows.map(row => this.transformFromDb(row));
  }

  /**
   * Find consultation by ID
   */
  static async findById(id: string): Promise<ConsultationType | null> {
    const query = 'SELECT * FROM consultations WHERE id = $1';
    const result = await database.query(query, [id]);
    return result.rows.length > 0 ? this.transformFromDb(result.rows[0]) : null;
  }

  /**
   * Find consultation by Calendly URI
   */
  static async findByCalendlyUri(uri: string): Promise<ConsultationType | null> {
    const query = 'SELECT * FROM consultations WHERE calendly_uri = $1 OR notes LIKE $2';
    const result = await database.query(query, [uri, `%${uri}%`]);
    return result.rows.length > 0 ? this.transformFromDb(result.rows[0]) : null;
  }

  /**
   * Update consultation by ID
   */
  static async update(id: string, data: Partial<CreateConsultationRequest & { needsReview?: boolean }>): Promise<ConsultationType | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.type !== undefined) {
      updates.push(`type = $${paramIndex}`);
      values.push(data.type);
      paramIndex++;
    }
    if (data.date !== undefined) {
      updates.push(`consultation_date = $${paramIndex}`);
      values.push(data.date);
      paramIndex++;
    }
    if (data.duration !== undefined) {
      updates.push(`duration = $${paramIndex}`);
      values.push(data.duration);
      paramIndex++;
    }
    if (data.attended !== undefined) {
      updates.push(`attended = $${paramIndex}`);
      values.push(data.attended ? 1 : 0);
      paramIndex++;
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(data.status);
      paramIndex++;
    }
    if (data.notes !== undefined) {
      updates.push(`notes = $${paramIndex}`);
      values.push(data.notes);
      paramIndex++;
    }
    if (data.followUpRequired !== undefined) {
      updates.push(`follow_up_required = $${paramIndex}`);
      values.push(data.followUpRequired ? 1 : 0);
      paramIndex++;
    }
    if (data.location !== undefined) {
      updates.push(`location = $${paramIndex}`);
      values.push(data.location);
      paramIndex++;
    }
    if (data.topic !== undefined) {
      updates.push(`topic = $${paramIndex}`);
      values.push(data.topic);
      paramIndex++;
    }
    if (data.followUpNotes !== undefined) {
      updates.push(`follow_up_notes = $${paramIndex}`);
      values.push(data.followUpNotes);
      paramIndex++;
    }
    if (data.needsReview !== undefined) {
      updates.push(`needs_review = $${paramIndex}`);
      values.push(data.needsReview ? 1 : 0);
      paramIndex++;
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    const query = `
      UPDATE consultations 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `;
    
    values.push(id);

    await database.query(query, values);
    
    // SQLite doesn't support RETURNING, so fetch the updated record
    return this.findById(id);
  }

  /**
   * Delete consultation by ID
   */
  static async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM consultations WHERE id = $1';
    const result = await database.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Find all consultations with filters
   */
  static async findAll(filters: any = {}, limit: number = 100): Promise<ConsultationType[]> {
    let query = 'SELECT * FROM consultations WHERE 1=1';
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.studentId) {
      query += ` AND student_id = $${paramIndex}`;
      values.push(filters.studentId);
      paramIndex++;
    }
    if (filters.date?.gte) {
      query += ` AND consultation_date >= $${paramIndex}`;
      // Convert Date to ISO string for SQLite
      const dateString = filters.date.gte instanceof Date ? filters.date.gte.toISOString() : filters.date.gte;
      values.push(dateString);
      paramIndex++;
    }

    query += ' ORDER BY consultation_date ASC';
    query += ` LIMIT $${paramIndex}`;
    values.push(limit);

    const result = await database.query(query, values);
    return result.rows.map(row => this.transformFromDb(row));
  }

  /**
   * Find consultation by Calendly event ID
   */
  static async findByCalendlyId(calendlyEventId: string): Promise<ConsultationType | null> {
    if (!calendlyEventId) return null;
    
    const query = 'SELECT * FROM consultations WHERE calendly_uri = $1';
    const result = await database.query(query, [calendlyEventId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.transformFromDb(result.rows[0]);
  }

  /**
   * Get consultation statistics
   */
  static async getStatistics(): Promise<{
    total: number;
    attended: number;
    missed: number;
    byType: { type: string; count: number }[];
    upcoming: ConsultationType[];
    followUpRequired: number;
  }> {
    const queries = [
      'SELECT COUNT(*) as total FROM consultations',
      'SELECT COUNT(*) as attended FROM consultations WHERE attended = 1',
      'SELECT COUNT(*) as missed FROM consultations WHERE attended = 0',
      'SELECT type, COUNT(*) as count FROM consultations GROUP BY type',
      "SELECT * FROM consultations WHERE consultation_date > datetime('now') ORDER BY consultation_date ASC LIMIT 10",
      'SELECT COUNT(*) as follow_up_required FROM consultations WHERE follow_up_required = 1'
    ];

    const [totalResult, attendedResult, missedResult, byTypeResult, upcomingResult, followUpResult] = await Promise.all([
      database.query(queries[0]),
      database.query(queries[1]),
      database.query(queries[2]),
      database.query(queries[3]),
      database.query(queries[4]),
      database.query(queries[5])
    ]);

    return {
      total: parseInt(totalResult.rows[0].total),
      attended: parseInt(attendedResult.rows[0].attended),
      missed: parseInt(missedResult.rows[0].missed),
      byType: byTypeResult.rows.map(row => ({
        type: row.type,
        count: parseInt(row.count)
      })),
      upcoming: upcomingResult.rows.map(row => this.transformFromDb(row)),
      followUpRequired: parseInt(followUpResult.rows[0].follow_up_required)
    };
  }

  /**
   * Get consultations by date range (for reports)
   */
  static async getConsultationsByDateRange(startDate: string, endDate: string): Promise<any[]> {
    // For SQLite, ensure we're comparing dates properly with time components
    const startDateTime = `${startDate} 00:00:00`;
    const endDateTime = `${endDate} 23:59:59`;
    
    const query = `
      SELECT c.*, 
             s.first_name || ' ' || s.last_name as student_name,
             s.email as student_email,
             s.id as student_id_full,
             c.status,
             c.advisor_name
      FROM consultations c
      JOIN students s ON c.student_id = s.id
      WHERE datetime(c.consultation_date) >= datetime($1) 
        AND datetime(c.consultation_date) <= datetime($2)
      ORDER BY c.consultation_date ASC
    `;
    
    const result = await database.query(query, [startDateTime, endDateTime]);
    return result.rows.map(row => ({
      id: row.id,
      studentId: row.student_id,
      studentName: row.student_name,
      studentEmail: row.student_email,
      type: row.type,
      date: row.consultation_date,
      duration: row.duration,
      status: row.status || 'scheduled',
      advisorName: row.advisor_name,
      location: row.location,
      notes: row.notes,
      topic: row.topic
    }));
  }

  /**
   * Transform database row to Consultation object
   */
  private static transformFromDb(row: any): ConsultationType {
    return {
      id: row.id,
      studentId: row.student_id,
      type: row.type,
      date: row.consultation_date,
      duration: row.duration,
      attended: row.attended === 1,
      notes: row.notes,
      followUpRequired: row.follow_up_required === 1,
      location: row.location,
      topic: row.topic,
      followUpNotes: row.follow_up_notes,
      status: row.status || 'scheduled',
      needsReview: row.needs_review === 1
    };
  }
}

// Export for use in report controller
export const Consultation = ConsultationModel; 