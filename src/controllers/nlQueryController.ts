import { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import database from '../database/connection';
import { logAuditEvent } from '../middleware/security';

// Initialize Claude
const apiKey = process.env.VITE_CLAUDE_API_KEY || process.env.CLAUDE_API_KEY || '';
console.log('Claude API Key configured:', apiKey ? `Yes (${apiKey.substring(0, 10)}...)` : 'No');

const anthropic = new Anthropic({
  apiKey: apiKey,
});

// Database schema context for Claude
const SCHEMA_CONTEXT = `
You are a SQL query generator for a career services CRM database. Generate ONLY valid SQLite queries.

DATABASE SCHEMA:
- students table:
  * id, first_name, last_name, email, phone
  * year_of_study (1st year, 2nd year, 3rd year, 4th year, Graduate, Alumni)
  * program_type (Bachelor's, Master's)
  * major (for Bachelor's: Business Administration, Psychology, etc. For Master's: MBA, Masters in Tourism Management, MS in Industrial Organizational Psychology)
  * specific_program (legacy field, use major instead)
  * status (Active, Inactive, Graduated)
  * job_search_status (Not Started, Preparing, Actively Searching, Searching for Internship, Currently Interning, Interviewing, Offer Received, Employed, Not Seeking)
  * created_at, updated_at, date_added
  * career_interests (JSON array), target_industries (JSON array), target_locations (JSON array)

- consultations table:
  * id, student_id, consultation_date, type, duration, status (attended, no-show, scheduled, cancelled)
  * notes, topic, location, follow_up_required

- notes table:
  * id, student_id, content, type, date_created, author

IMPORTANT RULES:
1. Return ONLY the SQL query, no explanations
2. Use proper date functions for date comparisons
3. For "today" use date('now')
4. For date ranges use date() function
5. Always use LOWER() for case-insensitive text comparisons
6. For counting distinct students, use COUNT(DISTINCT students.id)
7. Join tables properly when needed
8. Use proper GROUP BY when using aggregate functions
9. For "this week" queries: Monday is start of week, use date('now', 'weekday 0', '-6 days') for Monday and date('now', 'weekday 0') for Sunday
10. Always include scheduled, upcoming consultations when counting meetings/consultations
`;

const QUERY_EXAMPLES = `
Examples of natural language to SQL:
- "how many students are looking for internships" -> 
  SELECT COUNT(*) as count FROM students WHERE job_search_status = 'Searching for Internship'

- "students in MBA program" or "MBA students" ->
  SELECT * FROM students WHERE program_type = 'Master''s' AND major = 'MBA'

- "how many master's students" ->
  SELECT COUNT(*) as count FROM students WHERE program_type = 'Master''s'

- "how many MBA students" ->
  SELECT COUNT(*) as count FROM students WHERE program_type = 'Master''s' AND major = 'MBA'

- "how many consultations this month" ->
  SELECT COUNT(*) as count FROM consultations 
  WHERE date(consultation_date) >= date('now', 'start of month')
  
- "how many meetings this week" ->
  SELECT COUNT(*) as count FROM consultations 
  WHERE date(consultation_date) >= date('now', 'weekday 0', '-6 days') 
  AND date(consultation_date) <= date('now', 'weekday 0')

- "students who got employed this year" ->
  SELECT * FROM students 
  WHERE job_search_status = 'Employed' 
  AND date(updated_at) >= date('now', 'start of year')

- "show me all master's students actively searching for jobs" ->
  SELECT * FROM students 
  WHERE program_type = 'Master''s' 
  AND job_search_status IN ('Actively Searching', 'Interviewing')
`;

export const processNaturalLanguageQuery = async (req: Request & { user?: any }, res: Response): Promise<void> => {
  try {
    const { question } = req.body;
    
    if (!question || typeof question !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Question is required'
      });
      return;
    }

    // Use Claude to convert natural language to SQL
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307', // Fast and cost-effective for this use case
      max_tokens: 500,
      temperature: 0, // We want deterministic SQL generation
      system: SCHEMA_CONTEXT + '\n\n' + QUERY_EXAMPLES,
      messages: [
        {
          role: 'user',
          content: `Convert this question to a SQL query: "${question}"`
        }
      ]
    });

    const sqlQuery = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
    
    if (!sqlQuery) {
      res.status(400).json({
        success: false,
        error: 'Could not generate a valid query'
      });
      return;
    }

    // Validate that it's a SELECT query (no modifications allowed)
    if (!sqlQuery.toUpperCase().startsWith('SELECT')) {
      res.status(400).json({
        success: false,
        error: 'Only SELECT queries are allowed'
      });
      return;
    }

    // Additional safety checks
    const dangerousKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE', 'EXEC', 'EXECUTE'];
    const upperQuery = sqlQuery.toUpperCase();
    for (const keyword of dangerousKeywords) {
      if (upperQuery.includes(keyword)) {
        res.status(400).json({
          success: false,
          error: 'Query contains forbidden keywords'
        });
        return;
      }
    }

    // Execute the query
    try {
      const result = await database.query(sqlQuery);
      
      // Format the response based on the result
      let formattedResponse = '';
      let resultData = result.rows;
      
      // Check if it's a count query
      if (resultData.length === 1 && (resultData[0].count !== undefined || resultData[0].COUNT !== undefined)) {
        const count = resultData[0].count || resultData[0].COUNT || resultData[0]['COUNT(*)'] || 0;
        formattedResponse = `The answer is: **${count}**`;
      } 
      // Check if it's a list of students
      else if (resultData.length > 0 && resultData[0].first_name) {
        formattedResponse = `Found ${resultData.length} student${resultData.length !== 1 ? 's' : ''}:\n\n`;
        resultData.forEach((student, index) => {
          formattedResponse += `${index + 1}. **${student.first_name} ${student.last_name}**`;
          if (student.email) formattedResponse += ` (${student.email})`;
          
          // Show program information
          if (student.program_type === 'Master\'s' && student.major) {
            formattedResponse += `\n   Program: ${student.major}`;
          } else if (student.program_type && student.major) {
            formattedResponse += `\n   Program: ${student.program_type} - ${student.major}`;
          } else if (student.specific_program) {
            formattedResponse += `\n   Program: ${student.specific_program}`;
          }
          
          if (student.job_search_status) formattedResponse += `\n   Status: ${student.job_search_status}`;
          formattedResponse += '\n\n';
        });
      }
      // Generic result formatting
      else if (resultData.length > 0) {
        formattedResponse = `Found ${resultData.length} result${resultData.length !== 1 ? 's' : ''}:\n\n`;
        resultData.forEach((item, index) => {
          formattedResponse += `${index + 1}. ${JSON.stringify(item, null, 2)}\n`;
        });
      } else {
        formattedResponse = 'No results found for your query.';
      }

      // Log the query for auditing
      logAuditEvent(req, 'NL_QUERY_EXECUTED', 'ai', true, { 
        question, 
        query: sqlQuery,
        resultCount: resultData.length 
      });

      res.json({
        success: true,
        results: resultData,
        count: resultData.length,
        query: sqlQuery, // Include for transparency
        formatted: formattedResponse
      });

    } catch (dbError: any) {
      console.error('Database query error:', dbError);
      res.status(400).json({
        success: false,
        error: 'Query execution failed. Please try rephrasing your question.',
        details: dbError.message
      });
    }

  } catch (error: any) {
    console.error('Natural language query error:', error);
    console.error('Error details:', {
      message: error.message,
      type: error.constructor.name,
      stack: error.stack
    });
    
    // Check if it's an API key issue
    if (error.message?.includes('API key') || error.message?.includes('authentication')) {
      res.status(500).json({
        success: false,
        error: 'Claude API configuration error',
        details: 'Please check that the CLAUDE_API_KEY is properly configured'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to process your question',
        details: error.message
      });
    }
  }
};

export const getSuggestions = async (req: Request, res: Response): Promise<void> => {
  const suggestions = [
    "How many students are currently looking for internships?",
    "Show me all Master's students",
    "How many consultations happened this month?",
    "Which students got employed recently?",
    "Students in MBA program",
    "How many students are actively searching for jobs?",
    "Show me students who had consultations this week",
    "How many no-shows this month?",
    "Students graduating this year",
    "How many alumni do we have?"
  ];

  res.json({
    success: true,
    suggestions
  });
};