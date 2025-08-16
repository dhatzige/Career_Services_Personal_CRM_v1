# API Reference - Career Services CRM

**Last Updated**: August 4, 2025  
**Base URL**: `http://localhost:4001/api`  
**Version**: 0.10.0

## 🔑 Authentication

All API endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## 📚 API Client Usage

### Frontend API Client

The centralized API client (`src/services/apiClient.ts`) provides both generic and entity-specific methods:

```typescript
import { api } from '@/services/apiClient';

// Generic methods
await api.get('/endpoint');
await api.post('/endpoint', data);
await api.put('/endpoint', data);
await api.delete('/endpoint');

// Entity-specific methods (recommended)
await api.students.list();
await api.students.get(id);
await api.students.create(data);
await api.students.update(id, data);
await api.students.delete(id);
```

## 📋 Endpoints

### Students

#### List All Students
```http
GET /students
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@university.edu",
      "year_of_study": "Junior",
      "program_type": "Undergraduate",
      "major": "Computer Science",
      "job_search_status": "Actively Searching",
      "quick_note": "Interview prep needed"
    }
  ]
}
```

#### Get Student by ID
```http
GET /students/:id
```

#### Create Student
```http
POST /students
```

**Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@university.edu",
  "phone": "+1234567890",
  "yearOfStudy": "Junior",
  "programType": "Undergraduate",
  "major": "Computer Science"
}
```

#### Update Student
```http
PUT /students/:id
```

#### Delete Student
```http
DELETE /students/:id
```

### Notes

#### List Notes
```http
GET /notes?studentId=<uuid>  // Optional filter
```

#### Get Note by ID
```http
GET /notes/:id
```

#### Create Note
```http
POST /notes
```

**Body:**
```json
{
  "studentId": "uuid",
  "type": "General",
  "content": "Note content here",
  "isPrivate": false,
  "tags": ["follow-up", "important"]
}
```

**Note Types:**
- `General`
- `Career Planning`
- `Interview Prep`
- `Job Search Strategy`
- `Follow-up Required`
- `Academic Concern`
- `Resume Review`
- `Mock Interview`

#### Update Note
```http
PUT /notes/:id
```

#### Delete Note
```http
DELETE /notes/:id
```

### Consultations

#### List Consultations
```http
GET /consultations
GET /consultations/student/:studentId
```

#### Get Consultations by Date Range
```http
GET /consultations/date-range/:startDate/:endDate
```

**Date Format**: `YYYY-MM-DD`

**Response includes Today's View data:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "student_id": "uuid",
      "scheduled_date": "2025-08-01T14:00:00Z",
      "duration": 30,
      "type": "Career Counseling",
      "status": "scheduled",
      "location": "online",
      "meeting_link": "https://meet.google.com/abc-defg-hij",
      "student": {
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@university.edu"
      }
    }
  ]
}
```

#### Create Consultation
```http
POST /consultations/student/:studentId
```

**Body:**
```json
{
  "scheduledDate": "2025-08-01T14:00:00Z",
  "duration": 30,
  "type": "Career Counseling",
  "location": "online",
  "meetingLink": "https://meet.google.com/abc-defg-hij",
  "notes": "Discussion about internship opportunities"
}
```

#### Update Consultation
```http
PUT /consultations/:id
```

**Body:**
```json
{
  "status": "cancelled",
  "cancellationMethod": "email",
  "cancellationReason": "Student requested reschedule",
  "attended": false
}
```

**Status Values:**
- `scheduled` - Future appointment
- `attended` - Student attended
- `no-show` - Student didn't attend
- `cancelled` - Cancelled in advance
- `rescheduled` - Moved to different time

**Cancellation Methods:**
- `calendly` - Cancelled through Calendly
- `email` - Cancelled via email
- `phone` - Cancelled by phone call
- `no-notice` - No-show without notice
- `other` - Other cancellation method

#### Delete Consultation
```http
DELETE /consultations/:id
```

#### Get Consultation Stats
```http
GET /consultations/stats/overview
```

### Dashboard

#### Get Dashboard Stats
```http
GET /dashboard/stats
```

**Response:**
```json
{
  "totalStudents": 150,
  "activeStudents": 75,
  "upcomingConsultations": 12,
  "recentNotes": 45,
  "jobSearchingStudents": 30,
  "employedStudents": 20
}
```

### Calendar Integration

#### Get Calendar Events
```http
GET /calendar/events
```

#### Get Calendly Settings
```http
GET /calendar/calendly/settings
```

### Reports

#### Generate Report
```http
GET /reports/generate?type=<reportType>&startDate=<date>&endDate=<date>
```

**Report Types:**
- `student-engagement`
- `consultation-summary`
- `career-outcomes`
- `workshop-attendance`

### System

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-01T10:00:00Z",
  "database": "connected",
  "auth": "connected"
}
```

## 🔴 Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "status": 400,
    "details": {}
  }
}
```

### Common Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid request data |
| 401 | UNAUTHORIZED | Missing or invalid auth token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource already exists |
| 429 | RATE_LIMITED | Too many requests |
| 500 | INTERNAL_ERROR | Server error |

## 🚦 Rate Limiting

- **Limit**: 100 requests per 15 minutes
- **Headers**: 
  - `X-RateLimit-Limit`: Total allowed requests
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Reset timestamp

## 🔍 Request Tracking

Every request includes a unique ID for debugging:

**Request Header:**
```
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
```

This ID is logged in Sentry for error tracking.

## 💡 Best Practices

1. **Use Entity Methods**: Prefer `api.students.get(id)` over `api.get('/students/' + id)`
2. **Handle Errors**: Always wrap API calls in try-catch blocks
3. **Check Response**: Verify `success` field before using data
4. **Use TypeScript**: Import types from `@/types` for type safety
5. **Pagination**: Use `limit` and `offset` params for large datasets

## 📝 Example Usage

```typescript
import { api } from '@/services/apiClient';
import { toast } from '@/components/ui/toast';

// Get today's consultations
try {
  const today = new Date().toISOString().split('T')[0];
  const consultations = await api.consultations.dateRange(today, today);
  
  // Update consultation status
  await api.consultations.update(consultationId, {
    status: 'attended'
  });
  
  toast.success('Attendance marked');
} catch (error) {
  console.error('API Error:', error);
  toast.error(error.message || 'Failed to update');
}
```

## 📊 Reports Endpoints

### Get Daily Summary
```http
GET /api/reports/daily-summary?date={ISO_DATE}
```

**Query Parameters:**
- `date` (optional) - ISO date string (defaults to today)

### Get Weekly Metrics
```http
GET /api/reports/weekly-metrics?startDate={ISO_DATE}
```

**Query Parameters:**
- `startDate` (optional) - ISO date string for week start (defaults to current week)

### Send Daily Summary Email
```http
POST /api/reports/send-daily-email
```

**Request Body:**
```json
{
  "recipientEmail": "advisor@example.com",
  "date": "2025-08-01T00:00:00.000Z"
}
```

### Export Data
```http
GET /api/reports/export?type={TYPE}&format={FORMAT}
```

**Query Parameters:**
- `type` (required) - One of: `students`, `consultations`, `notes`, `weekly-metrics`
- `format` (optional) - `csv` (default) or `json`
- `startDate` (optional) - For date-filtered exports
- `endDate` (optional) - For date-filtered exports

**Response for CSV:**
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="{type}-{date}.csv"`
- Body: CSV data

**Response for JSON:**
- Content-Type: `application/json`
- Body: JSON array of records

**Examples:**
```http
# Export all students as CSV
GET /api/reports/export?type=students&format=csv

# Export consultations for a date range
GET /api/reports/export?type=consultations&startDate=2025-08-01&endDate=2025-08-31

# Export all notes as JSON
GET /api/reports/export?type=notes&format=json
```

### Import Data
```http
POST /api/reports/import
```

**Request Headers:**
- Content-Type: `application/json`
- Authorization: `Bearer {token}`

**Request Body:**
```json
{
  "type": "students",
  "data": [
    {
      "First Name": "John",
      "Last Name": "Doe",
      "Email": "john.doe@university.edu",
      "Phone": "+1 (555) 123-4567",
      "Status": "Active",
      "Current Year": "3rd year",
      "Program Type": "Bachelor's",
      "Degree Program": "Computer Science",
      "Major/Specialization": "Data Science"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Import completed: 5 successful, 2 skipped (duplicates)",
  "successCount": 5,
  "errorCount": 0,
  "skipCount": 2,
  "errors": []
}
```

**Import Notes:**
- Currently only supports `students` type
- Emails must be unique (duplicates are skipped)
- All required fields must be present
- Use exact field names from the template

## 📤 Import/Export Features

### Download Import Template

To get the CSV template for importing students, use the frontend service:

```typescript
import { downloadCSVTemplate } from '@/services/importExportService';

// Downloads student-import-template.csv
downloadCSVTemplate();
```

### Export Full Backup

To export all data as a complete backup:

```typescript
import { exportBackup } from '@/services/importExportService';

// Downloads career-services-backup_{date}.json
await exportBackup();
```

The backup includes:
- All student records
- All consultations
- All notes

## 🤖 AI Endpoints

### Generate Analytics Insights

**Endpoint:** `POST /api/ai/analytics-insights`

**Purpose:** Generate AI-powered insights based on analytics data

**Request Headers:**
- Content-Type: `application/json`
- Authorization: `Bearer {token}`

**Request Body:**
```json
{
  "dateRange": {
    "start": "2025-07-01T00:00:00.000Z",
    "end": "2025-08-01T00:00:00.000Z",
    "label": "Last 30 days"
  },
  "metrics": {
    "totalStudents": 150,
    "activeStudents": 120,
    "totalConsultations": 450,
    "attendanceRate": 85.5,
    "avgConsultationsPerStudent": 3.0,
    "highEngagementStudents": 45,
    "topProgram": "Computer Science",
    "noShowRate": 14.5
  },
  "studentCount": 150,
  "consultationTypes": {
    "1-to-1 consultation": 200,
    "CV review": 150,
    "Interview preparation": 100
  },
  "programDistribution": {
    "Computer Science": 50,
    "Business": 40,
    "Engineering": 60
  }
}
```

**Response:**
```json
{
  "success": true,
  "insights": "## Analytics Insights for Last 30 days\n\n### Performance Overview\nYour career services center demonstrated excellent performance with a 85.5% attendance rate across 450 consultations.\n\n### Key Findings\n1. **Engagement Patterns**\n   - 45 students (30.0%) show high engagement with 3+ consultations\n   - Average of 3.0 consultations per student exceeds typical benchmarks\n   - 14.5% no-show rate is within acceptable range\n\n2. **Program Analysis**\n   - Computer Science leads in consultation volume\n   - 3 different programs are actively engaged\n\n3. **Strategic Recommendations**\n   - Maintain current high-performing practices\n   - Consider peer mentoring program\n   - Monitor and support at-risk students\n\n### Success Metrics to Track\n- Reduce no-show rate to below 10%\n- Increase average consultations to 3.6\n- Achieve 90%+ attendance rate\n- Expand high engagement cohort to 30%"
}
```

**Notes:**
- Insights are generated based on provided metrics
- Can include custom AI prompts for specific analysis
- Supports both rule-based and AI-generated insights
- Returns markdown-formatted insights with strategic recommendations