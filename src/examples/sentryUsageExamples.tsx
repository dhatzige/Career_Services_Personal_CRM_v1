import React from 'react';
import * as Sentry from '@sentry/react';
import { 
  fetchWithSentry, 
  trackUIInteraction, 
  trackFormSubmission,
  captureExceptionWithContext,
  addNavigationBreadcrumb,
  trackSearch
} from '../utils/sentryHelpers';

// Example 1: Student Search Component with Sentry tracking
export function StudentSearchExample() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [results, setResults] = React.useState([]);
  
  const handleSearch = async () => {
    // Track the search operation
    await trackUIInteraction(
      'Student Search',
      async () => {
        try {
          // Add breadcrumb for search
          trackSearch('students', searchQuery, results.length);
          
          // Use fetchWithSentry for API calls
          const data = await fetchWithSentry(
            `/api/students/search?q=${encodeURIComponent(searchQuery)}`,
            { method: 'GET' },
            'Search Students'
          );
          
          setResults(data);
        } catch (error) {
          // Capture exception with context
          captureExceptionWithContext(error as Error, {
            tags: {
              feature: 'student_search',
              action: 'search',
            },
            extra: {
              search_query: searchQuery,
              query_length: searchQuery.length,
            },
          });
        }
      },
      {
        search_query_length: searchQuery.length,
        has_filters: false,
      }
    );
  };
  
  return (
    <div>
      <input 
        value={searchQuery} 
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search students..."
      />
      <button onClick={handleSearch}>Search</button>
    </div>
  );
}

// Example 2: Add Student Form with Sentry tracking
export function AddStudentFormExample() {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    program: '',
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await trackFormSubmission(
      'Add Student Form',
      async () => {
        try {
          const response = await fetchWithSentry(
            '/api/students',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData),
            },
            'Create Student'
          );
          
          // Add success breadcrumb
          Sentry.addBreadcrumb({
            category: 'student',
            message: 'Student created successfully',
            level: 'info',
            data: {
              student_id: response.id,
              program: formData.program,
            },
          });
          
        } catch (error) {
          throw error; // Re-throw to be caught by trackFormSubmission
        }
      },
      formData
    );
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}

// Example 3: Navigation tracking
export function NavigationExample() {
  const navigate = (from: string, to: string) => {
    // Add navigation breadcrumb
    addNavigationBreadcrumb(from, to);
    
    // Track navigation as a span
    Sentry.startSpan(
      {
        op: 'navigation',
        name: `Navigate to ${to}`,
      },
      (span) => {
        span.setAttribute('navigation.from', from);
        span.setAttribute('navigation.to', to);
        
        // Perform navigation
        window.location.href = to;
      }
    );
  };
  
  return (
    <button onClick={() => navigate('/students', '/students/123')}>
      View Student Details
    </button>
  );
}

// Example 4: Consultation Booking with performance tracking
export function ConsultationBookingExample() {
  const bookConsultation = async (studentId: string, date: Date) => {
    return Sentry.startSpan(
      {
        op: 'consultation.book',
        name: 'Book Consultation',
      },
      async (span) => {
        span.setAttribute('student.id', studentId);
        span.setAttribute('consultation.date', date.toISOString());
        
        try {
          // Step 1: Check availability
          const availabilitySpan = span.startChild({
            op: 'consultation.check_availability',
            name: 'Check Availability',
          });
          
          const isAvailable = await fetchWithSentry(
            `/api/consultations/availability?date=${date.toISOString()}`,
            { method: 'GET' }
          );
          
          availabilitySpan.finish();
          
          if (!isAvailable) {
            throw new Error('Time slot not available');
          }
          
          // Step 2: Create consultation
          const createSpan = span.startChild({
            op: 'consultation.create',
            name: 'Create Consultation',
          });
          
          const consultation = await fetchWithSentry(
            '/api/consultations',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ studentId, date }),
            }
          );
          
          createSpan.finish();
          
          // Step 3: Send confirmation
          const emailSpan = span.startChild({
            op: 'email.send',
            name: 'Send Confirmation Email',
          });
          
          await fetchWithSentry(
            `/api/email/confirmation`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ consultationId: consultation.id }),
            }
          );
          
          emailSpan.finish();
          
          return consultation;
        } catch (error) {
          span.setStatus('error');
          throw error;
        }
      }
    );
  };
  
  return (
    <button onClick={() => bookConsultation('123', new Date())}>
      Book Consultation
    </button>
  );
}

// Example 5: Error Boundary with Sentry
export const SentryErrorBoundaryExample = () => {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div>
          <h2>Something went wrong!</h2>
          <p>{error.message}</p>
          <button onClick={resetError}>Try again</button>
        </div>
      )}
      showDialog
      dialogOptions={{
        title: "We're sorry!",
        subtitle: "Something went wrong. Please help us fix it by describing what happened.",
        subtitle2: "Our team has been notified and will look into this issue.",
      }}
    >
      {/* Your app components */}
    </Sentry.ErrorBoundary>
  );
};