import { Request, Response } from 'express';
import { ClaudeService } from '../services/claudeService';
import { StudentModel } from '../models/Student';
import { NoteModel } from '../models/Note';
import { ApplicationModel } from '../models/Application';
import { MockInterviewModel } from '../models/MockInterview';
import { EmployerConnectionModel } from '../models/EmployerConnection';
import { CareerDocumentModel } from '../models/CareerDocument';
import { logAuditEvent } from '../middleware/security';

export const report = async (req: Request & { user?: any }, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    
    // Fetch student data
    const student = await StudentModel.findById(studentId);
    if (!student) {
      res.status(404).json({
        success: false,
        message: 'Student not found'
      });
      return;
    }
    
    // Fetch related data
    const [notes, applications] = await Promise.all([
      NoteModel.findByStudentId(studentId),
      ApplicationModel.findByStudent(studentId)
    ]);
    
    // Generate AI report
    const reportContent = await ClaudeService.generateStudentReport(
      student,
      notes,
      applications
    );
    
    logAuditEvent(req, 'GENERATE_AI_REPORT', 'ai', true, { studentId });
    
    res.json({
      success: true,
      report: {
        studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        generatedAt: new Date(),
        content: reportContent
      }
    });
  } catch (error) {
    console.error('AI report generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI report'
    });
  }
};

export const insightsForStudent = async (req: Request & { user?: any }, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    
    // Get latest interview data
    const interviews = await MockInterviewModel.findByStudent(studentId);
    const latestInterview = interviews[0];
    
    let interviewFeedback = null;
    if (latestInterview) {
      interviewFeedback = await ClaudeService.generateInterviewFeedback(latestInterview);
    }
    
    // Get career activity stats
    const [applicationStats, networkStats] = await Promise.all([
      ApplicationModel.getStats(studentId),
      EmployerConnectionModel.getNetworkStats(studentId)
    ]);
    
    const insights = [
      {
        type: 'application_activity',
        title: 'Application Progress',
        content: `You have ${applicationStats.applied} active applications with ${applicationStats.interviewing} in interview stage.`,
        priority: applicationStats.applied < 5 ? 'high' : 'medium'
      },
      {
        type: 'networking',
        title: 'Network Strength',
        content: `You have ${networkStats.total_connections} professional connections across ${networkStats.unique_companies} companies.`,
        priority: networkStats.total_connections < 10 ? 'high' : 'low'
      }
    ];
    
    if (interviewFeedback) {
      insights.push({
        type: 'interview_feedback',
        title: 'Latest Interview Feedback',
        content: interviewFeedback,
        priority: 'high'
      });
    }
    
    logAuditEvent(req, 'GENERATE_AI_INSIGHTS', 'ai', true, { studentId });
    
    res.json({
      success: true,
      insights
    });
  } catch (error) {
    console.error('AI insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate insights'
    });
  }
};

export const recommendations = async (req: Request & { user?: any }, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { type } = req.query;
    
    const student = await StudentModel.findById(studentId);
    if (!student) {
      res.status(404).json({
        success: false,
        message: 'Student not found'
      });
      return;
    }
    
    let recommendationContent = '';
    
    switch (type) {
      case 'career':
        const applications = await ApplicationModel.findByStudent(studentId);
        const topCompanies = [...new Set(applications.map(a => a.company_name))].slice(0, 5);
        const careerData = {
          applicationCount: applications.length,
          topCompanies,
          interviewRate: applications.filter(a => ['Interview Scheduled', 'Interviewed'].includes(a.status)).length / applications.length,
          connectionCount: (await EmployerConnectionModel.getNetworkStats(studentId)).total_connections
        };
        recommendationContent = await ClaudeService.generateCareerRecommendations(student, careerData);
        break;
        
      case 'networking':
        const connections = await EmployerConnectionModel.findByStudent(studentId);
        recommendationContent = await ClaudeService.generateNetworkingTips(connections);
        break;
        
      case 'resume':
        const latestResume = await CareerDocumentModel.getLatestByType(studentId, 'Resume');
        if (latestResume && latestResume.file_path) {
          // In production, you'd read the file content here
          recommendationContent = await ClaudeService.generateResumeReview(
            'Resume content would be extracted here',
            req.query.targetRole as string
          );
        } else {
          recommendationContent = 'No resume found. Please upload your resume for AI review.';
        }
        break;
        
      default:
        res.status(400).json({
          success: false,
          message: 'Invalid recommendation type. Use: career, networking, or resume'
        });
        return;
    }
    
    logAuditEvent(req, 'GENERATE_AI_RECOMMENDATIONS', 'ai', true, { studentId, type });
    
    res.json({
      success: true,
      recommendations: {
        type,
        studentId,
        generatedAt: new Date(),
        content: recommendationContent
      }
    });
  } catch (error) {
    console.error('AI recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations'
    });
  }
};

export const chat = async (req: Request & { user?: any }, res: Response): Promise<void> => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      res.status(400).json({
        success: false,
        message: 'Message is required'
      });
      return;
    }
    
    const systemPrompt = `You are a helpful career services assistant for a university. 
    You help students with career planning, job search strategies, interview preparation, 
    resume writing, and professional development. Be supportive, professional, and provide 
    actionable advice. If asked about specific student data, remind them to check their 
    profile or dashboard for detailed information.`;
    
    const response = await ClaudeService.generateText(message, systemPrompt);
    
    logAuditEvent(req, 'AI_CHAT', 'ai', true, { messageLength: message.length });
    
    res.json({
      success: true,
      response
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chat message'
    });
  }
};

export const dashboardReport = async (req: Request & { user?: any }, res: Response): Promise<void> => {
  try {
    const { monthlyData, students, consultations, trends } = req.body;
    
    if (!monthlyData || !students || !trends) {
      res.status(400).json({
        success: false,
        message: 'Missing required data for report generation'
      });
      return;
    }
    
    const report = await ClaudeService.generateDashboardReport({
      monthlyData,
      students,
      consultations,
      trends
    });
    
    logAuditEvent(req, 'GENERATE_DASHBOARD_REPORT', 'ai', true, { 
      studentCount: students.length,
      consultationCount: consultations.length 
    });
    
    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Dashboard AI report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate dashboard report'
    });
  }
};

export const analyticsInsights = async (req: Request & { user?: any }, res: Response): Promise<void> => {
  try {
    const { dateRange, metrics, studentCount, consultationTypes, programDistribution } = req.body;
    
    if (!dateRange || !metrics) {
      res.status(400).json({
        success: false,
        message: 'Missing required analytics data'
      });
      return;
    }
    
    // Generate AI-powered insights based on analytics data
    const insights = await generateAnalyticsInsights({
      dateRange,
      metrics,
      studentCount,
      consultationTypes,
      programDistribution
    });
    
    logAuditEvent(req, 'GENERATE_ANALYTICS_INSIGHTS', 'ai', true, { 
      dateRange: dateRange.label,
      studentCount 
    });
    
    res.json({
      success: true,
      insights
    });
  } catch (error) {
    console.error('Analytics AI insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate analytics insights'
    });
  }
};

// Helper function for analytics insights
async function generateAnalyticsInsights(data: any): Promise<string> {
  const { dateRange, metrics, consultationTypes, programDistribution } = data;
  
  // Try to use Claude AI if available
  try {
    const aiPrompt = `Analyze the following career services analytics data and provide actionable insights:

Date Range: ${dateRange.label}
Total Students: ${metrics.totalStudents}
Active Students: ${metrics.activeStudents}
Total Consultations: ${metrics.totalConsultations}
Attendance Rate: ${metrics.attendanceRate.toFixed(1)}%
No-Show Rate: ${metrics.noShowRate.toFixed(1)}%
Average Engagement Score: ${metrics.avgEngagementScore.toFixed(1)}

Consultation Types: ${JSON.stringify(consultationTypes)}
Program Distribution: ${JSON.stringify(programDistribution)}

Provide:
1. Key performance insights
2. Areas of concern that need attention
3. Success patterns to replicate
4. Specific actionable recommendations
5. Predictive insights for the next period`;

    const insights = await ClaudeService.generateText(aiPrompt, 'You are an analytics expert for a university career services center.');
    return insights;
  } catch (error) {
    // Fallback to detailed template-based insights
    const topConsultationType = Object.entries(consultationTypes || {})
      .sort(([,a], [,b]) => (b as number) - (a as number))[0];
    
    const topProgram = Object.entries(programDistribution || {})
      .sort(([,a], [,b]) => (b as number) - (a as number))[0];
    
    const insights = `## Analytics Insights for ${dateRange.label}

### 📊 Performance Overview
Your career services center demonstrated ${metrics.attendanceRate > 80 ? 'excellent' : metrics.attendanceRate > 60 ? 'good' : 'concerning'} performance with a **${metrics.attendanceRate.toFixed(1)}% attendance rate** across **${metrics.totalConsultations} consultations**.

### 🎯 Key Findings

1. **Engagement Patterns**
   - ${metrics.highEngagementStudents} students (${((metrics.highEngagementStudents / metrics.totalStudents) * 100).toFixed(1)}%) show high engagement with 3+ consultations
   - Average of ${metrics.avgConsultationsPerStudent.toFixed(1)} consultations per student ${metrics.avgConsultationsPerStudent > 2 ? 'exceeds' : 'meets'} typical benchmarks
   - ${metrics.noShowRate.toFixed(1)}% no-show rate ${metrics.noShowRate > 15 ? 'requires attention' : 'is within acceptable range'}

2. **Program Analysis**
   - ${metrics.topProgram} leads in consultation volume, indicating strong career service utilization
   - ${Object.keys(programDistribution || {}).length} different programs are actively engaged with career services
   - Consider replicating ${metrics.topProgram}'s engagement strategies across other programs

3. **Consultation Types**
   - Most popular consultation types: ${Object.entries(consultationTypes || {})
     .sort(([,a], [,b]) => (b as number) - (a as number))
     .slice(0, 3)
     .map(([type]) => type)
     .join(', ')}
   - Diversified consultation offerings show comprehensive student support

### Strategic Recommendations

1. **Immediate Actions**
   ${metrics.noShowRate > 15 ? '- Implement automated reminder system to reduce no-shows\n' : ''}
   ${metrics.highEngagementStudents < metrics.totalStudents * 0.2 ? '- Launch targeted outreach for disengaged students\n' : ''}
   - Maintain current high-performing practices in ${metrics.topProgram}

2. **Medium-term Initiatives**
   - Develop peer mentoring program leveraging your ${metrics.highEngagementStudents} highly engaged students
   - Create group sessions for popular consultation topics to improve efficiency
   - Establish monthly check-ins for at-risk students

3. **Long-term Strategy**
   - Build predictive model to identify students likely to disengage
   - Implement comprehensive tracking of post-graduation outcomes
   - Develop program-specific career pathways based on consultation data

### Success Metrics to Track
- Reduce no-show rate to below 10% within 3 months
- Increase average consultations per student to ${(metrics.avgConsultationsPerStudent * 1.2).toFixed(1)}
- Achieve 90%+ attendance rate consistently
- Expand high engagement cohort to 30% of student body

Generated based on ${metrics.totalStudents} students and ${metrics.totalConsultations} consultations during ${dateRange.label}.`;

    return insights;
  }
} 