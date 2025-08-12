import { Request, Response } from 'express';
import { ConsultationModel } from '../models/Consultation';
import { StudentModel } from '../models/Student';
// import { UserModel } from '../models/User'; // Removed - using Supabase auth
import { logAuditEvent } from '../middleware/security';
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

// Handle when a new meeting is scheduled
async function handleInviteeCreated(payload: any, req: any): Promise<void> {
  try {
    const { email, name, scheduled_event } = payload;
    const { start_time, end_time, event_type, location } = scheduled_event;
    
    // Find or create student
    let student = await StudentModel.findByEmail(email);
    if (!student) {
      // Create new student from Calendly data
      const [firstName, ...lastNameParts] = name.split(' ');
      const lastName = lastNameParts.join(' ');
      
      const studentData = {
        firstName,
        lastName,
        email,
        source: 'calendly',
        status: 'active',
        jobSearchStatus: 'Not Started' as const  // Explicitly set default job search status with proper typing
      };
      
      student = await StudentModel.create(studentData);
    }
    
    // Create consultation record
    const consultationData = {
      studentId: student.id,
      date: new Date(start_time),
      duration: Math.round((new Date(end_time).getTime() - new Date(start_time).getTime()) / 60000),
      type: event_type.name.includes('career') ? 'Career Counseling' : 'Academic Advising',
      location: location?.location || 'Online',
      notes: `Scheduled via Calendly: ${event_type.name}\nCalendly URI: ${scheduled_event.uri}`,
      topic: event_type.name,
      attended: false,
      followUpRequired: false,
      needsReview: true  // Flag to indicate consultation type needs manual review
    };
    
    await ConsultationModel.create(consultationData);
    
    logAuditEvent(req, 'CALENDLY_MEETING_CREATED', 'calendar', true, {
      studentId: student.id,
      eventUri: scheduled_event.uri
    });
  } catch (error) {
    console.error('Error handling invitee created:', error);
    throw error;
  }
}

// Handle when a meeting is canceled
async function handleInviteeCanceled(payload: any, req: any): Promise<void> {
  try {
    const { scheduled_event, reason } = payload;
    
    // Find consultation by Calendly URI
    const consultation = await ConsultationModel.findByCalendlyUri(scheduled_event.uri);
    if (consultation) {
      await ConsultationModel.update(consultation.id, {
        notes: consultation.notes + `\n\nCanceled via Calendly. Reason: ${reason || 'Not specified'}`,
        followUpNotes: `Canceled: ${reason || 'Not specified'}`
      });
      
      logAuditEvent(req, 'CALENDLY_MEETING_CANCELED', 'calendar', true, {
        consultationId: consultation.id,
        reason
      });
    }
  } catch (error) {
    console.error('Error handling invitee canceled:', error);
    throw error;
  }
}

// Handle when a meeting is rescheduled
async function handleInviteeRescheduled(payload: any, req: any): Promise<void> {
  try {
    const { new_invitee, old_invitee } = payload;
    const { scheduled_event: newEvent } = new_invitee;
    const { scheduled_event: oldEvent } = old_invitee;
    
    // Find consultation by old Calendly URI
    const consultation = await ConsultationModel.findByCalendlyUri(oldEvent.uri);
    if (consultation) {
      // Update with new details
      await ConsultationModel.update(consultation.id, {
        date: new Date(newEvent.start_time).toISOString(),
        duration: Math.round((new Date(newEvent.end_time).getTime() - new Date(newEvent.start_time).getTime()) / 60000),
        location: newEvent.location?.location || consultation.location,
        notes: consultation.notes + `\n\nRescheduled via Calendly from ${oldEvent.start_time} to ${newEvent.start_time}\nNew Calendly URI: ${newEvent.uri}`
      });
      
      logAuditEvent(req, 'CALENDLY_MEETING_RESCHEDULED', 'calendar', true, {
        consultationId: consultation.id,
        oldTime: oldEvent.start_time,
        newTime: newEvent.start_time
      });
    }
  } catch (error) {
    console.error('Error handling invitee rescheduled:', error);
    throw error;
  }
}

// Get Calendly configuration for frontend
export const getCalendlyConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if API key is configured
    if (!process.env.CALENDLY_API_KEY || process.env.CALENDLY_API_KEY === 'your_calendly_api_key_here') {
      // Return fallback configuration
      const calendlyUrl = process.env.CALENDLY_URL;
      if (calendlyUrl && calendlyUrl !== 'https://calendly.com/your-username') {
        res.json({
          success: true,
          data: {
            url: calendlyUrl,
            eventTypes: process.env.CALENDLY_EVENT_TYPES?.split(',') || ['30-minute-meeting', '60-minute-meeting'],
            embedOptions: {
              hideEventTypeDetails: false,
              hideLandingPageDetails: false,
              primaryColor: '#2563eb',
              textColor: '#1f2937',
              hideGdprBanner: true
            }
          }
        });
        return;
      }
    }

    const { CalendlyService } = await import('../services/calendlyService');
    
    // Get current user info
    const userInfo = await CalendlyService.getCurrentUser() as any;
    const user = userInfo.resource;
    
    // Get event types
    const eventTypesData = await CalendlyService.getEventTypes(user.uri) as any;
    const eventTypes = eventTypesData.collection.map((et: any) => ({
      uri: et.uri,
      name: et.name,
      slug: et.slug,
      schedulingUrl: et.scheduling_url,
      duration: et.duration,
      color: et.color
    }));
    
    res.json({
      success: true,
      data: {
        user: {
          name: user.name,
          email: user.email,
          schedulingUrl: user.scheduling_url,
          timezone: user.timezone
        },
        eventTypes,
        embedOptions: {
          hideEventTypeDetails: false,
          hideLandingPageDetails: false,
          primaryColor: '#2563eb',
          textColor: '#1f2937',
          hideGdprBanner: true
        }
      }
    });
  } catch (error) {
    console.error('Error getting Calendly config:', error);
    
    // Fallback to environment variables if API fails
    const calendlyUrl = process.env.CALENDLY_URL;
    if (calendlyUrl) {
      res.json({
        success: true,
        data: {
          url: calendlyUrl,
          eventTypes: process.env.CALENDLY_EVENT_TYPES?.split(',') || [],
          embedOptions: {
            hideEventTypeDetails: false,
            hideLandingPageDetails: false,
            primaryColor: '#2563eb',
            textColor: '#1f2937',
            hideGdprBanner: true
          }
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to get Calendly configuration'
      });
    }
  }
};

// Get upcoming scheduled meetings
export const getUpcomingMeetings = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { limit = 10, studentId } = req.query;
    
    // For SQLite schema, we don't have advisor_id or status columns
    // So we'll get all upcoming consultations
    const filters: any = {
      date: {
        gte: new Date()
      }
    };
    
    if (studentId) {
      filters.studentId = parseInt(studentId as string);
    }
    
    const meetings = await ConsultationModel.findAll(filters, parseInt(limit as string));
    
    // Get student details for each meeting
    const meetingsWithStudents = await Promise.all(
      meetings.map(async (meeting) => {
        const student = await StudentModel.findById(meeting.studentId);
        return {
          ...meeting,
          student: student ? {
            id: student.id,
            name: `${student.firstName} ${student.lastName}`,
            email: student.email
          } : null
        };
      })
    );
    
    res.json({
      success: true,
      data: meetingsWithStudents
    });
  } catch (error) {
    console.error('Error getting upcoming meetings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get upcoming meetings'
    });
  }
};

// Sync past Calendly events (one-time sync)
export const syncCalendlyEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { CalendlyService } = await import('../services/calendlyService');
    
    // Get current user
    const userInfo = await CalendlyService.getCurrentUser() as any;
    const userUri = userInfo.resource.uri;
    
    // Get events from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const eventsData = await CalendlyService.getScheduledEvents({
      user: userUri,
      min_start_time: thirtyDaysAgo.toISOString(),
      status: 'active'
    }) as any;
    
    let importedCount = 0;
    let skippedCount = 0;
    
    // Process each event
    for (const event of eventsData.collection) {
      try {
        // Check if consultation already exists
        const existingConsultation = await ConsultationModel.findByCalendlyUri(event.uri);
        if (existingConsultation) {
          skippedCount++;
          continue;
        }
        
        // Get invitee details
        const inviteesData = await CalendlyService.getEventInvitees(event.uri) as any;
        if (inviteesData.collection.length === 0) continue;
        
        const invitee = inviteesData.collection[0]; // Take first invitee
        
        // Find or create student
        let student = await StudentModel.findByEmail(invitee.email);
        if (!student) {
          const [firstName, ...lastNameParts] = invitee.name.split(' ');
          const lastName = lastNameParts.join(' ');
          
          student = await StudentModel.create({
            firstName,
            lastName,
            email: invitee.email
          });
        }
        
        // Create consultation record
        const consultationData = {
          studentId: student.id,
          date: new Date(event.start_time),
          duration: Math.round((new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / 60000),
          type: event.event_type.includes('career') ? 'Career Counseling' : 'Academic Advising',
          location: event.location?.type || 'Online',
          notes: `Imported from Calendly: ${event.name}\nCalendly URI: ${event.uri}\nStatus: ${event.status}`,
          topic: event.name,
          attended: event.status === 'active' ? false : true,
          followUpRequired: false
        };
        
        await ConsultationModel.create(consultationData);
        importedCount++;
      } catch (eventError) {
        console.error('Error processing event:', event.uri, eventError);
      }
    }
    
    res.json({
      success: true,
      message: `Calendly sync completed. Imported ${importedCount} events, skipped ${skippedCount} existing events.`,
      data: {
        status: 'completed',
        imported: importedCount,
        skipped: skippedCount,
        total: eventsData.collection.length
      }
    });
    
    logAuditEvent(req as any, 'CALENDLY_SYNC_COMPLETED', 'calendar', true, {
      imported: importedCount,
      skipped: skippedCount
    });
  } catch (error) {
    console.error('Error syncing Calendly events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync Calendly events',
      error: error.message
    });
  }
};