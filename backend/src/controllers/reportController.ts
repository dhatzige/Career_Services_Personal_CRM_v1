import { Request, Response } from 'express';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { Consultation } from '../models/Consultation';
import { Student } from '../models/Student';
import { Note } from '../models/Note';
import { EmailService } from '../services/emailService';
import logger from '../utils/logger';
import * as Sentry from '@sentry/node';

export const reportController = {
  // Generate daily summary report
  async getDailySummary(req: Request, res: Response): Promise<void> {
    try {
      const { date = new Date().toISOString() } = req.query;
      const targetDate = parseISO(date as string);
      const dayStart = startOfDay(targetDate);
      const dayEnd = endOfDay(targetDate);

      // Get all consultations for the day
      const consultations = await Consultation.getConsultationsByDateRange(
        dayStart.toISOString(),
        dayEnd.toISOString()
      );

      // Get consultation statistics
      const totalScheduled = consultations.length;
      const attended = consultations.filter(c => c.status === 'attended').length;
      const noShows = consultations.filter(c => c.status === 'no-show').length;
      const cancelled = consultations.filter(c => c.status === 'cancelled').length;
      const rescheduled = consultations.filter(c => c.status === 'rescheduled').length;
      const pending = consultations.filter(c => c.status === 'scheduled').length;

      // Group consultations by advisor
      const byAdvisor: Record<string, any[]> = {};
      consultations.forEach(consultation => {
        const advisor = consultation.advisorName || 'Unassigned';
        if (!byAdvisor[advisor]) {
          byAdvisor[advisor] = [];
        }
        byAdvisor[advisor].push(consultation);
      });

      // Get notes created today
      const notes = await Note.getNotesByDateRange(
        dayStart.toISOString(),
        dayEnd.toISOString()
      );

      // Get students with multiple no-shows
      const students = await Student.getStudentsWithNoShowsOnDate(dayStart.toISOString());
      const studentsWithNoShowsToday = students.filter(s => 
        consultations.some(c => 
          c.studentId === s.id && c.status === 'no-show'
        )
      );

      const summary = {
        date: dayStart.toISOString(),
        displayDate: format(dayStart, 'MMMM d, yyyy'),
        consultations: {
          total: totalScheduled,
          attended,
          noShows,
          cancelled,
          rescheduled,
          pending,
          attendanceRate: totalScheduled > 0 
            ? ((attended / totalScheduled) * 100).toFixed(1) + '%'
            : '0%'
        },
        byAdvisor: Object.entries(byAdvisor).map(([advisor, consultations]) => ({
          advisor,
          total: consultations.length,
          attended: consultations.filter(c => c.status === 'attended').length,
          noShows: consultations.filter(c => c.status === 'no-show').length
        })),
        notesCreated: notes.length,
        studentsWithNoShowsToday: studentsWithNoShowsToday.map(s => ({
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          email: s.email,
          noShowCount: s.noShowCount
        })),
        advisorMetrics: Object.entries(byAdvisor).map(([advisor, consultations]) => ({
          advisorName: advisor,
          total: consultations.length,
          attended: consultations.filter(c => c.status === 'attended').length,
          noShows: consultations.filter(c => c.status === 'no-show').length,
          cancelled: consultations.filter(c => c.status === 'cancelled').length,
          avgDuration: consultations.filter(c => c.duration).reduce((sum, c) => sum + c.duration, 0) / consultations.filter(c => c.duration).length || 0,
          attendanceRate: consultations.length > 0 
            ? ((consultations.filter(c => c.status === 'attended').length / consultations.length) * 100).toFixed(1) + '%'
            : '0%'
        }))
      };

      res.json(summary);
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Error generating daily summary:', error);
      res.status(500).json({ error: 'Failed to generate daily summary' });
    }
  },

  // Generate weekly metrics report
  async getWeeklyMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { startDate = startOfWeek(new Date()).toISOString() } = req.query;
      const weekStart = startOfWeek(parseISO(startDate as string));
      const weekEnd = endOfWeek(weekStart);

      // Get all data for the week
      const consultations = await Consultation.getConsultationsByDateRange(
        weekStart.toISOString(),
        weekEnd.toISOString()
      );

      const notes = await Note.getNotesByDateRange(
        weekStart.toISOString(),
        weekEnd.toISOString()
      );

      const students = await Student.getAllStudents();

      // Calculate metrics
      const metrics = {
        weekOf: format(weekStart, 'MMMM d, yyyy'),
        summary: {
          totalConsultations: consultations.length,
          totalAttended: consultations.filter(c => c.status === 'attended').length,
          totalNoShows: consultations.filter(c => c.status === 'no-show').length,
          totalCancelled: consultations.filter(c => c.status === 'cancelled').length,
          attendanceRate: consultations.length > 0 
            ? ((consultations.filter(c => c.status === 'attended').length / consultations.length) * 100).toFixed(1) + '%'
            : '0%',
          totalNotesCreated: notes.length,
          uniqueStudentsSeen: new Set(consultations.filter(c => c.status === 'attended').map(c => c.studentId)).size
        },
        dailyBreakdown: [],
        studentEngagement: {
          highEngagement: 0,
          mediumEngagement: 0,
          lowEngagement: 0,
          noEngagement: 0
        },
        consultationTypes: {} as Record<string, number>,
        topicsDiscussed: [] as Array<{ topic: string; count: number }>
      };

      // Daily breakdown
      for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
        const dayStart = startOfDay(d);
        const dayEnd = endOfDay(d);
        const dayConsultations = consultations.filter(c => {
          const consultDate = new Date(c.date);
          return consultDate >= dayStart && consultDate <= dayEnd;
        });

        metrics.dailyBreakdown.push({
          date: format(d, 'yyyy-MM-dd'),
          displayDate: format(d, 'EEEE, MMMM d'),
          total: dayConsultations.length,
          attended: dayConsultations.filter(c => c.status === 'attended').length,
          noShows: dayConsultations.filter(c => c.status === 'no-show').length
        });
      }

      // Student engagement analysis
      students.forEach(student => {
        const studentConsultations = consultations.filter(c => c.studentId === student.id);
        const attendedCount = studentConsultations.filter(c => c.status === 'attended').length;
        
        if (attendedCount >= 3) {
          metrics.studentEngagement.highEngagement++;
        } else if (attendedCount === 2) {
          metrics.studentEngagement.mediumEngagement++;
        } else if (attendedCount === 1) {
          metrics.studentEngagement.lowEngagement++;
        } else {
          metrics.studentEngagement.noEngagement++;
        }
      });

      // Consultation types breakdown
      consultations.forEach(c => {
        metrics.consultationTypes[c.type] = (metrics.consultationTypes[c.type] || 0) + 1;
      });

      // Topics analysis
      const topicCounts: Record<string, number> = {};
      consultations.forEach(c => {
        if (c.topic) {
          topicCounts[c.topic] = (topicCounts[c.topic] || 0) + 1;
        }
      });
      
      metrics.topicsDiscussed = Object.entries(topicCounts)
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      res.json(metrics);
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Error generating weekly metrics:', error);
      res.status(500).json({ error: 'Failed to generate weekly metrics' });
    }
  },

  // Send daily summary email
  async sendDailySummaryEmail(req: Request, res: Response): Promise<void> {
    try {
      const { recipientEmail, date = new Date().toISOString() } = req.body;
      
      if (!recipientEmail) {
        res.status(400).json({ error: 'Recipient email is required' });
        return;
      }

      // Get the daily summary data
      const targetDate = parseISO(date);
      const dayStart = startOfDay(targetDate);
      const dayEnd = endOfDay(targetDate);

      const consultations = await Consultation.getConsultationsByDateRange(
        dayStart.toISOString(),
        dayEnd.toISOString()
      );

      const notes = await Note.getNotesByDateRange(
        dayStart.toISOString(),
        dayEnd.toISOString()
      );

      const totalScheduled = consultations.length;
      const attended = consultations.filter(c => c.status === 'attended').length;
      const noShows = consultations.filter(c => c.status === 'no-show').length;
      const cancelled = consultations.filter(c => c.status === 'cancelled').length;

      // Create email content
      const emailHtml = `
        <h2>Daily Summary for ${format(dayStart, 'MMMM d, yyyy')}</h2>
        
        <h3>Consultation Statistics</h3>
        <ul>
          <li>Total Scheduled: ${totalScheduled}</li>
          <li>Attended: ${attended}</li>
          <li>No-Shows: ${noShows}</li>
          <li>Cancelled: ${cancelled}</li>
          <li>Attendance Rate: ${totalScheduled > 0 ? ((attended / totalScheduled) * 100).toFixed(1) : 0}%</li>
        </ul>
        
        <h3>Activity</h3>
        <ul>
          <li>Notes Created: ${notes.length}</li>
        </ul>
        
        <p>This is an automated summary from the Career Services CRM.</p>
      `;

      await EmailService.sendEmail({
        to: recipientEmail,
        subject: `Career Services Daily Summary - ${format(dayStart, 'MMM d, yyyy')}`,
        html: emailHtml
      });

      res.json({ 
        success: true, 
        message: 'Daily summary email sent successfully',
        recipient: recipientEmail 
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Error sending daily summary email:', error);
      res.status(500).json({ error: 'Failed to send daily summary email' });
    }
  },

  // Export data to CSV
  async exportData(req: Request, res: Response): Promise<void> {
    try {
      const { type, startDate, endDate, format: exportFormat = 'csv' } = req.query;
      
      if (!['consultations', 'students', 'notes', 'weekly-metrics'].includes(type as string)) {
        res.status(400).json({ error: 'Invalid export type' });
        return;
      }

      let data: any[] = [];
      let filename = '';

      switch (type) {
        case 'consultations':
          if (startDate && endDate) {
            data = await Consultation.getConsultationsByDateRange(
              startDate as string,
              endDate as string
            );
          } else {
            data = await Consultation.findAll();
          }
          filename = `consultations_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          break;

        case 'students':
          // Get raw student data for proper CSV export
          const rawStudents = await Student.getAllStudentsForExport();
          data = rawStudents;
          filename = `students_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          break;

        case 'notes':
          if (startDate && endDate) {
            data = await Note.getNotesByDateRange(
              startDate as string,
              endDate as string
            );
          } else {
            data = await Note.findAll();
          }
          filename = `notes_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          break;

        case 'weekly-metrics':
          // Export weekly metrics as CSV
          const targetDate = startDate ? parseISO(startDate as string) : new Date();
          const weekStart = startOfWeek(targetDate);
          const weekEnd = endOfWeek(targetDate);
          
          const consultations = await Consultation.getConsultationsByDateRange(
            weekStart.toISOString(),
            weekEnd.toISOString()
          );

          // Transform to flat structure for CSV
          data = consultations.map(c => ({
            date: format(new Date(c.date), 'yyyy-MM-dd'),
            time: format(new Date(c.date), 'HH:mm'),
            studentName: `${c.student?.firstName} ${c.student?.lastName}`,
            studentEmail: c.student?.email,
            type: c.type,
            status: c.status,
            duration: c.duration,
            advisor: c.advisorName || 'N/A',
            notes: c.notes || ''
          }));
          
          filename = `weekly-report_${format(weekStart, 'yyyy-MM-dd')}.csv`;
          break;
      }

      if (exportFormat === 'csv') {
        const csv = convertToCSV(data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
      } else {
        res.json(data);
      }
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Error exporting data:', error);
      res.status(500).json({ error: 'Failed to export data' });
    }
  },

  // Import data from CSV
  async importData(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.body;
      const { data: csvData } = req.body;

      if (!['students'].includes(type)) {
        res.status(400).json({ error: 'Only student import is currently supported' });
        return;
      }

      if (!csvData || !Array.isArray(csvData)) {
        res.status(400).json({ error: 'Invalid CSV data format' });
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const row of csvData) {
        try {
          // Extract student data from CSV row
          const studentData = {
            firstName: row['First Name'] || row['firstName'] || '',
            lastName: row['Last Name'] || row['lastName'] || '',
            email: row['Email'] || row['email'] || '',
            phone: row['Phone'] || row['phone'] || '',
            yearOfStudy: row['Current Year'] || row['Year of Study'] || row['yearOfStudy'] || '1st year',
            programType: row['Program Type'] || row['programType'] || "Bachelor's",
            specificProgram: row['Degree Program'] || row['Specific Program'] || row['specificProgram'] || '',
            status: row['Status'] || row['status'] || 'Active',
            major: row['Major/Specialization'] || row['Major'] || row['major'] || ''
          };

          // Validate required fields
          if (!studentData.firstName || !studentData.lastName || !studentData.email) {
            errorCount++;
            errors.push(`Row missing required fields: ${JSON.stringify(row)}`);
            continue;
          }

          // Check if student already exists
          const existingStudent = await Student.findByEmail(studentData.email);
          if (existingStudent) {
            errorCount++;
            errors.push(`Student with email ${studentData.email} already exists`);
            continue;
          }

          // Create new student
          await Student.create(studentData);
          successCount++;

        } catch (error) {
          errorCount++;
          errors.push(`Error processing row: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      res.json({
        success: true,
        message: `Import completed: ${successCount} students imported successfully`,
        successCount,
        errorCount,
        errors: errors.slice(0, 10) // Return first 10 errors
      });

    } catch (error) {
      Sentry.captureException(error);
      logger.error('Error importing data:', error);
      res.status(500).json({ error: 'Failed to import data' });
    }
  }
};

// Helper function to convert data to CSV
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  // Get headers from first object
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');

  // Convert each row
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    }).join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
}