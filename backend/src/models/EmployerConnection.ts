import database, { generateId } from '../database/connection';

export interface EmployerConnection {
  id: string;
  student_id: string;
  company_name: string;
  contact_name: string;
  contact_title?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_linkedin?: string;
  connection_type: 'Alumni' | 'Recruiter' | 'Hiring Manager' | 'Employee Referral' | 'Career Fair' | 'Info Session' | 'Other';
  interaction_date: Date;
  interaction_notes?: string;
  follow_up_date?: Date;
  relationship_strength: 'New' | 'Building' | 'Strong' | 'Champion';
  opportunities_discussed?: string;
  next_steps?: string;
  created_at: Date;
  updated_at: Date;
}

export class EmployerConnectionModel {
  static async create(data: Omit<EmployerConnection, 'id' | 'created_at' | 'updated_at'>): Promise<EmployerConnection> {
    const id = generateId();
    const now = new Date().toISOString();
    
    const query = `
      INSERT INTO employer_connections (
        id, student_id, company_name, contact_name, contact_title,
        contact_email, contact_phone, contact_linkedin, connection_type,
        interaction_date, interaction_notes, follow_up_date, relationship_strength,
        opportunities_discussed, next_steps, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      id,
      data.student_id,
      data.company_name,
      data.contact_name,
      data.contact_title || null,
      data.contact_email || null,
      data.contact_phone || null,
      data.contact_linkedin || null,
      data.connection_type,
      data.interaction_date,
      data.interaction_notes || null,
      data.follow_up_date || null,
      data.relationship_strength,
      data.opportunities_discussed || null,
      data.next_steps || null,
      now,
      now
    ];
    
    await database.query(query, values);
    return this.findById(id);
  }
  
  static async findById(id: string): Promise<EmployerConnection | null> {
    const result = await database.query(
      'SELECT * FROM employer_connections WHERE id = ?',
      [id]
    );
    
    return result.rows.length > 0 ? this.transformFromDb(result.rows[0]) : null;
  }
  
  static async findByStudent(studentId: string): Promise<EmployerConnection[]> {
    const result = await database.query(
      'SELECT * FROM employer_connections WHERE student_id = ? ORDER BY interaction_date DESC',
      [studentId]
    );
    
    return result.rows.map(row => this.transformFromDb(row));
  }
  
  static async findByCompany(companyName: string): Promise<EmployerConnection[]> {
    const result = await database.query(
      'SELECT * FROM employer_connections WHERE company_name LIKE ? ORDER BY interaction_date DESC',
      [`%${companyName}%`]
    );
    
    return result.rows.map(row => this.transformFromDb(row));
  }
  
  static async update(id: string, data: Partial<Omit<EmployerConnection, 'id' | 'created_at' | 'updated_at'>>): Promise<EmployerConnection | null> {
    const updates: string[] = [];
    const values: any[] = [];
    
    const fields = [
      'company_name', 'contact_name', 'contact_title', 'contact_email',
      'contact_phone', 'contact_linkedin', 'connection_type', 'interaction_date',
      'interaction_notes', 'follow_up_date', 'relationship_strength',
      'opportunities_discussed', 'next_steps'
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
    
    const query = `UPDATE employer_connections SET ${updates.join(', ')} WHERE id = ?`;
    await database.query(query, values);
    
    return this.findById(id);
  }
  
  static async delete(id: string): Promise<boolean> {
    const result = await database.query('DELETE FROM employer_connections WHERE id = ?', [id]);
    return result.rowCount > 0;
  }
  
  static async getUpcomingFollowUps(days: number = 7): Promise<any[]> {
    const query = `
      SELECT 
        ec.*,
        s.name as student_name,
        s.email as student_email
      FROM employer_connections ec
      JOIN students s ON ec.student_id = s.id
      WHERE ec.follow_up_date >= datetime('now') 
        AND ec.follow_up_date <= datetime('now', '+' || ? || ' days')
      ORDER BY ec.follow_up_date
    `;
    
    const result = await database.query(query, [days]);
    return result.rows;
  }
  
  static async getNetworkStats(studentId?: string): Promise<any> {
    let whereClause = '';
    const params: any[] = [];
    
    if (studentId) {
      whereClause = 'WHERE student_id = ?';
      params.push(studentId);
    }
    
    const query = `
      SELECT 
        COUNT(DISTINCT company_name) as unique_companies,
        COUNT(*) as total_connections,
        COUNT(DISTINCT contact_name) as unique_contacts,
        SUM(CASE WHEN relationship_strength = 'Strong' OR relationship_strength = 'Champion' THEN 1 ELSE 0 END) as strong_connections,
        COUNT(CASE WHEN follow_up_date >= datetime('now') THEN 1 END) as pending_followups
      FROM employer_connections ${whereClause}
    `;
    
    const result = await database.query(query, params);
    return result.rows[0];
  }
  
  static async getTopCompanies(limit: number = 10): Promise<any[]> {
    const query = `
      SELECT 
        company_name,
        COUNT(*) as connection_count,
        COUNT(DISTINCT student_id) as student_count
      FROM employer_connections
      GROUP BY company_name
      ORDER BY connection_count DESC
      LIMIT ?
    `;
    
    const result = await database.query(query, [limit]);
    return result.rows;
  }
  
  private static transformFromDb(row: any): EmployerConnection {
    return {
      id: row.id,
      student_id: row.student_id,
      company_name: row.company_name,
      contact_name: row.contact_name,
      contact_title: row.contact_title,
      contact_email: row.contact_email,
      contact_phone: row.contact_phone,
      contact_linkedin: row.contact_linkedin,
      connection_type: row.connection_type,
      interaction_date: new Date(row.interaction_date),
      interaction_notes: row.interaction_notes,
      follow_up_date: row.follow_up_date ? new Date(row.follow_up_date) : undefined,
      relationship_strength: row.relationship_strength,
      opportunities_discussed: row.opportunities_discussed,
      next_steps: row.next_steps,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }

  static async findByStudentId(studentId: string): Promise<EmployerConnection[]> {
    return this.findByStudent(studentId);
  }

  static async findRecent(limit: number = 100): Promise<EmployerConnection[]> {
    const result = await database.query(
      'SELECT * FROM employer_connections ORDER BY interaction_date DESC LIMIT ?',
      [limit]
    );
    
    return result.rows.map(row => this.transformFromDb(row));
  }

  static async findAll(): Promise<EmployerConnection[]> {
    const result = await database.query('SELECT * FROM employer_connections ORDER BY interaction_date DESC');
    return result.rows.map(row => this.transformFromDb(row));
  }
}