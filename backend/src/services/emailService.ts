import { Resend } from 'resend';
import logger from '../utils/logger';

// Initialize Resend client lazily to avoid initialization errors
let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export class EmailService {
  private static readonly FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@careerservices.edu';
  private static readonly ENABLED = process.env.EMAIL_ENABLED === 'true';

  static async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.ENABLED) {
      logger.info('Email service disabled - would have sent:', {
        to: options.to,
        subject: options.subject
      });
      return true;
    }

    if (!process.env.RESEND_API_KEY) {
      logger.error('Email service error: RESEND_API_KEY not configured');
      return false;
    }

    try {
      const client = getResendClient();
      if (!client) {
        logger.error('Email service error: Resend client not initialized');
        return false;
      }
      
      const result = await client.emails.send({
        from: this.FROM_EMAIL,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
        attachments: options.attachments
      });

      logger.info('Email sent successfully', {
        id: result.data?.id,
        to: options.to,
        subject: options.subject
      });

      return true;
    } catch (error) {
      logger.error('Failed to send email', {
        error,
        to: options.to,
        subject: options.subject
      });
      return false;
    }
  }

  // Student welcome email
  static async sendWelcomeEmail(student: {
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<boolean> {
    const html = `
      <h2>Welcome to Career Services, ${student.firstName}!</h2>
      <p>We're excited to support you on your career journey.</p>
      
      <h3>What's Next?</h3>
      <ul>
        <li>Schedule your initial consultation</li>
        <li>Upload your resume for review</li>
        <li>Explore our career resources</li>
        <li>Connect with career advisors</li>
      </ul>
      
      <p>If you have any questions, feel free to reply to this email.</p>
      
      <p>Best regards,<br>Career Services Team</p>
    `;

    return this.sendEmail({
      to: student.email,
      subject: 'Welcome to Career Services!',
      html
    });
  }

  // Consultation reminder email
  static async sendConsultationReminder(consultation: {
    studentEmail: string;
    studentName: string;
    date: string;
    time: string;
    type: string;
    location?: string;
  }): Promise<boolean> {
    const html = `
      <h2>Consultation Reminder</h2>
      <p>Hi ${consultation.studentName},</p>
      
      <p>This is a reminder about your upcoming ${consultation.type} consultation:</p>
      
      <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Date:</strong> ${consultation.date}</p>
        <p><strong>Time:</strong> ${consultation.time}</p>
        <p><strong>Type:</strong> ${consultation.type}</p>
        ${consultation.location ? `<p><strong>Location:</strong> ${consultation.location}</p>` : ''}
      </div>
      
      <p>Please let us know if you need to reschedule.</p>
      
      <p>Best regards,<br>Career Services Team</p>
    `;

    return this.sendEmail({
      to: consultation.studentEmail,
      subject: `Reminder: ${consultation.type} on ${consultation.date}`,
      html
    });
  }

  // Follow-up reminder email
  static async sendFollowUpReminder(reminder: {
    studentEmail: string;
    studentName: string;
    message: string;
    dueDate: string;
  }): Promise<boolean> {
    const html = `
      <h2>Follow-Up Reminder</h2>
      <p>Hi ${reminder.studentName},</p>
      
      <p>${reminder.message}</p>
      
      <p><strong>Due Date:</strong> ${reminder.dueDate}</p>
      
      <p>If you've already completed this task, please let us know!</p>
      
      <p>Best regards,<br>Career Services Team</p>
    `;

    return this.sendEmail({
      to: reminder.studentEmail,
      subject: 'Career Services Follow-Up Reminder',
      html
    });
  }

  // Application status update email
  static async sendApplicationStatusUpdate(update: {
    studentEmail: string;
    studentName: string;
    companyName: string;
    position: string;
    oldStatus: string;
    newStatus: string;
  }): Promise<boolean> {
    const statusColors: Record<string, string> = {
      applied: '#3b82f6',
      interviewing: '#f59e0b',
      offered: '#10b981',
      rejected: '#ef4444',
      accepted: '#10b981'
    };

    const html = `
      <h2>Application Status Update</h2>
      <p>Hi ${update.studentName},</p>
      
      <p>Your application status has been updated:</p>
      
      <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Company:</strong> ${update.companyName}</p>
        <p><strong>Position:</strong> ${update.position}</p>
        <p><strong>Status:</strong> 
          <span style="color: ${statusColors[update.oldStatus] || '#666'}; text-decoration: line-through;">
            ${update.oldStatus}
          </span> → 
          <span style="color: ${statusColors[update.newStatus] || '#666'}; font-weight: bold;">
            ${update.newStatus}
          </span>
        </p>
      </div>
      
      ${update.newStatus === 'interviewing' ? '<p>Good luck with your interview! Check out our interview preparation resources.</p>' : ''}
      ${update.newStatus === 'offered' ? '<p>Congratulations on receiving an offer! Let us know if you need help with salary negotiation.</p>' : ''}
      
      <p>Best regards,<br>Career Services Team</p>
    `;

    return this.sendEmail({
      to: update.studentEmail,
      subject: `Application Update: ${update.companyName} - ${update.position}`,
      html
    });
  }

  // Mock interview feedback email
  static async sendInterviewFeedback(feedback: {
    studentEmail: string;
    studentName: string;
    interviewDate: string;
    overallScore: number;
    strengths: string[];
    improvements: string[];
    feedbackText: string;
  }): Promise<boolean> {
    const html = `
      <h2>Mock Interview Feedback</h2>
      <p>Hi ${feedback.studentName},</p>
      
      <p>Thank you for participating in the mock interview on ${feedback.interviewDate}. Here's your feedback:</p>
      
      <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3>Overall Score: ${feedback.overallScore}/10</h3>
        
        <h4>Strengths:</h4>
        <ul>
          ${feedback.strengths.map(s => `<li>${s}</li>`).join('')}
        </ul>
        
        <h4>Areas for Improvement:</h4>
        <ul>
          ${feedback.improvements.map(i => `<li>${i}</li>`).join('')}
        </ul>
        
        <h4>Detailed Feedback:</h4>
        <p>${feedback.feedbackText}</p>
      </div>
      
      <p>Keep practicing, and feel free to schedule another mock interview!</p>
      
      <p>Best regards,<br>Career Services Team</p>
    `;

    return this.sendEmail({
      to: feedback.studentEmail,
      subject: 'Your Mock Interview Feedback',
      html
    });
  }

  // Batch email for announcements
  static async sendAnnouncement(announcement: {
    recipients: string[];
    subject: string;
    content: string;
  }): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif;">
        ${announcement.content}
        
        <hr style="margin: 30px 0; border: 1px solid #e0e0e0;">
        
        <p style="font-size: 12px; color: #666;">
          You're receiving this email because you're registered with Career Services.
          <br>
          To unsubscribe or update your preferences, please contact us.
        </p>
      </div>
    `;

    // Send in batches to avoid rate limits
    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < announcement.recipients.length; i += batchSize) {
      batches.push(announcement.recipients.slice(i, i + batchSize));
    }

    let success = true;
    for (const batch of batches) {
      const result = await this.sendEmail({
        to: batch,
        subject: announcement.subject,
        html
      });
      
      if (!result) success = false;
      
      // Add delay between batches to respect rate limits
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return success;
  }

  // Document share email
  static async sendDocumentShare(share: {
    recipientEmail: string;
    recipientName: string;
    senderName: string;
    documentName: string;
    documentType: string;
    message?: string;
    downloadUrl: string;
  }): Promise<boolean> {
    const html = `
      <h2>Document Shared With You</h2>
      <p>Hi ${share.recipientName},</p>
      
      <p>${share.senderName} has shared a ${share.documentType} with you:</p>
      
      <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Document:</strong> ${share.documentName}</p>
        <p><strong>Type:</strong> ${share.documentType}</p>
        ${share.message ? `<p><strong>Message:</strong> ${share.message}</p>` : ''}
      </div>
      
      <p>
        <a href="${share.downloadUrl}" 
           style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Download Document
        </a>
      </p>
      
      <p style="font-size: 12px; color: #666;">
        This link will expire in 7 days for security reasons.
      </p>
      
      <p>Best regards,<br>Career Services Team</p>
    `;

    return this.sendEmail({
      to: share.recipientEmail,
      subject: `${share.senderName} shared "${share.documentName}" with you`,
      html,
      replyTo: share.senderName.includes('@') ? share.senderName : undefined
    });
  }
}