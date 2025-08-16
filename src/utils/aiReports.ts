import { Student, Consultation } from '../types/student';

// AI Report Generation using Claude API
export interface AIReportRequest {
  monthlyData: {
    totalStudents: number;
    consultations: number;
    newStudents: number;
    graduatedStudents: number;
  };
  students: Student[];
  consultations: Consultation[];
  trends: {
    consultationGrowth: number;
    studentGrowth: number;
    averageSessionsPerStudent: number;
  };
}

export interface AIReportResponse {
  summary: string;
  insights: string[];
  recommendations: string[];
  trends: {
    label: string;
    value: string;
    trend: 'up' | 'down' | 'stable';
  }[];
  keyMetrics: {
    name: string;
    value: string;
    change: string;
  }[];
}

// Add your Claude API key here or use environment variables
const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY || 'your-claude-api-key-here';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

export const generateAIReport = async (data: AIReportRequest): Promise<string> => {
  // Check if API key is configured
  if (!CLAUDE_API_KEY || CLAUDE_API_KEY === 'your-claude-api-key-here') {
    console.warn('Claude API key not configured, using mock response');
    return generateMockReport(data);
  }

  const prompt = `
    Generate a comprehensive monthly CRM report based on the following data:
    
    Monthly Statistics:
    - Students seen: ${data.monthlyData.totalStudents}
    - Total consultations: ${data.monthlyData.consultations}
    - Attendance rate: ${data.trends.averageSessionsPerStudent.toFixed(1)} sessions per student
    
    Top Programs: ${data.students.map((student) => student.programType).join(', ')}
    
    Consultation Types: ${Object.entries(data.consultations.reduce((acc, consultation) => {
      acc[consultation.type] = (acc[consultation.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)).map(([type, count]) => `${type}: ${count}`).join(', ')}
    
    Please provide:
    1. Executive Summary
    2. Key Insights and Trends
    3. Recommendations for improvement
    4. Areas of concern
    5. Success metrics
    
    Format the response in markdown with clear sections. Be specific and actionable in your recommendations.
  `;

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Claude API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const result = await response.json();
    
    if (result.content && result.content[0] && result.content[0].text) {
      return result.content[0].text;
    } else {
      throw new Error('Invalid response format from Claude API');
    }
  } catch (error) {
    console.error('Failed to generate AI report:', error);
    
    // Fallback to mock report if API fails
    console.warn('Falling back to mock report due to API error');
    return generateMockReport(data);
  }
};

// Mock report generator (fallback)
const generateMockReport = (data: AIReportRequest): string => {
  return `# Monthly CRM Report - ${new Date().toLocaleDateString()}

## Executive Summary
This month saw ${data.monthlyData.totalStudents} active students with ${data.monthlyData.consultations} total consultations. The most popular consultation type was "${data.consultations.reduce((acc, consultation) => {
  acc[consultation.type] = (acc[consultation.type] || 0) + 1;
  return acc;
}, {} as Record<string, number>)[Object.entries(acc).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None']}". ${data.monthlyData.newStudents} new students joined the program.

## Key Insights and Trends
- **Student Growth**: ${data.trends.studentGrowth > 0 ? '+' : ''}${data.trends.studentGrowth.toFixed(1)}%
- **Consultation Growth**: ${data.trends.consultationGrowth > 0 ? '+' : ''}${data.trends.consultationGrowth.toFixed(1)}%
- **Average Sessions/Student**: ${data.trends.averageSessionsPerStudent.toFixed(1)}

## Recommendations
1. **Expand Popular Services**: Consider increasing capacity for high-demand consultation types
2. **Follow-up Strategy**: Implement systematic follow-up for missed appointments
3. **Program-Specific Support**: Develop targeted resources for top programs

## Areas of Concern
- Monitor no-show rates and implement reminder systems
- Ensure balanced support across all academic programs
- Track long-term student outcomes

## Success Metrics
- ✅ Strong attendance rate (${data.trends.averageSessionsPerStudent.toFixed(1)} sessions per student)
- ✅ Diverse consultation types offered
- ✅ Active student engagement across programs

*Report generated with mock AI assistance*
*Note: Configure Claude API key for real AI-generated reports*`;
};

// Mock AI report generation (replace with actual API call)
export const generateMonthlyReport = async (data: AIReportRequest): Promise<AIReportResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Mock response based on data
  const consultationTypes = data.consultations.reduce((acc, consultation) => {
    acc[consultation.type] = (acc[consultation.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostPopularConsultationType = Object.entries(consultationTypes)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

  return {
    summary: `This month saw ${data.monthlyData.totalStudents} active students with ${data.monthlyData.consultations} total consultations. The most popular consultation type was "${mostPopularConsultationType}". ${data.monthlyData.newStudents} new students joined the program.`,
    insights: [
      `Student engagement is ${data.trends.consultationGrowth > 0 ? 'increasing' : 'decreasing'} with an average of ${data.trends.averageSessionsPerStudent.toFixed(1)} sessions per student.`,
      `The graduation rate shows ${data.monthlyData.graduatedStudents > 0 ? 'positive progress' : 'steady progression'} with ${data.monthlyData.graduatedStudents} students completing their programs.`,
      `${mostPopularConsultationType} consultations are in highest demand, suggesting strong interest in this area.`
    ],
    recommendations: [
      data.trends.consultationGrowth < 0 
        ? 'Consider implementing more targeted outreach to increase consultation bookings.'
        : 'Maintain current engagement strategies as consultation rates are growing.',
      `Focus on expanding ${mostPopularConsultationType} offerings given their popularity.`,
      'Continue monitoring graduation trends to ensure student success.'
    ],
    trends: [
      {
        label: 'Student Growth',
        value: `${data.trends.studentGrowth > 0 ? '+' : ''}${data.trends.studentGrowth.toFixed(1)}%`,
        trend: data.trends.studentGrowth > 0 ? 'up' : data.trends.studentGrowth < 0 ? 'down' : 'stable'
      },
      {
        label: 'Consultation Growth',
        value: `${data.trends.consultationGrowth > 0 ? '+' : ''}${data.trends.consultationGrowth.toFixed(1)}%`,
        trend: data.trends.consultationGrowth > 0 ? 'up' : data.trends.consultationGrowth < 0 ? 'down' : 'stable'
      },
      {
        label: 'Avg Sessions/Student',
        value: data.trends.averageSessionsPerStudent.toFixed(1),
        trend: data.trends.averageSessionsPerStudent > 2 ? 'up' : 'stable'
      }
    ],
    keyMetrics: [
      {
        name: 'Total Students',
        value: data.monthlyData.totalStudents.toString(),
        change: data.monthlyData.newStudents > 0 ? `+${data.monthlyData.newStudents} new` : 'No change'
      },
      {
        name: 'Total Consultations',
        value: data.monthlyData.consultations.toString(),
        change: data.trends.consultationGrowth > 0 ? `+${data.trends.consultationGrowth.toFixed(1)}%` : 'Stable'
      },
      {
        name: 'Graduates',
        value: data.monthlyData.graduatedStudents.toString(),
        change: data.monthlyData.graduatedStudents > 0 ? 'Progressing' : 'In progress'
      }
    ]
  };
};

export const generateStudentReport = async (student: Student): Promise<string> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const consultationCount = student.consultations.length;
  const notesCount = student.notes.length;
  const attendanceRate = consultationCount > 0 
    ? (student.consultations.filter(c => c.attended).length / consultationCount * 100).toFixed(1)
    : '0';

  return `
**Student Progress Report: ${student.firstName} ${student.lastName}**

**Academic Status:** ${student.yearOfStudy} ${student.programType} in ${student.specificProgram}

**Engagement Summary:**
- Total Consultations: ${consultationCount}
- Notes/Updates: ${notesCount}
- Attendance Rate: ${attendanceRate}%
- Current Status: ${student.status}

**Recent Activity:**
${student.consultations.length > 0 
  ? `Last consultation: ${new Date(student.consultations[0].date).toLocaleDateString()}`
  : 'No consultations recorded yet'
}

**Recommendations:**
${consultationCount < 2 
  ? '• Consider scheduling regular check-ins to support academic progress'
  : '• Continue maintaining regular consultation schedule'
}
${parseInt(attendanceRate) < 80 
  ? '• Focus on improving attendance consistency'
  : '• Excellent attendance - keep up the great work!'
}
  `.trim();
};