// Calendly Integration for Auto Student Creation
export interface CalendlyEvent {
  uri: string;
  name: string;
  status: string;
  start_time: string;
  end_time: string;
  event_type: string;
  location?: {
    type: string;
    location?: string;
  };
  invitees: CalendlyInvitee[];
  event_memberships: {
    user: string;
  }[];
  created_at: string;
  updated_at: string;
}

export interface CalendlyInvitee {
  uri: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
  updated_at: string;
  cancel_url?: string;
  reschedule_url?: string;
  questions_and_answers?: {
    question: string;
    answer: string;
  }[];
}

export interface CalendlyWebhookPayload {
  created_at: string;
  created_by: string;
  event: string;
  payload: {
    event: CalendlyEvent;
    invitee?: CalendlyInvitee;
  };
}

// Map Calendly event types to consultation types
const CALENDLY_EVENT_TYPE_MAPPING: Record<string, string> = {
  'initial-consultation': 'Initial assessment',
  'cv-review': 'CV review',
  'linkedin-optimization': 'LinkedIn optimization',
  'masters-preparation': 'Masters preparation',
  'interview-prep': 'Interview preparation',
  'job-navigation': 'Job navigation',
  '1-on-1-consultation': '1-to-1 consultation',
  'career-consultation': '1-to-1 consultation',
  'academic-consultation': '1-to-1 consultation'
};

// Extract program information from Calendly form responses
const extractProgramInfo = (questionsAndAnswers?: { question: string; answer: string }[]): {
  programType: string;
  specificProgram: string;
  yearOfStudy: string;
  major?: string;
} => {
  const defaultInfo = {
    programType: "Bachelor's" as const,
    specificProgram: 'Computer Science',
    yearOfStudy: '1st year' as const
  };

  if (!questionsAndAnswers) return defaultInfo;

  let programType = "Bachelor's";
  let specificProgram = 'Computer Science';
  let yearOfStudy = '1st year';
  let major = '';

  questionsAndAnswers.forEach(({ question, answer }) => {
    const q = question.toLowerCase();
    const a = answer.toLowerCase();

    // Program Type Detection
    if (q.includes('program type') || q.includes('degree level')) {
      if (a.includes('master') || a.includes('mba')) {
        programType = "Master's";
      } else if (a.includes('phd') || a.includes('doctorate')) {
        programType = 'PhD';
      }
    }

    // Specific Program Detection
    if (q.includes('program') || q.includes('major') || q.includes('field of study')) {
      if (a.includes('business administration') || a.includes('business admin')) {
        specificProgram = 'Business Administration';
      } else if (a.includes('computer science') || a.includes('cs')) {
        specificProgram = 'Computer Science';
      } else if (a.includes('psychology')) {
        specificProgram = 'Psychology';
      } else if (a.includes('biology')) {
        specificProgram = 'Biology';
      } else if (a.includes('english literature')) {
        specificProgram = 'English Literature';
      } else if (a.includes('english') && a.includes('new media')) {
        specificProgram = 'English & New Media';
      } else if (a.includes('ir') || a.includes('politics') || a.includes('international relations')) {
        specificProgram = 'IR & Politics';
      } else if (a.includes('business computing')) {
        specificProgram = 'Business Computing';
      } else if (a.includes('mba')) {
        specificProgram = 'MBA';
        programType = "Master's";
      } else if (a.includes('organizational psychology')) {
        specificProgram = 'Organizational Psychology';
        programType = "Master's";
      } else if (a.includes('tourism')) {
        if (programType === "Master's") {
          specificProgram = 'Tourism';
        } else {
          specificProgram = 'Business Administration';
          major = 'Tourism';
        }
      }
    }

    // Major/Specialization for Business Administration
    if (specificProgram === 'Business Administration' && (q.includes('specialization') || q.includes('major') || q.includes('concentration'))) {
      if (a.includes('finance')) {
        major = 'Finance';
      } else if (a.includes('tourism')) {
        major = 'Tourism';
      } else if (a.includes('marketing')) {
        major = 'Marketing';
      }
    }

    // Year of Study Detection
    if (q.includes('year') || q.includes('level')) {
      if (a.includes('1st') || a.includes('first') || a.includes('freshman')) {
        yearOfStudy = '1st year';
      } else if (a.includes('2nd') || a.includes('second') || a.includes('sophomore')) {
        yearOfStudy = '2nd year';
      } else if (a.includes('3rd') || a.includes('third') || a.includes('junior')) {
        yearOfStudy = '3rd year';
      } else if (a.includes('4th') || a.includes('fourth') || a.includes('senior')) {
        yearOfStudy = '4th year';
      } else if (a.includes('graduate') || a.includes('masters') || a.includes('phd')) {
        yearOfStudy = 'Graduate';
      }
    }
  });

  const result: any = {
    programType,
    specificProgram,
    yearOfStudy
  };

  if (major) {
    result.major = major;
  }

  return result;
};

// Process Calendly webhook and create student + consultation
export const processCalendlyWebhook = async (webhookPayload: CalendlyWebhookPayload) => {
  const { event: eventType, payload } = webhookPayload;
  const { event, invitee } = payload;

  // Only process scheduled events
  if (eventType !== 'invitee.created' || !invitee) {
    console.log('Skipping webhook - not a new invitee creation');
    return null;
  }

  try {
    // Import here to avoid circular dependencies
    const { loadStudents, addStudent } = await import('./studentData');
    const { addConsultationToStudent } = await import('./studentData');
    const { checkDuplicateEmail } = await import('./duplicateDetection');

    // Check if student already exists
    const existingStudent = checkDuplicateEmail(invitee.email);
    
    let studentId: string;
    
    if (existingStudent) {
      // Find the existing student
      const students = loadStudents();
      const student = students.find(s => s.email.toLowerCase() === invitee.email.toLowerCase());
      if (!student) {
        throw new Error('Student exists but could not be found');
      }
      studentId = student.id;
      console.log(`Using existing student: ${student.firstName} ${student.lastName}`);
    } else {
      // Create new student
      const nameParts = invitee.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      if (!firstName || !lastName) {
        throw new Error('Could not parse first and last name from Calendly invitee');
      }

      // Extract program information from form responses
      const programInfo = extractProgramInfo(invitee.questions_and_answers);
      
      // Set academic start date (estimate based on current date and year)
      const now = new Date();
      const currentYear = now.getFullYear();
      const academicStartMonth = 8; // September
      
      // Estimate start year based on their current year of study
      let yearsBack = 0;
      switch (programInfo.yearOfStudy) {
        case '2nd year': yearsBack = 1; break;
        case '3rd year': yearsBack = 2; break;
        case '4th year': yearsBack = 3; break;
        default: yearsBack = 0;
      }
      
      const startYear = now.getMonth() < academicStartMonth ? currentYear - 1 - yearsBack : currentYear - yearsBack;
      const academicStartDate = new Date(startYear, academicStartMonth, 1).toISOString();

      const newStudentData: any = {
        firstName,
        lastName,
        email: invitee.email,
        ...programInfo,
        academicStartDate,
        status: 'Active'
      };

      const newStudent = addStudent(newStudentData);
      studentId = newStudent.id;
      console.log(`Created new student: ${firstName} ${lastName}`);
    }

    // Determine consultation type from Calendly event type
    const eventTypeName = event.event_type.toLowerCase();
    let consultationType = '1-to-1 consultation'; // default

    // Try to match event type
    for (const [key, value] of Object.entries(CALENDLY_EVENT_TYPE_MAPPING)) {
      if (eventTypeName.includes(key)) {
        consultationType = value;
        break;
      }
    }

    // Calculate duration
    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    // Create consultation record
    const consultationData = {
      type: consultationType as any,
      date: event.start_time,
      duration,
      attended: true, // Will be updated after the meeting
      notes: `Scheduled via Calendly. Event: ${event.name}`,
      followUpRequired: false
    };

    // Add location if available
    if (event.location) {
      consultationData.notes += `\nLocation: ${event.location.type}`;
      if (event.location.location) {
        consultationData.notes += ` - ${event.location.location}`;
      }
    }

    // Add any additional information from form responses
    if (invitee.questions_and_answers && invitee.questions_and_answers.length > 0) {
      consultationData.notes += '\n\nForm Responses:';
      invitee.questions_and_answers.forEach(({ question, answer }) => {
        consultationData.notes += `\n- ${question}: ${answer}`;
      });
    }

    const success = addConsultationToStudent(studentId, consultationData);
    
    if (success) {
      console.log(`Created consultation for student ${studentId}: ${consultationType} on ${startTime.toLocaleDateString()}`);
      
      // Dispatch event to notify UI components
      window.dispatchEvent(new CustomEvent('studentUpdated', { 
        detail: { studentId, source: 'calendly' } 
      }));
      
      return {
        success: true,
        studentId,
        consultationType,
        eventTime: startTime,
        isNewStudent: !existingStudent
      };
    } else {
      throw new Error('Failed to create consultation record');
    }

  } catch (error) {
    console.error('Error processing Calendly webhook:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Webhook endpoint handler (for when you set up the backend)
export const handleCalendlyWebhook = async (request: Request): Promise<Response> => {
  try {
    const webhookPayload: CalendlyWebhookPayload = await request.json();
    
    // Verify webhook signature if needed (recommended for production)
    // const signature = request.headers.get('calendly-webhook-signature');
    // if (!verifyWebhookSignature(signature, JSON.stringify(webhookPayload))) {
    //   return new Response('Invalid signature', { status: 401 });
    // }
    
    const result = await processCalendlyWebhook(webhookPayload);
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Manual processing function for testing
export const simulateCalendlyEvent = (
  inviteeName: string,
  inviteeEmail: string,
  eventType: string,
  startTime: string,
  duration: number = 30,
  formResponses?: { question: string; answer: string }[]
) => {
  const mockWebhookPayload: CalendlyWebhookPayload = {
    created_at: new Date().toISOString(),
    created_by: 'calendly',
    event: 'invitee.created',
    payload: {
      event: {
        uri: 'https://api.calendly.com/scheduled_events/test',
        name: eventType,
        status: 'active',
        start_time: startTime,
        end_time: new Date(new Date(startTime).getTime() + duration * 60000).toISOString(),
        event_type: eventType,
        invitees: [],
        event_memberships: [{ user: 'test-user' }],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      invitee: {
        uri: 'https://api.calendly.com/scheduled_events/test/invitees/test',
        name: inviteeName,
        email: inviteeEmail,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        questions_and_answers: formResponses
      }
    }
  };

  return processCalendlyWebhook(mockWebhookPayload);
};