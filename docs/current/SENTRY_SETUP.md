# Sentry Error Tracking Setup

This guide explains how to set up Sentry for error tracking and performance monitoring in the Career Services CRM.

## Overview

Sentry is integrated into both the frontend (React) and backend (Express) to provide:
- Real-time error tracking
- Performance monitoring
- User session replay (frontend)
- Release tracking
- Custom error context

## Getting Your Sentry DSN

1. **Create a Sentry Account**
   - Go to [https://sentry.io](https://sentry.io)
   - Sign up for a free account (supports up to 5K errors/month)

2. **Create Projects**
   - Create two projects:
     - `career-services-frontend` (React)
     - `career-services-backend` (Node.js)

3. **Get Your DSN**
   - In each project, go to Settings → Client Keys (DSN)
   - Copy the DSN value (looks like: `https://abc123@o123456.ingest.sentry.io/1234567`)

## Configuration

### Frontend Setup

1. Add to your `.env.local` file:
   ```env
   VITE_SENTRY_DSN=your-frontend-dsn-here
   ```

2. The frontend will automatically:
   - Track JavaScript errors
   - Monitor route changes
   - Capture console errors
   - Record user sessions (10% sample rate)

### Backend Setup

1. Add to your `backend/.env` file:
   ```env
   SENTRY_DSN=your-backend-dsn-here
   ```

2. The backend will automatically:
   - Track API errors
   - Monitor database queries
   - Capture unhandled exceptions
   - Profile performance (10% sample rate)

## Features Implemented

### Frontend
- Error boundary integration
- React Router v6 integration
- User context tracking
- Custom breadcrumbs
- Session replay on errors
- Performance profiling

### Backend
- Express middleware integration
- Automatic error capture
- Request context
- Performance monitoring
- Sensitive data scrubbing
- Database query tracking

## Testing Your Integration

### Test Frontend Errors
1. Open browser console
2. Run: `throw new Error('Test Sentry Frontend')`
3. Check your Sentry dashboard

### Test Backend Errors
1. Make a request to a non-existent endpoint
2. Or trigger an error in any API endpoint
3. Check your Sentry dashboard

## Best Practices

1. **Set User Context**
   ```javascript
   // After login
   Sentry.setUser({
     id: user.id,
     email: user.email,
     username: user.username
   });
   ```

2. **Add Custom Context**
   ```javascript
   Sentry.setContext('student', {
     id: student.id,
     program: student.program
   });
   ```

3. **Track Important Events**
   ```javascript
   Sentry.captureMessage('Important action completed', 'info');
   ```

## Security

The integration automatically:
- Scrubs passwords and tokens
- Removes auth headers
- Filters sensitive data
- Respects user privacy

## Monitoring

Once configured, you can:
- View errors in real-time
- Set up alerts
- Track error trends
- Monitor performance
- Create custom dashboards

## Troubleshooting

1. **Sentry not capturing errors**
   - Check if DSN is set correctly
   - Verify network connectivity
   - Check browser console for errors

2. **Too many events**
   - Adjust `tracesSampleRate` in code
   - Set up inbound filters in Sentry
   - Use `beforeSend` to filter events

3. **Missing context**
   - Ensure user context is set after login
   - Add breadcrumbs for important actions
   - Use `Sentry.setTag()` for categorization

## Using Sentry in Your Code

### Frontend Usage

```javascript
import { trackUIInteraction, fetchWithSentry, trackFormSubmission } from './utils/sentryHelpers';

// Track button clicks
const handleClick = () => {
  trackUIInteraction('Export Students', async () => {
    await exportStudents();
  }, { format: 'csv' });
};

// Track API calls
const students = await fetchWithSentry('/api/students');

// Track form submissions
await trackFormSubmission('Add Student Form', async () => {
  await createStudent(formData);
}, formData);
```

### Backend Usage

```javascript
import { trackDatabaseOperation, logInfo, logError } from './utils/monitoring';

// Track database operations
const students = await trackDatabaseOperation('SELECT', 'students', async () => {
  return await db.query('SELECT * FROM students');
});

// Structured logging
logInfo('Student created', { student_id: 123, program: 'CS' });
logError('Failed to send email', { error: err.message, recipient: email });
```

### Performance Monitoring

```javascript
// Frontend
Sentry.startSpan({
  op: 'ui.render',
  name: 'Render Student List'
}, (span) => {
  span.setAttribute('student.count', students.length);
  renderStudentList(students);
});

// Backend
Sentry.startSpan({
  op: 'consultation.book',
  name: 'Book Consultation'
}, async (span) => {
  // Multi-step operation tracking
  const availabilitySpan = span.startChild({
    op: 'consultation.check_availability',
    name: 'Check Availability'
  });
  // ... check availability
  availabilitySpan.finish();
});
```

## Additional Resources

- [Sentry React Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Sentry Node Documentation](https://docs.sentry.io/platforms/node/)
- [Best Practices Guide](https://docs.sentry.io/product/best-practices/)
- See `/src/examples/sentryUsageExamples.tsx` for frontend examples
- See `/backend/src/examples/sentryUsageExamples.ts` for backend examples