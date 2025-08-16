import database, { generateId } from '../database/connection';
import path from 'path';
import fs from 'fs/promises';

export interface CareerDocument {
  id: string;
  student_id: string;
  document_type: 'Resume' | 'Cover Letter' | 'Portfolio' | 'LinkedIn Profile' | 'Other';
  version_number: number;
  review_date?: Date;
  reviewer_notes?: string;
  improvements_made?: string;
  file_path?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  created_at: Date;
  updated_at: Date;
}

export class CareerDocumentModel {
  static readonly UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'career-documents');
  
  static async create(data: Omit<CareerDocument, 'id' | 'created_at' | 'updated_at' | 'version_number'>): Promise<CareerDocument> {
    const id = generateId();
    const now = new Date().toISOString();
    
    // Get the latest version number for this student and document type
    const versionQuery = `
      SELECT MAX(version_number) as max_version 
      FROM career_documents 
      WHERE student_id = ? AND document_type = ?
    `;
    const versionResult = await database.query(versionQuery, [data.student_id, data.document_type]);
    const version_number = (versionResult.rows[0]?.max_version || 0) + 1;
    
    const query = `
      INSERT INTO career_documents (
        id, student_id, document_type, version_number, review_date,
        reviewer_notes, improvements_made, file_path, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      id,
      data.student_id,
      data.document_type,
      version_number,
      data.review_date || null,
      data.reviewer_notes || null,
      data.improvements_made || null,
      data.file_path || null,
      now,
      now
    ];
    
    await database.query(query, values);
    return this.findById(id);
  }
  
  static async findById(id: string): Promise<CareerDocument | null> {
    const result = await database.query(
      'SELECT * FROM career_documents WHERE id = ?',
      [id]
    );
    
    return result.rows.length > 0 ? this.transformFromDb(result.rows[0]) : null;
  }
  
  static async findByStudent(studentId: string, documentType?: string): Promise<CareerDocument[]> {
    let query = 'SELECT * FROM career_documents WHERE student_id = ?';
    const params: any[] = [studentId];
    
    if (documentType) {
      query += ' AND document_type = ?';
      params.push(documentType);
    }
    
    query += ' ORDER BY document_type, version_number DESC';
    
    const result = await database.query(query, params);
    return result.rows.map(row => this.transformFromDb(row));
  }
  
  static async getLatestByType(studentId: string, documentType: string): Promise<CareerDocument | null> {
    const query = `
      SELECT * FROM career_documents 
      WHERE student_id = ? AND document_type = ?
      ORDER BY version_number DESC
      LIMIT 1
    `;
    
    const result = await database.query(query, [studentId, documentType]);
    return result.rows.length > 0 ? this.transformFromDb(result.rows[0]) : null;
  }
  
  static async update(id: string, data: Partial<Omit<CareerDocument, 'id' | 'created_at' | 'updated_at' | 'version_number'>>): Promise<CareerDocument | null> {
    const updates: string[] = [];
    const values: any[] = [];
    
    const fields = [
      'review_date', 'reviewer_notes', 'improvements_made', 'file_path'
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
    
    const query = `UPDATE career_documents SET ${updates.join(', ')} WHERE id = ?`;
    await database.query(query, values);
    
    return this.findById(id);
  }
  
  static async delete(id: string): Promise<boolean> {
    // Get document info first
    const doc = await this.findById(id);
    if (!doc) return false;
    
    // Delete file if exists
    if (doc.file_path) {
      try {
        await fs.unlink(doc.file_path);
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }
    
    // Delete database record
    const result = await database.query('DELETE FROM career_documents WHERE id = ?', [id]);
    return result.rowCount > 0;
  }
  
  static async saveFile(studentId: string, documentType: string, file: Express.Multer.File): Promise<string> {
    // Ensure upload directory exists
    await fs.mkdir(this.UPLOAD_DIR, { recursive: true });
    
    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedType = documentType.replace(/\s+/g, '_');
    const ext = path.extname(file.originalname);
    const filename = `${studentId}_${sanitizedType}_${timestamp}${ext}`;
    const filepath = path.join(this.UPLOAD_DIR, filename);
    
    // Move file to destination
    await fs.rename(file.path, filepath);
    
    return filepath;
  }
  
  static async getReviewStats(): Promise<any> {
    const query = `
      SELECT 
        document_type,
        COUNT(DISTINCT student_id) as unique_students,
        COUNT(*) as total_documents,
        AVG(version_number) as avg_versions,
        COUNT(CASE WHEN review_date IS NOT NULL THEN 1 END) as reviewed_count
      FROM career_documents
      GROUP BY document_type
      ORDER BY total_documents DESC
    `;
    
    const result = await database.query(query);
    return result.rows;
  }
  
  private static transformFromDb(row: any): CareerDocument {
    return {
      id: row.id,
      student_id: row.student_id,
      document_type: row.document_type,
      version_number: row.version_number,
      review_date: row.review_date ? new Date(row.review_date) : undefined,
      reviewer_notes: row.reviewer_notes,
      improvements_made: row.improvements_made,
      file_path: row.file_path,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }

  static async findByStudentId(studentId: string): Promise<CareerDocument[]> {
    return this.findByStudent(studentId);
  }

  static async findRecent(limit: number = 100): Promise<CareerDocument[]> {
    const result = await database.query(
      'SELECT * FROM career_documents ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    
    return result.rows.map(row => this.transformFromDb(row));
  }

  static async findAll(): Promise<CareerDocument[]> {
    const result = await database.query('SELECT * FROM career_documents ORDER BY created_at DESC');
    return result.rows.map(row => this.transformFromDb(row));
  }
}