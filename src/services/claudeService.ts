import axios from 'axios';
import { aiCache } from '../utils/cache';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const API_KEY = process.env.CLAUDE_API_KEY;

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

export class ClaudeService {
  private static headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY || '',
    'anthropic-version': '2023-06-01'
  };

  static async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    if (!API_KEY || API_KEY === 'your-claude-api-key-here') {
      console.warn('Claude API key not configured, returning mock response');
      return this.generateMockResponse(prompt, systemPrompt);
    }

    // Use cache for AI responses
    return aiCache.getResponse(prompt, async () => {
      try {
        const messages: ClaudeMessage[] = [
          {
            role: 'user',
            content: prompt
          }
        ];

        const response = await axios.post(
          CLAUDE_API_URL,
          {
            model: 'claude-3-sonnet-20240229',
            max_tokens: 2000,
            messages,
            system: systemPrompt || 'You are a helpful career services assistant for a university. Provide professional, supportive advice to help students succeed in their career development.'
          },
          {
            headers: this.headers
          }
        );

        const data = response.data as ClaudeResponse;
        return data.content[0].text;
      } catch (error) {
        console.error('Claude API error:', error);
        // Fallback to mock response on error
        return this.generateMockResponse(prompt, systemPrompt);
      }
    });
  }

  private static generateMockResponse(prompt: string, systemPrompt?: string): string {
    // Generate a context-aware mock response based on the prompt
    if (prompt.includes('dashboard') || prompt.includes('monthly')) {
      return this.generateMockDashboardReport(prompt);
    }
    if (prompt.includes('student') && prompt.includes('report')) {
      return this.generateMockStudentReport();
    }
    if (prompt.includes('interview')) {
      return this.generateMockInterviewFeedback();
    }
    return 'AI service is currently unavailable. Please check your Claude API configuration.';
  }

  private static generateMockDashboardReport(prompt: string): string {
    // Extract some numbers from the prompt if available
    const totalStudents = prompt.match(/Total Students: (\d+)/)?.[1] || '0';
    const consultations = prompt.match(/Total Consultations: (\d+)/)?.[1] || '0';
    
    return `# Monthly Career Services Report

## Executive Summary

This month shows strong engagement across the career services program with ${totalStudents} active students and ${consultations} total consultations. The consistent participation demonstrates the value students place on career guidance and support.

## Key Insights and Trends

• **Growing Engagement**: Student consultation frequency has increased, indicating growing awareness of career services
• **Diverse Needs**: Multiple consultation types show students seek varied support - from resume reviews to career planning
• **Consistent Participation**: Regular attendees show the importance of ongoing career development support
• **Program Balance**: Good distribution across different academic programs

## Success Metrics

✅ Strong student engagement with regular consultations
✅ Multiple touchpoints per student showing sustained relationships
✅ Variety of consultation types meeting diverse needs
✅ Active participation across all year levels

## Areas of Concern

⚠️ Some students may need additional follow-up to maintain engagement
⚠️ Consider capacity planning for peak consultation periods
⚠️ Monitor for students who haven't engaged recently

## Actionable Recommendations

1. **Implement Proactive Outreach**: Schedule check-ins with students who haven't had recent consultations
2. **Group Sessions**: Consider group workshops for common topics to serve more students efficiently
3. **Peer Mentoring**: Connect experienced students with newcomers for additional support
4. **Follow-up System**: Strengthen follow-up protocols to ensure continuity of support
5. **Resource Development**: Create self-service resources for frequently asked questions

## Program-Specific Insights

Each academic program shows unique career development needs. Consider tailored approaches for different fields of study, recognizing that engineering students may need different support than liberal arts students.

## Looking Ahead

Next month, focus on maintaining momentum while preparing for any seasonal changes in student availability. Consider planning special workshops or events to address common career concerns.

*Note: This is a mock report. Configure Claude API for AI-generated insights.*`;
  }

  private static generateMockStudentReport(): string {
    return `# Student Career Development Report

## Profile Summary
The student shows active engagement with career services, demonstrating commitment to professional development.

## Strengths
- Regular attendance at consultations
- Proactive approach to career planning
- Good follow-through on recommendations

## Areas for Development
- Continue building professional network
- Enhance interview preparation
- Develop industry-specific skills

## Recommendations
1. Schedule mock interviews for practice
2. Attend upcoming career fairs
3. Update resume with recent experiences
4. Connect with alumni in target field

*Note: This is a mock report. Configure Claude API for personalized insights.*`;
  }

  private static generateMockInterviewFeedback(): string {
    return `# Mock Interview Feedback

## Overall Performance
Good foundation with room for improvement in specific areas.

## Strengths Demonstrated
- Clear communication style
- Professional demeanor
- Good eye contact

## Areas for Improvement
- Provide more specific examples
- Structure responses using STAR method
- Research company more thoroughly

## Next Steps
1. Practice behavioral questions
2. Prepare 5-7 strong examples
3. Research target companies
4. Schedule follow-up session

*Note: This is a mock feedback. Configure Claude API for detailed analysis.*`;
  }

  static async generateStudentReport(studentData: any, notes: any[], applications: any[]): Promise<string> {
    const systemPrompt = `You are a career counselor creating a data-driven report for a university student.
    
CRITICAL RULES:
1. ONLY use information explicitly provided in the data
2. Do not invent details about the student's background, skills, or experiences
3. Base all assessments on the actual notes and application data provided
4. If data is missing, state "No data available" rather than making assumptions
5. Keep recommendations generic and based solely on the patterns in the data`;

    // Calculate application statistics
    const applicationStats = {
      total: applications.length,
      byStatus: applications.reduce((acc: any, app: any) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {}),
      companies: [...new Set(applications.map(app => app.company_name))],
      positions: [...new Set(applications.map(app => app.position_title))]
    };

    // Analyze note patterns
    const noteTypes = notes.reduce((acc: any, note: any) => {
      acc[note.type] = (acc[note.type] || 0) + 1;
      return acc;
    }, {});

    const prompt = `Generate a career development report based ONLY on this data:

STUDENT INFORMATION:
- Name: ${studentData.name || 'Not provided'}
- Program: ${studentData.program || 'Not specified'}
- Year: ${studentData.year || 'Not specified'}
- Email: ${studentData.email || 'Not provided'}

CONSULTATION NOTES SUMMARY:
- Total Notes: ${notes.length}
- Note Types: ${Object.entries(noteTypes).map(([type, count]) => `${type} (${count})`).join(', ') || 'None'}

RECENT NOTES (showing first 5):
${notes.length > 0 
  ? notes.slice(0, 5).map((note, i) => `${i + 1}. [${note.type}] ${note.content.substring(0, 100)}...`).join('\n')
  : 'No notes recorded'}

APPLICATION ACTIVITY:
- Total Applications: ${applications.length}
- Companies Applied To: ${applicationStats.companies.length}
- Unique Positions: ${applicationStats.positions.length}

APPLICATION STATUS BREAKDOWN:
${Object.entries(applicationStats.byStatus).length > 0
  ? Object.entries(applicationStats.byStatus).map(([status, count]) => `- ${status}: ${count}`).join('\n')
  : '- No applications recorded'}

RECENT APPLICATIONS (showing first 5):
${applications.length > 0
  ? applications.slice(0, 5).map((app, i) => `${i + 1}. ${app.company_name} - ${app.position_title} (Status: ${app.status})`).join('\n')
  : 'No applications recorded'}

INSTRUCTIONS:
1. Create a report using ONLY the information above
2. Do not assume or invent any student qualities not evident in the data
3. Base strengths/weaknesses only on the consultation notes provided
4. Make recommendations based on the gaps or patterns in the actual data
5. If insufficient data exists for a section, explicitly state this

Report sections needed:
1. Profile Overview (using only provided info)
2. Engagement Summary (based on note/application counts)
3. Application Activity Analysis (using the statistics above)
4. Observed Patterns (from the actual data only)
5. Data-Based Recommendations (addressing gaps in the data)`;

    return this.generateText(prompt, systemPrompt);
  }

  static async generateInterviewFeedback(interviewData: any): Promise<string> {
    const systemPrompt = `You are an experienced interview coach providing constructive feedback on mock interviews. 
    Focus on both strengths and areas for improvement, and provide specific, actionable advice.`;

    const prompt = `Analyze this mock interview and provide detailed feedback:

Interview Type: ${interviewData.interview_type}
Duration: ${interviewData.duration_minutes} minutes
Overall Rating: ${interviewData.overall_rating}/5
Company: ${interviewData.company_name || 'General Practice'}
Position: ${interviewData.position_title || 'Not specified'}

Interviewer Notes:
Strengths: ${interviewData.strengths || 'Not provided'}
Areas for Improvement: ${interviewData.areas_for_improvement || 'Not provided'}

Questions Asked: ${interviewData.questions_asked || 'Not recorded'}

Please provide comprehensive feedback including:
1. Analysis of performance
2. Specific improvements needed
3. Preparation tips for next interview
4. Resources to strengthen weak areas`;

    return this.generateText(prompt, systemPrompt);
  }

  static async generateCareerRecommendations(studentProfile: any, careerData: any): Promise<string> {
    const systemPrompt = `You are a career advisor providing personalized career recommendations. 
    Base your advice on the student's profile, interests, and activity patterns. 
    Be specific and actionable in your recommendations.`;

    const prompt = `Generate personalized career recommendations for:

Student Profile:
- Program: ${studentProfile.program}
- Year: ${studentProfile.year}
- Interests: ${studentProfile.career_interests || 'Not specified'}

Career Activity:
- Applications submitted: ${careerData.applicationCount}
- Companies targeted: ${careerData.topCompanies?.join(', ') || 'Various'}
- Interview success rate: ${careerData.interviewRate || 'N/A'}
- Networking connections: ${careerData.connectionCount || 0}

Please provide:
1. 3-5 specific job opportunities to pursue
2. Skills to develop based on their field
3. Networking strategies
4. Timeline for career milestones
5. Resources for professional development`;

    return this.generateText(prompt, systemPrompt);
  }

  static async generateResumeReview(resumeText: string, targetRole?: string): Promise<string> {
    const systemPrompt = `You are a professional resume reviewer with expertise in university recruiting. 
    Provide specific, constructive feedback to help students create compelling resumes.`;

    const prompt = `Review this resume and provide detailed feedback:

Target Role: ${targetRole || 'Entry-level position'}

Resume Content:
${resumeText.substring(0, 2000)}...

Please provide:
1. Overall impression and score (1-10)
2. Specific strengths of the resume
3. Areas that need improvement
4. Formatting suggestions
5. Content recommendations
6. Keywords to add for ATS optimization`;

    return this.generateText(prompt, systemPrompt);
  }

  static async generateNetworkingTips(connectionData: any[]): Promise<string> {
    const systemPrompt = `You are a networking expert helping university students build professional relationships. 
    Provide practical, actionable advice for networking success.`;

    const companies = [...new Set(connectionData.map(c => c.company_name))];
    const connectionTypes = [...new Set(connectionData.map(c => c.connection_type))];

    const prompt = `Generate networking advice based on this student's connections:

Current Network:
- Total connections: ${connectionData.length}
- Companies: ${companies.slice(0, 5).join(', ')}
- Connection types: ${connectionTypes.join(', ')}
- Recent interactions: ${connectionData.filter(c => c.follow_up_date).length} pending follow-ups

Please provide:
1. Analysis of current network strength
2. Strategies to expand their network
3. Follow-up email templates
4. LinkedIn optimization tips
5. Networking event preparation checklist`;

    return this.generateText(prompt, systemPrompt);
  }

  static async generateDashboardReport(data: any): Promise<string> {
    const systemPrompt = `You are an expert career services data analyst creating a comprehensive monthly report.
    
CRITICAL INSTRUCTIONS:
1. ONLY use the exact data provided - do not invent, estimate, or hallucinate any information
2. If data is missing or zero, explicitly state "No data available" or use the exact zero value
3. All statistics, percentages, and numbers must come directly from the provided data
4. Do not make assumptions about data that isn't explicitly provided
5. Do not suggest specific programs, companies, or initiatives unless they appear in the data
6. Focus on analyzing patterns in the actual data provided
7. If you need to make a recommendation, base it solely on the patterns you observe in the provided data
8. Format in clean markdown with headers and bullet points`;

    // Calculate consultation types distribution
    const consultationTypes = data.consultations?.reduce((acc: any, c: any) => {
      acc[c.type] = (acc[c.type] || 0) + 1;
      return acc;
    }, {}) || {};

    // Calculate program distribution  
    const programTypes = data.students?.reduce((acc: any, s: any) => {
      acc[s.programType] = (acc[s.programType] || 0) + 1;
      return acc;
    }, {}) || {};

    // Calculate additional metrics for deeper analysis
    const yearDistribution = data.students?.reduce((acc: any, s: any) => {
      acc[s.yearOfStudy] = (acc[s.yearOfStudy] || 0) + 1;
      return acc;
    }, {}) || {};

    const statusDistribution = data.students?.reduce((acc: any, s: any) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {}) || {};

    // Calculate consultation patterns
    const attendanceRate = data.consultations?.length > 0
      ? ((data.consultations.filter((c: any) => c.attended).length / data.consultations.length) * 100).toFixed(1)
      : 0;

    const followUpRequired = data.consultations?.filter((c: any) => c.followUpRequired).length || 0;

    // Get unique students who had consultations
    const studentsWithConsultations = new Set(data.consultations?.map((c: any) => c.studentId) || []).size;

    const prompt = `Generate a comprehensive monthly CRM report based ONLY on the following data:

MONTHLY STATISTICS:
- Total Students: ${data.monthlyData.totalStudents}
- Active Students: ${data.monthlyData.activeStudents || data.monthlyData.totalStudents}
- New Students This Month: ${data.monthlyData.newStudents}
- Total Consultations: ${data.monthlyData.consultations}
- Graduated Students: ${data.monthlyData.graduatedStudents}

DETAILED METRICS:
- Students with Consultations: ${studentsWithConsultations}
- Consultation Attendance Rate: ${attendanceRate}%
- Consultations Requiring Follow-up: ${followUpRequired}
- Average Consultations per Active Student: ${studentsWithConsultations > 0 ? (data.consultations.length / studentsWithConsultations).toFixed(1) : 0}

TRENDS (Month-over-Month):
- Consultation Growth: ${data.trends.consultationGrowth || 0}%
- Student Growth: ${data.trends.studentGrowth || 0}%
- Average Sessions per Student: ${data.trends.averageSessionsPerStudent || 0}
- Pending Follow-ups: ${data.trends.pendingFollowUps || 0}

CONSULTATION TYPES BREAKDOWN:
${Object.entries(consultationTypes).length > 0 
  ? Object.entries(consultationTypes).map(([type, count]) => `- ${type}: ${count} (${((count as number / data.consultations.length) * 100).toFixed(1)}%)`).join('\n')
  : '- No consultation data available'}

PROGRAM DISTRIBUTION:
${Object.entries(programTypes).length > 0
  ? Object.entries(programTypes).map(([program, count]) => `- ${program}: ${count} students (${((count as number / data.students.length) * 100).toFixed(1)}%)`).join('\n')
  : '- No program data available'}

YEAR OF STUDY DISTRIBUTION:
${Object.entries(yearDistribution).length > 0
  ? Object.entries(yearDistribution).map(([year, count]) => `- ${year}: ${count} students`).join('\n')
  : '- No year data available'}

STUDENT STATUS BREAKDOWN:
${Object.entries(statusDistribution).length > 0
  ? Object.entries(statusDistribution).map(([status, count]) => `- ${status}: ${count} students`).join('\n')
  : '- No status data available'}

TOP 5 MOST ENGAGED STUDENTS (by consultation count):
${data.students
  .sort((a: any, b: any) => (b.consultations?.length || 0) - (a.consultations?.length || 0))
  .slice(0, 5)
  .map((s: any, i: number) => `${i + 1}. ${s.firstName} ${s.lastName} - ${s.consultations?.length || 0} consultations`)
  .join('\n') || 'No student consultation data available'}

INSTRUCTIONS FOR REPORT GENERATION:
1. Base ALL insights on the exact numbers provided above
2. Do not invent any data points or percentages not shown
3. If a metric is 0 or missing, acknowledge it explicitly
4. Focus recommendations on improving the specific metrics shown
5. Do not mention specific companies, job titles, or programs unless they appear in the data
6. Calculate any additional insights only from the provided numbers
7. If data seems incomplete, note it rather than making assumptions

Please provide:
1. Executive Summary (based on the exact statistics above)
2. Data-Driven Insights (only from patterns in the provided numbers)
3. Success Metrics (what the numbers show is working)
4. Areas Needing Attention (based on concerning numbers or gaps)
5. Evidence-Based Recommendations (tied to specific metrics)
6. Program/Year Analysis (based on the distributions provided)
7. Next Month Focus (based on current trends and pending items)

Remember: Every statement must be traceable to a specific data point provided above.`;

    return this.generateText(prompt, systemPrompt);
  }
}