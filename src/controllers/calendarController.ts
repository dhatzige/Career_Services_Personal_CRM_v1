import { Request, Response } from 'express';
import { ConsultationModel } from '../models/Consultation';
import { StudentModel } from '../models/Student';
// import { UserModel } from '../models/User'; // Removed - using Supabase auth
import { logAuditEvent } from '../middleware/security';
import { CalendlyService } from '../services/calendlyService';
import crypto from 'crypto';

// Verify Calendly webhook signature
function verifyCalendlySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Handle Calendly webhook events
export const handleCalendlyWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['calendly-webhook-signature'] as string;
    const webhookSecret = process.env.CALENDLY_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('Calendly webhook secret not configured');
      res.status(500).json({ error: 'Webhook configuration error' });
      return;
    }
    
    // Verify webhook signature
    const payload = JSON.stringify(req.body);
    if (!verifyCalendlySignature(payload, signature, webhookSecret)) {
      logAuditEvent(req as any, 'CALENDLY_WEBHOOK_INVALID_SIGNATURE', 'calendar', false);
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }
    
    const { event, payload: eventPayload } = req.body;
    
    switch (event) {
      case 'invitee.created':
        await handleInviteeCreated(eventPayload, req as any);
        break;
        
      case 'invitee.canceled':
        await handleInviteeCanceled(eventPayload, req as any);
        break;
        
      case 'invitee.rescheduled':
        await handleInviteeRescheduled(eventPayload, req as any);
        break;
        
      default:
        console.log(`Unhandled Calendly event: ${event}`);
    }
    
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Calendly webhook error:', error);
    logAuditEvent(req as any, 'CALENDLY_WEBHOOK_ERROR', 'calendar', false, { error: error.message });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// NEW: Manual sync function for development
export const syncCalendlyEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔄 Starting Calendly events sync...');
    
    // Get current user first to get their URI
    const userInfo = await CalendlyService.getCurrentUser() as any;
    const userUri = userInfo.resource.uri;
    
    console.log(`🔍 Fetching events for user: ${userUri}`);
    
    // Get events from yesterday forward (to catch meetings from yesterday)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const eventsResponse = await CalendlyService.getScheduledEvents({
      user: userUri,
      min_start_time: `${yesterday}T00:00:00Z`,
      max_start_time: `${nextWeek}T23:59:59Z`,
      status: 'active'
    });
    
    const events = (eventsResponse as any).collection || [];
    console.log(`📅 Found ${events.length} scheduled events`);
    
    let syncedCount = 0;
    
    for (const event of events) {
      try {
        // Get invitees for this event
        const eventId = event.uri.split('/').pop();
        const inviteesResponse = await CalendlyService.getEventInvitees(eventId);
        const invitees = (inviteesResponse as any).collection || [];
        
        for (const invitee of invitees) {
          const eventData = {
            email: invitee.email,
            name: invitee.name,
            scheduled_event: {
              start_time: event.start_time,
              end_time: event.end_time,
              event_type: {
                name: event.event_type,
                uri: event.event_type
              },
              location: event.location,
              uri: event.uri,
              calendly_uuid: event.uri
            }
          };
          
          await handleInviteeCreated(eventData, req as any, true); // true = skip webhook verification
          syncedCount++;
        }
      } catch (eventError) {
        console.error(`Error processing event ${event.uri}:`, eventError);
      }
    }
    
    console.log(`✅ Synced ${syncedCount} events from Calendly`);
    res.json({
      success: true,
      message: `Successfully synced ${syncedCount} events from Calendly`,
      syncedCount
    });
    
  } catch (error) {
    console.error('Calendly sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync Calendly events',
      details: error.response?.data || error.message
    });
  }
};

// Handle when a new meeting is scheduled
async function handleInviteeCreated(payload: any, req: any, skipWebhookVerification: boolean = false): Promise<void> {
  try {
    const { email, name, scheduled_event } = payload;
    const { start_time, end_time, event_type, location, calendly_uuid } = scheduled_event;
    
    console.log(`📝 Processing invitee: ${name} (${email}) for event at ${start_time}`);
    
    // Check if this consultation already exists
    const existingConsultation = await ConsultationModel.findByCalendlyId(calendly_uuid || scheduled_event.uri);
    if (existingConsultation) {
      console.log(`⏭️  Consultation already exists for Calendly event ${calendly_uuid}`);
      return;
    }
    
    // Find or create student
    let student = await StudentModel.findByEmail(email);
    if (!student) {
      console.log(`👤 Creating new student: ${name} (${email})`);
      const [firstName, ...lastNameParts] = name.split(' ');
      const lastName = lastNameParts.join(' ') || '';
      
      const studentData = {
        firstName,
        lastName,
        email,
        phone: '',
        yearOfStudy: null, // Let admin set this manually
        programType: null, // Let admin set this manually
        specificProgram: null,
        major: null,
        jobSearchStatus: 'Not Started' as const,
        careerInterests: [],
        targetIndustries: [],
        targetLocations: [],
        tags: [],
        quickNote: null
      };
      
      student = await StudentModel.create(studentData);
    }
    
    // Create consultation record
    const consultationData = {
      studentId: student.id,
      type: 'Career Counseling',
      date: new Date(start_time).toISOString(),
      duration: Math.round((new Date(end_time).getTime() - new Date(start_time).getTime()) / (1000 * 60)), // minutes
      status: 'scheduled',
      location: location?.join_url || 'Calendly meeting',
      notes: `Scheduled via Calendly - Event type: ${event_type?.name || 'Unknown'}`,
      calendlyUri: calendly_uuid || scheduled_event.uri,
      attended: false
    };
    
    const consultation = await ConsultationModel.create(consultationData);
    
    console.log(`✅ Created consultation ${consultation.id} for student ${student.id}`);
    
    if (!skipWebhookVerification) {
      logAuditEvent(req, 'CALENDLY_MEETING_CREATED', 'calendar', true, {
        studentId: student.id,
        consultationId: consultation.id,
        meetingTime: start_time
      });
    }
    
  } catch (error) {
    console.error('Error handling invitee created:', error);
    throw error;
  }
}

// Handle when a meeting is canceled
async function handleInviteeCanceled(payload: any, req: any): Promise<void> {
  try {
    const { scheduled_event } = payload;
    const calendlyEventId = scheduled_event.uri;
    
    // Find consultation by Calendly event ID
    const consultation = await ConsultationModel.findByCalendlyId(calendlyEventId);
    if (!consultation) {
      console.log(`No consultation found for canceled Calendly event: ${calendlyEventId}`);
      return;
    }
    
    // Update consultation status
    await ConsultationModel.update(consultation.id, {
      status: 'cancelled',
      notes: consultation.notes + ' - Cancelled via Calendly'
    });
    
    logAuditEvent(req, 'CALENDLY_MEETING_CANCELLED', 'calendar', true, {
      consultationId: consultation.id,
      calendlyEventId
    });
    
  } catch (error) {
    console.error('Error handling invitee canceled:', error);
    throw error;
  }
}

// Handle when a meeting is rescheduled
async function handleInviteeRescheduled(payload: any, req: any): Promise<void> {
  try {
    const { old_scheduled_event, new_scheduled_event } = payload;
    const oldEventId = old_scheduled_event.uri;
    
    // Find consultation by old Calendly event ID
    const consultation = await ConsultationModel.findByCalendlyId(oldEventId);
    if (!consultation) {
      console.log(`No consultation found for rescheduled Calendly event: ${oldEventId}`);
      return;
    }
    
    // Update consultation with new details
    await ConsultationModel.update(consultation.id, {
      date: new Date(new_scheduled_event.start_time).toISOString(),
      duration: Math.round((new Date(new_scheduled_event.end_time).getTime() - new Date(new_scheduled_event.start_time).getTime()) / (1000 * 60)),
      notes: consultation.notes + ` - Rescheduled from ${old_scheduled_event.start_time} to ${new_scheduled_event.start_time}`
    });
    
    logAuditEvent(req, 'CALENDLY_MEETING_RESCHEDULED', 'calendar', true, {
      consultationId: consultation.id,
      oldEventId,
      newEventId: new_scheduled_event.uri
    });
    
  } catch (error) {
    console.error('Error handling invitee rescheduled:', error);
    throw error;
  }
}

// Get Calendly configuration
export const getCalendlyConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({
      success: true,
      config: {
        calendlyUrl: process.env.CALENDLY_URL,
        webhookConfigured: !!process.env.CALENDLY_WEBHOOK_SECRET,
        apiKeyConfigured: !!process.env.CALENDLY_API_KEY
      }
    });
  } catch (error) {
    console.error('Error fetching Calendly config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Calendly configuration'
    });
  }
};

// Get upcoming meetings from calendar
export const getUpcomingMeetings = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get consultations from current time forward (not past meetings)
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    // Get all consultations and filter to only future meetings
    const allConsultations = await ConsultationModel.findAll({}, 100);
    const consultations = allConsultations.filter(c => {
      const meetingTime = new Date(c.date);
      // Only show meetings that haven't ended yet (add meeting duration)
      const meetingEnd = new Date(meetingTime.getTime() + (c.duration || 30) * 60 * 1000);
      return meetingEnd >= now;
    });
    
    // Get student details for each consultation
    const meetings = [];
    for (const consultation of consultations) {
      try {
        const student = await StudentModel.findById(consultation.studentId);
        if (student) {
          meetings.push({
            id: consultation.id,
            title: consultation.type || 'Consultation',
            date: consultation.date,
            time: new Date(consultation.date).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            }),
            duration: consultation.duration || 30,
            student: {
              id: student.id,
              name: `${student.firstName} ${student.lastName}`,
              email: student.email
            },
            status: consultation.status || 'scheduled',
            notes: consultation.notes,
            location: consultation.location || 'Office'
          });
        }
      } catch (error) {
        console.error(`Error loading student for consultation ${consultation.id}:`, error);
      }
    }
    
    res.json({
      success: true,
      meetings
    });
  } catch (error) {
    console.error('Error fetching upcoming meetings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch upcoming meetings'
    });
  }
};