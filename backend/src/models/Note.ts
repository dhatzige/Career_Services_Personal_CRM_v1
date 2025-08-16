import database, { generateId } from '../database/connection';
import { Note as NoteType, CreateNoteRequest } from '../types';

export class NoteModel {
  /**
   * Create a new note for a student
   */
  static async create(studentId: string, data: CreateNoteRequest): Promise<NoteType> {
    const id = generateId();
    
    // Get student's current year for tracking
    const studentResult = await database.query(
      'SELECT year_of_study FROM students WHERE id = ?',
      [studentId]
    );
    
    const studentYearAtTime = studentResult.rows[0]?.year_of_study || null;
    
    const query = `
      INSERT INTO notes (
        id, student_id, content, type, student_year_at_time, tags
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      id,
      studentId,
      data.content,
      data.type,
      studentYearAtTime,
      JSON.stringify(data.tags || [])
    ];
    
    await database.query(query, values);
    
    // Update student's last interaction
    await database.query(
      'UPDATE students SET last_interaction = datetime(\'now\') WHERE id = ?',
      [studentId]
    );
    
    // Return the created note
    const result = await database.query('SELECT * FROM notes WHERE id = ?', [id]);
    return this.transformFromDb(result.rows[0]);
  }

  /**
   * Find all notes
   */
  static async findAll(): Promise<NoteType[]> {
    const query = `
      SELECT * FROM notes 
      ORDER BY date_created DESC
    `;
    
    const result = await database.query(query);
    return result.rows.map(row => this.transformFromDb(row));
  }

  /**
   * Find all notes for a student
   */
  static async findByStudentId(studentId: string): Promise<NoteType[]> {
    const query = `
      SELECT * FROM notes 
      WHERE student_id = ? 
      ORDER BY date_created DESC
    `;
    
    const result = await database.query(query, [studentId]);
    return result.rows.map(row => this.transformFromDb(row));
  }

  /**
   * Find note by ID
   */
  static async findById(id: string): Promise<NoteType | null> {
    const query = 'SELECT * FROM notes WHERE id = ?';
    const result = await database.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.transformFromDb(result.rows[0]);
  }

  /**
   * Update note
   */
  static async update(id: string, data: Partial<CreateNoteRequest>): Promise<NoteType | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.content !== undefined) {
      updates.push('content = ?');
      values.push(data.content);
    }
    if (data.type !== undefined) {
      updates.push('type = ?');
      values.push(data.type);
    }
    if (data.tags !== undefined) {
      updates.push('tags = ?');
      values.push(JSON.stringify(data.tags));
    }

    updates.push('updated_at = datetime("now")');

    if (updates.length === 1) { // Only updated_at
      return this.findById(id);
    }

    values.push(id);
    const query = `UPDATE notes SET ${updates.join(', ')} WHERE id = ?`;
    
    await database.query(query, values);
    return this.findById(id);
  }

  /**
   * Delete note
   */
  static async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM notes WHERE id = ?';
    const result = await database.query(query, [id]);
    return result.rowCount > 0;
  }

  /**
   * Get statistics for notes
   */
  static async getStats(): Promise<any> {
    const totalQuery = 'SELECT COUNT(*) as total FROM notes';
    const byTypeQuery = 'SELECT type, COUNT(*) as count FROM notes GROUP BY type';
    const recentQuery = `
      SELECT COUNT(*) as recent 
      FROM notes 
      WHERE date_created > datetime('now', '-7 days')
    `;
    
    const [total, byType, recent] = await Promise.all([
      database.query(totalQuery),
      database.query(byTypeQuery),
      database.query(recentQuery)
    ]);
    
    return {
      total: total.rows[0].total,
      byType: byType.rows,
      recentCount: recent.rows[0].recent
    };
  }

  /**
   * Search notes
   */
  static async search(searchTerm: string, filters?: any): Promise<NoteType[]> {
    let query = `
      SELECT n.*, s.first_name, s.last_name 
      FROM notes n
      JOIN students s ON n.student_id = s.id
      WHERE n.content LIKE ?
    `;
    
    const values = [`%${searchTerm}%`];
    
    if (filters?.type) {
      query += ' AND n.type = ?';
      values.push(filters.type);
    }
    
    if (filters?.studentId) {
      query += ' AND n.student_id = ?';
      values.push(filters.studentId);
    }
    
    query += ' ORDER BY n.date_created DESC LIMIT 100';
    
    const result = await database.query(query, values);
    return result.rows.map(row => this.transformFromDb(row));
  }

  /**
   * Get notes by date range (for reports)
   */
  static async getNotesByDateRange(startDate: string, endDate: string): Promise<any[]> {
    const query = `
      SELECT n.*, 
             s.first_name || ' ' || s.last_name as student_name
      FROM notes n
      JOIN students s ON n.student_id = s.id
      WHERE n.date_created >= ? AND n.date_created <= ?
      ORDER BY n.date_created ASC
    `;
    
    const result = await database.query(query, [startDate, endDate]);
    return result.rows.map(row => ({
      id: row.id,
      studentId: row.student_id,
      studentName: row.student_name,
      content: row.content,
      type: row.type,
      dateCreated: row.date_created,
      tags: row.tags ? JSON.parse(row.tags) : []
    }));
  }

  /**
   * Transform database row to Note object
   */
  private static transformFromDb(row: any): NoteType {
    if (!row) return row;
    
    return {
      id: row.id,
      content: row.content,
      type: row.type,
      dateCreated: row.date_created,
      studentYearAtTime: row.student_year_at_time,
      tags: row.tags ? JSON.parse(row.tags) : [],
      updatedAt: row.updated_at
    };
  }
}

// Export for use in report controller
export const Note = NoteModel;