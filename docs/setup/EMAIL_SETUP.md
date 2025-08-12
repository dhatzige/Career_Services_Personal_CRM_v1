# Email Service Setup Guide

This guide will help you set up Resend for email notifications in the Career Services CRM.

## Why Email Notifications?

Email notifications keep students engaged and informed about:
- Welcome messages when they join
- Consultation reminders
- Application status updates
- Interview feedback
- Follow-up reminders
- Important announcements

## Setting Up Resend

1. **Create a Resend Account**
   - Go to [resend.com](https://resend.com/)
   - Sign up for a free account

2. **Verify Your Domain (Optional)**
   - Add your domain for professional emails
   - Follow Resend's domain verification process
   - Or use the default sender email

3. **Get Your API Key**
   - Go to API Keys in your dashboard
   - Create a new API key
   - Copy the key (starts with `re_`)

4. **Configure Environment Variables**
   
   Add these to your `backend/.env` file:
   ```env
   # Email Configuration (Resend)
   EMAIL_ENABLED=true
   RESEND_API_KEY=re_your_api_key_here
   EMAIL_FROM=noreply@yourdomain.com
   ```

## Email Templates Included

### 1. Welcome Email
- Sent automatically when a new student is added
- Includes next steps and resources

### 2. Consultation Reminder
- Sent 24 hours before scheduled consultations
- Includes date, time, and location

### 3. Follow-up Reminder
- Sent for pending follow-up tasks
- Customizable message and due date

### 4. Application Status Update
- Sent when application status changes
- Color-coded status indicators

### 5. Mock Interview Feedback
- Detailed feedback after mock interviews
- Includes scores and improvement areas

### 6. Announcements
- Batch emails for important updates
- Supports HTML formatting

### 7. Document Sharing
- Secure document sharing notifications
- Includes download links with expiration

## Testing Emails

During development:
1. Set `EMAIL_ENABLED=false` to log emails instead of sending
2. Check console logs to see what would be sent
3. Set `EMAIL_ENABLED=true` to send actual emails

## Email Integration Points

Emails are automatically sent when:
- Creating a new student (welcome email)
- Updating application status
- Completing mock interviews
- Setting follow-up reminders
- Sharing documents

## Free Tier Limits

Resend free tier includes:
- 100 emails per day
- 3,000 emails per month
- Custom domain support
- Webhooks for delivery tracking

## Best Practices

1. **Use Templates**: All emails use consistent, professional templates
2. **Test First**: Always test with `EMAIL_ENABLED=false` first
3. **Monitor Delivery**: Check Resend dashboard for delivery status
4. **Handle Bounces**: Monitor and handle bounced emails
5. **Respect Preferences**: Future: Add unsubscribe options

## Troubleshooting

If emails aren't sending:
1. Verify `RESEND_API_KEY` is correct
2. Check `EMAIL_ENABLED=true`
3. Verify sender email is verified in Resend
4. Check Resend dashboard for errors
5. Review application logs

## Production Considerations

1. **Domain Verification**: Verify your domain for better deliverability
2. **SPF/DKIM**: Configure DNS records as per Resend docs
3. **Rate Limiting**: Implement rate limiting for bulk emails
4. **Monitoring**: Set up webhooks for delivery tracking
5. **Compliance**: Add unsubscribe links for marketing emails

## Email Analytics

Track in Resend dashboard:
- Delivery rates
- Open rates
- Click rates
- Bounce rates
- Spam complaints

## Next Steps

After setting up email:
1. Test all email templates
2. Configure domain verification
3. Set up webhook endpoints
4. Implement email preferences
5. Add email analytics tracking