import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, MapPin, RefreshCw } from 'lucide-react';
import { api } from '../services/apiClient';
import { Consultation } from '../types/student';
import * as Sentry from '@sentry/react';
import { format } from 'date-fns';

interface TodayConsultation extends Consultation {
  studentName: string;
  studentEmail: string;
  studentId: string;
}

const TodayView: React.FC = () => {
  const [consultations, setConsultations] = useState<TodayConsultation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayConsultations();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadTodayConsultations, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadTodayConsultations = async () => {
    try {
      const today = new Date();
      const startDate = format(today, 'yyyy-MM-dd');
      const endDate = startDate;
      
      const response = await api.consultations.dateRange(startDate, endDate);
      const consultationsData = response.data || response || [];
      
      // Map the response data to include proper student info
      const mappedData = consultationsData.map((c: any) => ({
        ...c,
        studentName: c.studentName || c.student_name || 'Unknown',
        studentEmail: c.studentEmail || c.student_email || '',
        studentId: c.studentId || c.student_id || '',
        date: c.date || c.consultation_date || c.scheduled_date
      }));
      
      // Filter out past meetings and sort by time
      const now = new Date();
      const currentMeetings = mappedData.filter((c: any) => {
        const meetingTime = new Date(c.date);
        // Only show meetings that haven't ended yet (add 30 min buffer for meeting duration)
        const meetingEnd = new Date(meetingTime.getTime() + (c.duration || 30) * 60 * 1000);
        return meetingEnd >= now;
      });
      
      const sorted = currentMeetings.sort((a: any, b: any) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      setConsultations(sorted);
    } catch (error) {
      console.error('Error loading consultations:', error);
      Sentry.captureException(error, {
        tags: { operation: 'load_today_consultations' }
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a');
  };

  const formatDuration = (duration: number) => {
    if (duration >= 60) {
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    return `${duration}m`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="h-7 w-7 text-blue-600" />
            Today's Schedule
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <button
          onClick={loadTodayConsultations}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Schedule */}
      {consultations.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No meetings scheduled today
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Enjoy your free day! You can schedule meetings from the Calendar page.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Show pagination info if many meetings */}
          {consultations.length > 10 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-center">
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                📅 {consultations.length} meetings today - showing upcoming meetings only
              </p>
            </div>
          )}
          
          {/* Limit to 20 meetings for performance */}
          {consultations.slice(0, 20).map((consultation) => (
            <div
              key={consultation.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Time and Duration */}
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
                      <Clock className="h-5 w-5 mr-2 text-blue-600" />
                      {formatTime(consultation.date)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                      {formatDuration(consultation.duration || 30)}
                    </div>
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                      {consultation.type || 'Consultation'}
                    </div>
                  </div>

                  {/* Student Info */}
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center text-gray-900 dark:text-white">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="font-medium">{consultation.studentName}</span>
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 text-sm">
                      ({consultation.studentEmail})
                    </div>
                  </div>

                  {/* Location */}
                  {consultation.location && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm mb-3">
                      <MapPin className="h-4 w-4 mr-2" />
                      {consultation.location}
                    </div>
                  )}

                  {/* Notes */}
                  {consultation.notes && (
                    <div className="text-gray-700 dark:text-gray-300 text-sm bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                      {consultation.notes}
                    </div>
                  )}
                </div>

                {/* Status Badge - Read Only */}
                <div className="ml-4">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    consultation.status === 'attended' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : consultation.status === 'no-show'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'  
                      : consultation.status === 'cancelled'
                      ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                  }`}>
                    {consultation.status === 'attended' ? 'Attended' :
                     consultation.status === 'no-show' ? 'No Show' :
                     consultation.status === 'cancelled' ? 'Cancelled' : 
                     'Scheduled'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TodayView;