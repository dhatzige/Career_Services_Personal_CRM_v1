import { Request, Response } from 'express';
import { StudentModel } from '../models/Student';
import { NoteModel } from '../models/Note';
import { ConsultationModel } from '../models/Consultation';
import { FollowUpReminderModel } from '../models/FollowUpReminder';
import database from '../database/connection';
import { dashboardCache } from '../utils/cache';

export const stats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Use cache for dashboard stats
    const stats = await dashboardCache.getStats(async () => {
      // Get total students
      const totalStudentsQuery = 'SELECT COUNT(*) as count FROM students';
      const totalStudentsResult = await database.query(totalStudentsQuery);
      const totalStudents = totalStudentsResult.rows[0]?.count || 0;
      
      // Get active students (with recent consultations)
      const activeStudentsQuery = `
        SELECT COUNT(DISTINCT student_id) as count
        FROM consultations
        WHERE consultation_date > datetime('now', '-90 days')
      `;
      const activeResult = await database.query(activeStudentsQuery);
      const activeStudents = activeResult.rows[0]?.count || 0;
      
      // Get total consultations
      const totalConsultationsQuery = 'SELECT COUNT(*) as count FROM consultations';
      const totalConsultationsResult = await database.query(totalConsultationsQuery);
      const totalConsultations = totalConsultationsResult.rows[0]?.count || 0;
      
      // Get this month's consultations
      const monthlyConsultationsQuery = `
        SELECT COUNT(*) as count
        FROM consultations
        WHERE strftime('%Y-%m', consultation_date) = strftime('%Y-%m', 'now')
      `;
      const monthlyResult = await database.query(monthlyConsultationsQuery);
      const monthlyConsultations = monthlyResult.rows[0]?.count || 0;
      
      // Get pending follow-ups
      const pendingFollowUpsQuery = `
        SELECT COUNT(*) as count
        FROM follow_up_reminders
        WHERE completed = 0 AND reminder_date <= datetime('now', '+7 days')
      `;
      const pendingResult = await database.query(pendingFollowUpsQuery);
      const pendingFollowUps = pendingResult.rows[0]?.count || 0;
      
      // Get recent notes count
      const recentNotesQuery = `
        SELECT COUNT(*) as count
        FROM notes
        WHERE date_created > datetime('now', '-7 days')
      `;
      const notesResult = await database.query(recentNotesQuery);
      const recentNotes = notesResult.rows[0]?.count || 0;
      
      return {
        totalStudents,
        activeStudents,
        totalConsultations,
        monthlyConsultations,
        pendingFollowUps,
        recentNotes,
        lastUpdated: new Date().toISOString()
      };
    });
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
};

export const activity = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Get recent activity across multiple tables
    const activityQuery = `
      SELECT 
        'consultation' as type,
        c.id,
        c.student_id,
        s.first_name || ' ' || s.last_name as student_name,
        c.consultation_date as created_at,
        'Consultation with ' || s.first_name || ' ' || s.last_name as description,
        c.type as details
      FROM consultations c
      JOIN students s ON c.student_id = s.id
      
      UNION ALL
      
      SELECT 
        'note' as type,
        n.id,
        n.student_id,
        s.first_name || ' ' || s.last_name as student_name,
        n.date_created as created_at,
        'Note added for ' || s.first_name || ' ' || s.last_name as description,
        n.type as details
      FROM notes n
      JOIN students s ON n.student_id = s.id
      
      UNION ALL
      
      SELECT 
        'student' as type,
        s.id,
        s.id as student_id,
        s.first_name || ' ' || s.last_name as student_name,
        s.date_added as created_at,
        'New student registered: ' || s.first_name || ' ' || s.last_name as description,
        s.specific_program as details
      FROM students s
      
      ORDER BY created_at DESC
      LIMIT ?
    `;
    
    const result = await database.query(activityQuery, [limit]);
    
    res.json({
      success: true,
      activity: result.rows
    });
  } catch (error) {
    console.error('Activity feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity feed'
    });
  }
};

export const metrics = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get consultation trends by month
    const trendsQuery = `
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as consultations,
        COUNT(DISTINCT student_id) as unique_students
      FROM consultations
      WHERE created_at > datetime('now', '-12 months')
      GROUP BY month
      ORDER BY month
    `;
    const trendsResult = await database.query(trendsQuery);
    
    // Get consultation types distribution
    const typesQuery = `
      SELECT 
        consultation_type,
        COUNT(*) as count
      FROM consultations
      WHERE created_at > datetime('now', '-90 days')
      GROUP BY consultation_type
      ORDER BY count DESC
    `;
    const typesResult = await database.query(typesQuery);
    
    // Get programs distribution
    const programsQuery = `
      SELECT 
        program,
        COUNT(*) as count
      FROM students
      WHERE status = 'active'
      GROUP BY program
      ORDER BY count DESC
    `;
    const programsResult = await database.query(programsQuery);
    
    // Get year distribution
    const yearsQuery = `
      SELECT 
        year,
        COUNT(*) as count
      FROM students
      WHERE status = 'active'
      GROUP BY year
      ORDER BY year
    `;
    const yearsResult = await database.query(yearsQuery);
    
    res.json({
      success: true,
      metrics: {
        consultationTrends: trendsResult.rows,
        consultationTypes: typesResult.rows,
        programDistribution: programsResult.rows,
        yearDistribution: yearsResult.rows
      }
    });
  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching metrics'
    });
  }
};

export const upcoming = async (req: Request, res: Response): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    
    // Get upcoming follow-ups
    const upcomingQuery = `
      SELECT 
        f.id,
        f.student_id,
        s.name as student_name,
        s.email as student_email,
        f.reminder_type,
        f.message,
        f.due_date,
        f.priority,
        CASE 
          WHEN f.due_date < datetime('now') THEN 'overdue'
          WHEN f.due_date < datetime('now', '+1 day') THEN 'today'
          WHEN f.due_date < datetime('now', '+2 days') THEN 'tomorrow'
          ELSE 'upcoming'
        END as status
      FROM follow_up_reminders f
      JOIN students s ON f.student_id = s.id
      WHERE f.completed = 0 
        AND f.due_date <= datetime('now', '+' || ? || ' days')
      ORDER BY f.due_date ASC
    `;
    
    const result = await database.query(upcomingQuery, [days]);
    
    res.json({
      success: true,
      upcoming: result.rows
    });
  } catch (error) {
    console.error('Upcoming error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming items'
    });
  }
};

export const health = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check database health
    const dbHealth = database.isHealthy();
    const dbStats = database.getStats();
    
    // Get table sizes
    const tableSizesQuery = `
      SELECT name, 
        (SELECT COUNT(*) FROM " || name || ") as row_count
      FROM sqlite_master 
      WHERE type='table' 
        AND name NOT LIKE 'sqlite_%'
    `;
    
    const tables: any[] = [];
    const tableNames = ['students', 'notes', 'consultations', 'follow_up_reminders', 'users'];
    
    for (const table of tableNames) {
      try {
        const result = await database.query(`SELECT COUNT(*) as count FROM ${table}`);
        tables.push({ name: table, rows: result.rows[0]?.count || 0 });
      } catch (error) {
        tables.push({ name: table, rows: 0, error: true });
      }
    }
    
    res.json({
      success: true,
      health: {
        status: dbHealth ? 'healthy' : 'unhealthy',
        database: dbStats,
        tables,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing health check'
    });
  }
}; 