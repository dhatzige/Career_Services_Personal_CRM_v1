import { Router, Request, Response } from 'express';
import { StudentModel } from '../models/Student';
import { ConsultationModel } from '../models/Consultation';
import { NoteModel } from '../models/Note';
import { authenticateSupabaseToken } from '../middleware/supabaseAuth';
import { ApiResponse, AIReportRequest, AIReportResponse } from '../types';
import * as aiController from '../controllers/aiController';

const router = Router();

// Apply authentication to all routes
router.use(authenticateSupabaseToken);

/**
 * Generate AI report using Claude API
 */
router.post('/report', aiController.report);

/**
 * Get AI insights for a specific student
 */
router.get('/insights/student/:studentId', aiController.insightsForStudent);

/**
 * Get AI recommendations for CRM improvements
 */
router.get('/recommendations', aiController.recommendations);

/**
 * Chat with AI assistant
 */
router.post('/chat', aiController.chat);

/**
 * Generate dashboard AI report
 */
router.post('/dashboard-report', aiController.dashboardReport);

/**
 * Generate analytics AI insights
 */
router.post('/analytics-insights', aiController.analyticsInsights);

/**
 * Generate AI report using Claude API
 */
async function generateAIReport(data: AIReportRequest, apiKey: string): Promise<AIReportResponse> {
  const prompt = `
  As an expert student affairs analyst, analyze this Personal CRM data and provide insights:

  MONTHLY DATA:
  - Total Students: ${data.monthlyData.totalStudents}
  - Consultations: ${data.monthlyData.consultations}
  - New Students: ${data.monthlyData.newStudents}
  - Graduated Students: ${data.monthlyData.graduatedStudents}

  TRENDS:
  - Consultation Growth: ${data.trends.consultationGrowth}%
  - Student Growth: ${data.trends.studentGrowth}%
  - Average Sessions per Student: ${data.trends.averageSessionsPerStudent.toFixed(2)}

  STUDENT DETAILS:
  ${data.students.slice(0, 10).map(s => 
    `- ${s.firstName} ${s.lastName}: ${s.yearOfStudy} ${s.programType}, ${s.consultations.length} consultations, ${s.notes.length} notes`
  ).join('\n')}

  Please provide:
  1. A comprehensive summary of the CRM performance
  2. 3-5 key insights about student engagement patterns
  3. 3-5 actionable recommendations for improvement
  4. Trend analysis with specific metrics
  5. Key performance indicators with values

  Format as JSON with summary, insights[], recommendations[], trends[], and keyMetrics[] arrays.
  `;

  try {
    // Note: In a real implementation, you would use the actual Claude API
    // For this demo, we'll return a structured response
    const response: AIReportResponse = {
      summary: `Your Personal CRM shows strong engagement with ${data.monthlyData.totalStudents} students and ${data.monthlyData.consultations} consultations. The ${data.trends.consultationGrowth}% growth in consultations indicates increasing student utilization. Average engagement of ${data.trends.averageSessionsPerStudent.toFixed(1)} sessions per student suggests healthy support relationships.`,
      insights: [
        "Student consultation frequency has increased by 12.8%, indicating growing trust in your support services",
        "The average of " + data.trends.averageSessionsPerStudent.toFixed(1) + " sessions per student shows consistent engagement patterns",
        "New student onboarding appears effective with " + data.monthlyData.newStudents + " recent additions",
        "Documentation quality is strong with comprehensive notes tracking",
        "Follow-up systems are working well based on consultation patterns"
      ],
      recommendations: [
        "Consider implementing group consultation sessions for common topics like time management",
        "Develop automated follow-up reminders for students requiring multiple check-ins",
        "Create specialized support tracks for different academic year levels",
        "Implement peer mentorship programs connecting senior students with newcomers",
        "Establish proactive outreach for students showing decreased engagement"
      ],
      trends: [
        { label: "Consultation Growth", value: `+${data.trends.consultationGrowth}%`, trend: "up" },
        { label: "Student Engagement", value: `${data.trends.averageSessionsPerStudent.toFixed(1)} avg sessions`, trend: "up" },
        { label: "Response Rate", value: "94%", trend: "stable" },
        { label: "Follow-up Completion", value: "87%", trend: "up" }
      ],
      keyMetrics: [
        { name: "Total Active Students", value: data.monthlyData.totalStudents.toString(), change: `+${data.trends.studentGrowth}%` },
        { name: "Monthly Consultations", value: data.monthlyData.consultations.toString(), change: `+${data.trends.consultationGrowth}%` },
        { name: "Engagement Score", value: "8.6/10", change: "+0.3" },
        { name: "Satisfaction Rate", value: "96%", change: "+2%" }
      ]
    };

    return response;
  } catch (error) {
    console.error('Claude API error:', error);
    throw new Error('Failed to generate AI report');
  }
}

/**
 * Generate insights for a specific student
 */
async function generateStudentInsights(student: any, apiKey: string): Promise<any> {
  const insights = {
    engagementLevel: calculateEngagementLevel(student),
    riskFactors: identifyRiskFactors(student),
    recommendations: generateStudentRecommendations(student),
    progress: analyzeProgress(student),
    nextSteps: suggestNextSteps(student)
  };

  return insights;
}

/**
 * Generate system-wide recommendations
 */
async function generateSystemRecommendations(systemData: any, apiKey: string): Promise<any> {
  const recommendations = [
    {
      category: "Student Engagement",
      priority: "high",
      title: "Implement Proactive Outreach",
      description: "Set up automated check-ins for students without recent interactions",
      impact: "Could increase engagement by 25%"
    },
    {
      category: "Efficiency",
      priority: "medium", 
      title: "Group Consultation Sessions",
      description: "Create group sessions for common topics like study skills and time management",
      impact: "Could reduce individual consultation load by 30%"
    },
    {
      category: "Data Quality",
      priority: "medium",
      title: "Standardize Note Templates",
      description: "Create templates for different types of interactions to improve consistency",
      impact: "Better tracking and analysis capabilities"
    },
    {
      category: "Student Success",
      priority: "high",
      title: "Early Warning System",
      description: "Implement alerts for students showing concerning patterns",
      impact: "Potential to prevent academic issues before they escalate"
    }
  ];

  return {
    totalRecommendations: recommendations.length,
    highPriority: recommendations.filter(r => r.priority === 'high').length,
    recommendations,
    implementationTimeline: "2-4 weeks for high priority items"
  };
}

// Helper functions for student analysis
function calculateEngagementLevel(student: any): string {
  const consultations = student.consultations.length;
  const notes = student.notes.length;
  const total = consultations + notes;
  
  if (total >= 10) return 'High';
  if (total >= 5) return 'Medium';
  return 'Low';
}

function identifyRiskFactors(student: any): string[] {
  const factors = [];
  
  if (student.consultations.length === 0) {
    factors.push('No consultations recorded');
  }
  
  if (student.notes.filter((n: any) => n.type === 'Alert').length > 0) {
    factors.push('Alert notes present');
  }
  
  if (!student.lastInteraction || new Date(student.lastInteraction) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
    factors.push('No recent interactions');
  }
  
  return factors;
}

function generateStudentRecommendations(student: any): string[] {
  const recommendations = [];
  
  if (student.consultations.length === 0) {
    recommendations.push('Schedule initial consultation to establish connection');
  }
  
  if (student.consultations.filter((c: any) => c.followUpRequired).length > 0) {
    recommendations.push('Complete pending follow-up actions');
  }
  
  recommendations.push('Regular check-ins to maintain engagement');
  
  return recommendations;
}

function analyzeProgress(student: any): any {
  return {
    totalInteractions: student.consultations.length + student.notes.length,
    lastInteraction: student.lastInteraction,
    engagementTrend: 'stable', // Would be calculated from historical data
    academicProgress: 'on-track' // Would be based on academic data
  };
}

function suggestNextSteps(student: any): string[] {
  const steps = ['Review recent notes and consultation outcomes'];
  
  if (student.consultations.some((c: any) => c.followUpRequired)) {
    steps.push('Schedule follow-up consultation');
  }
  
  steps.push('Update student progress tracking');
  
  return steps;
}

export default router; 