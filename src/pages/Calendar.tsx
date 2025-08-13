import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Video, Phone, Users, ChevronRight } from 'lucide-react';
// import PageHeader from '../components/PageHeader';
import CalendlyEmbed from '../components/calendar/CalendlyEmbed';
import api from '../services/api';
import { toast } from '../components/ui/toast';
import { useAuth } from '../contexts/CleanSupabaseAuth';

interface Meeting {
  id: string;
  date: string;
  duration: number;
  type: string;
  location: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
  status: string;
  notes?: string;
}

export default function CalendarPage() {
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'schedule' | 'upcoming'>('upcoming');
  const { user } = useAuth();

  useEffect(() => {
    loadUpcomingMeetings();
  }, []);

  const loadUpcomingMeetings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/calendar/meetings/upcoming');
      // The api.get already returns res.data, and backend sends { success: true, data: meetings }
      // So response is the full object with success and data properties
      setUpcomingMeetings(response?.data || response || []);
    } catch (error) {
      console.error('Failed to load meetings:', error);
      // Don't show error toast for now, just set empty meetings
      setUpcomingMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  const getLocationIcon = (location: string) => {
    if (location.toLowerCase().includes('online') || location.toLowerCase().includes('zoom')) {
      return <Video className="h-4 w-4" />;
    } else if (location.toLowerCase().includes('phone')) {
      return <Phone className="h-4 w-4" />;
    } else {
      return <MapPin className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'no_show':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendar & Scheduling</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">Manage your appointments and schedule meetings with students</p>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upcoming'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Upcoming Meetings
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'schedule'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Schedule New Meeting
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'upcoming' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : upcomingMeetings.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Upcoming Meetings
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You don't have any scheduled meetings coming up.
              </p>
              <button
                onClick={() => setActiveTab('schedule')}
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                Schedule a Meeting
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {upcomingMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {meeting.type}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(meeting.status)}`}>
                          {meeting.status}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{meeting.student.name}</span>
                          <span className="text-gray-400">•</span>
                          <a 
                            href={`mailto:${meeting.student.email}`}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            {meeting.student.email}
                          </a>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(meeting.date)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{formatTime(meeting.date)} ({meeting.duration} minutes)</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getLocationIcon(meeting.location)}
                          <span>{meeting.location}</span>
                        </div>
                      </div>
                      
                      {meeting.notes && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {meeting.notes}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4">
                      <a
                        href={`/students/${meeting.student.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        View Student
                        <ChevronRight className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <CalendlyEmbed
            onEventScheduled={() => {
              toast.success('Meeting scheduled successfully!');
              setActiveTab('upcoming');
              loadUpcomingMeetings();
            }}
          />
        </div>
      )}
    </div>
  );
}