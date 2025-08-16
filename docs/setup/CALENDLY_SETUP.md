# Calendly Integration Setup

## How It Works

The CRM integrates with Calendly to automatically create student records and track consultations:

1. **Students book meetings** through your Calendly link
2. **Calendly sends a webhook** to your CRM when a meeting is booked
3. **CRM automatically**:
   - Creates a new student record (if they don't exist)
   - Creates a consultation record
   - Updates the student list (recent consultations appear first)

## Setup Instructions

### 1. For Production

Simply use the webhook setup in the CRM:

1. Go to **Settings → Integrations → Calendly**
2. Click **Setup Webhook**
3. Save the webhook secret to your `.env` file

### 2. For Local Development

Calendly requires a public URL for webhooks. Use ngrok or similar:

1. Install ngrok: `brew install ngrok` (Mac) or download from https://ngrok.com
2. Start your backend: `npm run dev` (runs on port 4001)
3. In another terminal: `ngrok http 4001`
4. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
5. Use this URL for webhook setup: `https://abc123.ngrok.io/api/calendar/webhook/calendly`

### Manual Setup (Alternative)

If the automatic setup fails, you can set up the webhook manually:

```bash
# Test webhook endpoint (replace with your ngrok URL for local dev)
curl -X POST http://localhost:4001/api/calendar/webhook/setup \
  -H "Content-Type: application/json" \
  -d '{"webhookUrl":"https://your-domain.com/api/calendar/webhook/calendly"}'
```

## Architecture

- **Supabase**: Database for all CRM data (students, consultations, notes)
- **Calendly**: External scheduling service
- **Webhook**: Connects them together for automatic sync

## Features

- ✅ Auto-create students from Calendly bookings
- ✅ Track all consultations with full history
- ✅ Sort students by most recent consultation
- ✅ Handle cancellations and reschedules
- ✅ No authentication required for webhook endpoint