# Calendly Integration Documentation

## Overview

The Personal CRM integrates with Calendly to allow scheduling meetings with students directly from the application.

## Configuration

### Backend Setup

1. **Environment Variables**:
   ```bash
   CALENDLY_API_KEY=your_personal_access_token
   CALENDLY_WEBHOOK_SECRET=your_webhook_secret
   ```

2. **API Service**: `/backend/src/services/calendlyService.ts`
   - Handles all Calendly API interactions
   - Uses Personal Access Token (PAT) for authentication
   - Supports organization-scoped operations

### Frontend Components

1. **CalendlyEmbed** (`/src/components/calendar/CalendlyEmbed.tsx`)
   - Main component for scheduling interface
   - Supports popup widget mode
   - Loads Calendly widget.js dynamically

2. **Calendar Page** (`/src/pages/Calendar.tsx`)
   - Two tabs: Upcoming Meetings and Schedule New Meeting
   - Integrates with backend calendar endpoints

## API Endpoints

### Calendar Configuration
- `GET /api/calendar/config/calendly`
- Returns user info, event types, and embed options

### Upcoming Meetings
- `GET /api/calendar/meetings/upcoming`
- Returns scheduled consultations from the database

### Webhook Handler
- `POST /api/calendar/webhook/calendly`
- Processes Calendly events (invitee.created, invitee.canceled, etc.)

## Database Integration

Consultations are stored in the SQLite database with the following structure:
- `id`: Unique identifier
- `student_id`: Reference to student
- `type`: Type of consultation
- `consultation_date`: Meeting date/time
- `duration`: Duration in minutes
- `notes`: Meeting notes (includes Calendly URI)
- `topic`: Meeting topic
- `follow_up_notes`: Follow-up information

## Usage Flow

1. User navigates to Calendar page
2. Clicks "Schedule New Meeting" tab
3. Selects meeting type from dropdown
4. Clicks "Open Calendar" button
5. Calendly popup opens with scheduling interface
6. After scheduling, webhook creates consultation record
7. Meeting appears in "Upcoming Meetings" tab

## Troubleshooting

### Popup Not Opening
- Check browser console for errors
- Verify popup blockers are disabled
- Ensure Calendly API key is valid

### 500 Errors
- Check date format compatibility with SQLite
- Verify database schema matches model expectations
- Review backend logs for detailed error messages

### Configuration Issues
- Verify API key has correct permissions
- Check organization URI is properly set
- Ensure webhook secret matches Calendly configuration