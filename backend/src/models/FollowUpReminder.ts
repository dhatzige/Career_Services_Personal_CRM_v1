import database from '../database/connection';
import { FollowUpReminder, CreateFollowUpReminderRequest } from '../types';

export class FollowUpReminderModel {
  /**
   * Create a new follow-up reminder for a student
   */
  static async create(studentId: string, data: CreateFollowUpReminderRequest): Promise<FollowUpReminder> {
    const query = `
      INSERT INTO follow_up_reminders (
        student_id, reminder_date, description, priority, completed
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      studentId,
      data.date,
      data.description,
      data.priority,
      false // Default to not completed
    ];

    const result = await database.query(query, values);
    return this.transformFromDb(result.rows[0]);
  }

  /**
   * Find all follow-up reminders for a specific student
   */
  static async findByStudentId(studentId: string): Promise<FollowUpReminder[]> {
    const query = `
      SELECT * FROM follow_up_reminders 
      WHERE student_id = $1 
      ORDER BY reminder_date ASC
    `;
    
    const result = await database.query(query, [studentId]);
    return result.rows.map(row => this.transformFromDb(row));
  }

  /**
   * Find follow-up reminder by ID
   */
  static async findById(id: string): Promise<FollowUpReminder | null> {
    const query = 'SELECT * FROM follow_up_reminders WHERE id = $1';
    const result = await database.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.transformFromDb(result.rows[0]);
  }

  /**
   * Update follow-up reminder
   */
  static async update(id: string, data: Partial<CreateFollowUpReminderRequest>): Promise<FollowUpReminder | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Build dynamic update query
    if (data.date !== undefined) {
      fields.push(`reminder_date = $${paramCount++}`);
      values.push(data.date);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.priority !== undefined) {
      fields.push(`priority = $${paramCount++}`);
      values.push(data.priority);
    }

    if (fields.length === 0) {
      // No fields to update, return existing record
      return this.findById(id);
    }

    // Add updated_at timestamp
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE follow_up_reminders 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await database.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.transformFromDb(result.rows[0]);
  }

  /**
   * Mark follow-up reminder as completed
   */
  static async markCompleted(id: string): Promise<FollowUpReminder | null> {
    const query = `
      UPDATE follow_up_reminders 
      SET completed = true, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await database.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.transformFromDb(result.rows[0]);
  }

  /**
   * Delete follow-up reminder
   */
  static async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM follow_up_reminders WHERE id = $1';
    const result = await database.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Find overdue follow-up reminders
   */
  static async findOverdue(): Promise<FollowUpReminder[]> {
    const query = `
      SELECT fur.*, s.first_name, s.last_name, s.email
      FROM follow_up_reminders fur
      JOIN students s ON fur.student_id = s.id
      WHERE fur.reminder_date < CURRENT_DATE 
        AND fur.completed = false
      ORDER BY fur.reminder_date ASC, fur.priority DESC
    `;
    
    const result = await database.query(query);
    return result.rows.map(row => ({
      ...this.transformFromDb(row),
      student: {
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email
      }
    }));
  }

  /**
   * Find upcoming follow-up reminders (next 7 days)
   */
  static async findUpcoming(days: number = 7): Promise<FollowUpReminder[]> {
    const query = `
      SELECT fur.*, s.first_name, s.last_name, s.email
      FROM follow_up_reminders fur
      JOIN students s ON fur.student_id = s.id
      WHERE fur.reminder_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${days} days'
        AND fur.completed = false
      ORDER BY fur.reminder_date ASC, fur.priority DESC
    `;
    
    const result = await database.query(query);
    return result.rows.map(row => ({
      ...this.transformFromDb(row),
      student: {
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email
      }
    }));
  }

  /**
   * Get follow-up reminder statistics
   */
  static async getStatistics(): Promise<any> {
    const queries = await Promise.all([
      // Total count
      database.query('SELECT COUNT(*) as total FROM follow_up_reminders'),
      
      // Completed count
      database.query('SELECT COUNT(*) as completed FROM follow_up_reminders WHERE completed = true'),
      
      // Overdue count
      database.query(`
        SELECT COUNT(*) as overdue 
        FROM follow_up_reminders 
        WHERE reminder_date < CURRENT_DATE AND completed = false
      `),
      
      // Upcoming count (next 7 days)
      database.query(`
        SELECT COUNT(*) as upcoming 
        FROM follow_up_reminders 
        WHERE reminder_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
          AND completed = false
      `),
      
      // By priority
      database.query(`
        SELECT priority, COUNT(*) as count 
        FROM follow_up_reminders 
        WHERE completed = false
        GROUP BY priority
      `),
      
      // Recent completed (last 30 days)
      database.query(`
        SELECT COUNT(*) as recent_completed 
        FROM follow_up_reminders 
        WHERE completed = true 
          AND completed_at >= CURRENT_DATE - INTERVAL '30 days'
      `)
    ]);

    const [total, completed, overdue, upcoming, byPriority, recentCompleted] = queries;

    const stats = {
      total: parseInt(total.rows[0].total),
      completed: parseInt(completed.rows[0].completed),
      pending: parseInt(total.rows[0].total) - parseInt(completed.rows[0].completed),
      overdue: parseInt(overdue.rows[0].overdue),
      upcoming: parseInt(upcoming.rows[0].upcoming),
      recentCompleted: parseInt(recentCompleted.rows[0].recent_completed),
      completionRate: parseInt(total.rows[0].total) > 0 
        ? Math.round((parseInt(completed.rows[0].completed) / parseInt(total.rows[0].total)) * 100)
        : 0,
      byPriority: byPriority.rows.reduce((acc, row) => {
        acc[row.priority] = parseInt(row.count);
        return acc;
      }, { High: 0, Medium: 0, Low: 0 })
    };

    return stats;
  }

  /**
   * Transform database row to application model
   */
  private static transformFromDb(row: any): FollowUpReminder {
    return {
      id: row.id,
      studentId: row.student_id,
      date: row.reminder_date,
      description: row.description,
      priority: row.priority,
      completed: row.completed,
      completedAt: row.completed_at,
      dateCreated: row.created_at,
      dateUpdated: row.updated_at
    };
  }
} 