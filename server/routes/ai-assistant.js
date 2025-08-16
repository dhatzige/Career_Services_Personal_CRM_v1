const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Initialize Supabase with service role for admin operations
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// System prompt for the AI to understand the database schema
const SYSTEM_PROMPT = `You are a database query assistant for a Career Services CRM system. Your task is to convert natural language questions into accurate SQL queries for a PostgreSQL database.

Database Schema:
1. students table:
   - id (uuid, primary key)
   - first_name (text)
   - last_name (text)
   - email (text)
   - phone (text)
   - major (text)
   - graduation_year (integer)
   - gpa (numeric)
   - job_search_status (text: 'Not Started', 'Preparing', 'Actively Searching', 'Interviewing', 'Offer Received', 'Employed', 'Not Seeking')
   - linkedin_url (text)
   - resume_on_file (boolean)
   - resume_last_updated (date)
   - career_interests (text[])
   - target_industries (text[])
   - target_locations (text[])
   - tags (text[])
   - created_at (timestamp)
   - updated_at (timestamp)

2. notes table:
   - id (uuid, primary key)
   - student_id (uuid, foreign key to students.id)
   - content (text)
   - type (text: 'general', 'meeting', 'follow-up', 'action-item')
   - created_at (timestamp)
   - updated_at (timestamp)

3. consultations table:
   - id (uuid, primary key)
   - student_id (uuid, foreign key to students.id)
   - consultation_date (timestamp)
   - duration (integer, in minutes)
   - type (text)
   - location (text)
   - meeting_link (text)
   - notes (text)
   - status (text: 'scheduled', 'completed', 'cancelled', 'no-show')
   - attended (boolean)
   - created_at (timestamp)
   - updated_at (timestamp)

IMPORTANT RULES:
1. Always return ONLY a valid PostgreSQL query - no explanations or additional text
2. Use proper JOIN syntax when querying across tables
3. Use ILIKE for case-insensitive text searches
4. For date queries, use proper PostgreSQL date functions
5. For the current year, use EXTRACT(YEAR FROM CURRENT_DATE)
6. When counting, use COUNT(*) or COUNT(DISTINCT field) as appropriate
7. Always include proper WHERE clauses to filter data accurately
8. For array fields (career_interests, target_industries, etc.), use array operators like @> or ANY()
9. When searching for content in notes, always search in the 'content' field
10. For questions about "this year", use EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)

Examples:
Q: "How many students are actively searching for jobs?"
A: SELECT COUNT(*) FROM students WHERE job_search_status = 'Actively Searching';

Q: "Which students have notes about cover letters?"
A: SELECT DISTINCT s.* FROM students s JOIN notes n ON s.id = n.student_id WHERE n.content ILIKE '%cover letter%';

Q: "How many students this year wanted to work on their cover letter for their masters application?"
A: SELECT COUNT(DISTINCT s.id) FROM students s JOIN notes n ON s.id = n.student_id WHERE EXTRACT(YEAR FROM n.created_at) = EXTRACT(YEAR FROM CURRENT_DATE) AND n.content ILIKE '%cover letter%' AND n.content ILIKE '%master%';`;

// Query the AI to convert natural language to SQL
router.post('/query', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const claudeApiKey = process.env.VITE_CLAUDE_API_KEY;
    if (!claudeApiKey) {
      return res.status(500).json({ error: 'Claude API key not configured' });
    }

    // Call Claude API to convert question to SQL
    const claudeResponse = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        temperature: 0,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: question
          }
        ]
      },
      {
        headers: {
          'x-api-key': claudeApiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      }
    );

    const sqlQuery = claudeResponse.data.content[0].text.trim();
    console.log('Generated SQL:', sqlQuery);

    // Validate that it's a SELECT query (no modifications allowed)
    if (!sqlQuery.toUpperCase().startsWith('SELECT')) {
      return res.status(400).json({ 
        error: 'Only SELECT queries are allowed for safety' 
      });
    }

    // Execute the query directly
    try {
      const result = await executeDirectQuery(sqlQuery);
      return res.json({
        success: true,
        query: sqlQuery,
        results: result.data,
        count: result.count
      });
    } catch (directError) {
      return res.status(500).json({ 
        error: 'Query execution failed', 
        details: directError.message 
      });
    }

  } catch (error) {
    console.error('AI Assistant error:', error);
    res.status(500).json({ 
      error: 'Failed to process your question',
      details: error.response?.data || error.message 
    });
  }
});

// Execute direct queries safely
async function executeDirectQuery(sqlQuery) {
  const query = sqlQuery.toLowerCase().trim();
  console.log('Executing query:', sqlQuery);
  
  try {
    // Handle COUNT queries
    if (query.includes('count(')) {
      // Extract conditions from WHERE clause
      const whereMatch = query.match(/where\s+(.+?)(?:;|$)/i);
      
      if (query.includes('join notes')) {
        // Complex query with notes join
        let queryBuilder = supabaseAdmin
          .from('students')
          .select('*, notes!inner(content, created_at)', { count: 'exact', head: false });
        
        // Apply filters based on WHERE clause
        if (whereMatch) {
          const conditions = whereMatch[1];
          
          // Check for year condition
          if (conditions.includes('extract(year from n.created_at)')) {
            const currentYear = new Date().getFullYear();
            queryBuilder = queryBuilder
              .gte('notes.created_at', `${currentYear}-01-01`)
              .lt('notes.created_at', `${currentYear + 1}-01-01`);
          }
          
          // Check for content conditions
          const contentMatches = conditions.matchAll(/n\.content\s+ilike\s+'%([^%]+)%'/gi);
          for (const match of contentMatches) {
            queryBuilder = queryBuilder.ilike('notes.content', `%${match[1]}%`);
          }
        }
        
        const { data, error } = await queryBuilder;
        if (error) throw error;
        
        // Count distinct students
        const uniqueStudentIds = new Set(data.map(s => s.id));
        return { 
          data: [{ count: uniqueStudentIds.size }], 
          count: 1 
        };
        
      } else if (query.includes('join consultations')) {
        // Query with consultations join
        let queryBuilder = supabaseAdmin
          .from('students')
          .select('*, consultations!inner(*)', { count: 'exact', head: false });
        
        if (whereMatch) {
          const conditions = whereMatch[1];
          
          // Handle consultation status
          if (conditions.includes('status')) {
            const statusMatch = conditions.match(/status\s*=\s*'([^']+)'/i);
            if (statusMatch) {
              queryBuilder = queryBuilder.eq('consultations.status', statusMatch[1]);
            }
          }
          
          // Handle date ranges
          if (conditions.includes('consultation_date')) {
            const currentMonth = new Date();
            const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
            const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
            
            queryBuilder = queryBuilder
              .gte('consultations.consultation_date', startOfMonth.toISOString())
              .lte('consultations.consultation_date', endOfMonth.toISOString());
          }
        }
        
        const { data, error } = await queryBuilder;
        if (error) throw error;
        
        return { 
          data: [{ count: data.length }], 
          count: 1 
        };
        
      } else {
        // Simple count query on students table
        let queryBuilder = supabaseAdmin
          .from('students')
          .select('*', { count: 'exact', head: true });
        
        if (whereMatch) {
          const conditions = whereMatch[1];
          
          // Handle different field types
          const fieldMatches = conditions.matchAll(/(\w+)\s*=\s*'([^']+)'/gi);
          for (const match of fieldMatches) {
            queryBuilder = queryBuilder.eq(match[1], match[2]);
          }
          
          // Handle numeric comparisons
          const numericMatches = conditions.matchAll(/(\w+)\s*([><=]+)\s*(\d+\.?\d*)/gi);
          for (const match of numericMatches) {
            const [, field, operator, value] = match;
            if (operator === '>') queryBuilder = queryBuilder.gt(field, parseFloat(value));
            else if (operator === '>=') queryBuilder = queryBuilder.gte(field, parseFloat(value));
            else if (operator === '<') queryBuilder = queryBuilder.lt(field, parseFloat(value));
            else if (operator === '<=') queryBuilder = queryBuilder.lte(field, parseFloat(value));
            else if (operator === '=') queryBuilder = queryBuilder.eq(field, parseFloat(value));
          }
          
          // Handle ILIKE
          const ilikeMatches = conditions.matchAll(/(\w+)\s+ilike\s+'%([^%]+)%'/gi);
          for (const match of ilikeMatches) {
            queryBuilder = queryBuilder.ilike(match[1], `%${match[2]}%`);
          }
        }
        
        const { count, error } = await queryBuilder;
        if (error) throw error;
        
        return { data: [{ count: count || 0 }], count: 1 };
      }
    }
    
    // Handle SELECT queries (non-count)
    if (query.startsWith('select')) {
      let queryBuilder;
      
      if (query.includes('join notes')) {
        queryBuilder = supabaseAdmin
          .from('students')
          .select('*, notes!inner(content, type, created_at)');
        
        // Apply WHERE conditions
        const whereMatch = query.match(/where\s+(.+?)(?:;|$)/i);
        if (whereMatch) {
          const conditions = whereMatch[1];
          const contentMatches = conditions.matchAll(/n\.content\s+ilike\s+'%([^%]+)%'/gi);
          for (const match of contentMatches) {
            queryBuilder = queryBuilder.ilike('notes.content', `%${match[1]}%`);
          }
        }
        
        const { data, error } = await queryBuilder;
        if (error) throw error;
        
        // Remove duplicates if DISTINCT
        if (query.includes('distinct')) {
          const uniqueStudents = Array.from(
            new Map(data.map(s => [s.id, s])).values()
          );
          return { data: uniqueStudents, count: uniqueStudents.length };
        }
        
        return { data, count: data.length };
        
      } else {
        // Simple SELECT on students
        queryBuilder = supabaseAdmin.from('students').select('*');
        
        // Apply WHERE conditions
        const whereMatch = query.match(/where\s+(.+?)(?:;|$)/i);
        if (whereMatch) {
          const conditions = whereMatch[1];
          
          // Handle graduation_year
          if (conditions.includes('graduation_year')) {
            const yearMatch = conditions.match(/graduation_year\s*=\s*(\d+)/i);
            if (yearMatch) {
              queryBuilder = queryBuilder.eq('graduation_year', parseInt(yearMatch[1]));
            }
          }
          
          // Handle job_search_status
          if (conditions.includes('job_search_status')) {
            const statusMatch = conditions.match(/job_search_status\s*=\s*'([^']+)'/i);
            if (statusMatch) {
              queryBuilder = queryBuilder.eq('job_search_status', statusMatch[1]);
            }
          }
          
          // Handle GPA
          if (conditions.includes('gpa')) {
            const gpaMatch = conditions.match(/gpa\s*([><=]+)\s*(\d+\.?\d*)/i);
            if (gpaMatch) {
              const [, operator, value] = gpaMatch;
              const gpaValue = parseFloat(value);
              if (operator === '>') queryBuilder = queryBuilder.gt('gpa', gpaValue);
              else if (operator === '>=') queryBuilder = queryBuilder.gte('gpa', gpaValue);
              else if (operator === '<') queryBuilder = queryBuilder.lt('gpa', gpaValue);
              else if (operator === '<=') queryBuilder = queryBuilder.lte('gpa', gpaValue);
            }
          }
          
          // Handle array fields
          if (conditions.includes('@>') || conditions.includes('any(')) {
            // Handle target_industries
            const industryMatch = conditions.match(/target_industries\s*@>\s*ARRAY\['([^']+)'\]/i);
            if (industryMatch) {
              queryBuilder = queryBuilder.contains('target_industries', [industryMatch[1]]);
            }
          }
          
          // Handle boolean fields
          if (conditions.includes('resume_on_file')) {
            if (conditions.includes('resume_on_file = true')) {
              queryBuilder = queryBuilder.eq('resume_on_file', true);
            } else if (conditions.includes('resume_on_file = false')) {
              queryBuilder = queryBuilder.eq('resume_on_file', false);
            }
          }
        }
        
        // Apply ORDER BY
        const orderMatch = query.match(/order\s+by\s+(\w+)(?:\s+(asc|desc))?/i);
        if (orderMatch) {
          queryBuilder = queryBuilder.order(orderMatch[1], { 
            ascending: !orderMatch[2] || orderMatch[2].toLowerCase() === 'asc' 
          });
        }
        
        // Apply LIMIT
        const limitMatch = query.match(/limit\s+(\d+)/i);
        if (limitMatch) {
          queryBuilder = queryBuilder.limit(parseInt(limitMatch[1]));
        }
        
        const { data, error, count } = await queryBuilder;
        if (error) throw error;
        
        return { data, count: data.length };
      }
    }
    
    throw new Error('Unsupported query type');
    
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
}

// Get suggested queries based on available data
router.get('/suggestions', async (req, res) => {
  try {
    // Get some basic stats to provide relevant suggestions
    const { data: studentsCount } = await supabaseAdmin
      .from('students')
      .select('*', { count: 'exact', head: true });
    
    const { data: notesCount } = await supabaseAdmin
      .from('notes')
      .select('*', { count: 'exact', head: true });
      
    const { data: consultationsCount } = await supabaseAdmin
      .from('consultations')
      .select('*', { count: 'exact', head: true });

    const suggestions = [
      "How many students are actively searching for jobs?",
      "Which students have notes about cover letters?",
      "Show me all students graduating in 2024",
      "How many consultations were completed this month?",
      "Which students are interested in tech industry?",
      "Show me students with GPA above 3.5",
      "How many students have updated their resume this year?",
      "Which students have had consultations but no follow-up notes?",
      "Show me all employed students",
      "How many students are preparing for interviews?"
    ];

    res.json({
      success: true,
      suggestions,
      stats: {
        totalStudents: studentsCount || 0,
        totalNotes: notesCount || 0,
        totalConsultations: consultationsCount || 0
      }
    });
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({ error: 'Failed to load suggestions' });
  }
});

module.exports = router;