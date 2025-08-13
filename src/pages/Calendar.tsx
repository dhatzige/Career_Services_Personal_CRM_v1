import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, MapPin, Video, Phone, Users, ChevronRight, Search, Filter, ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  
  const MEETINGS_PER_PAGE = 10;

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

  // Filter meetings based on search and date filters
  const filteredMeetings = useMemo(() => {
    let filtered = [...upcomingMeetings];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(meeting => 
        meeting.student.name.toLowerCase().includes(query) ||
        meeting.student.email.toLowerCase().includes(query) ||
        meeting.type.toLowerCase().includes(query) ||
        meeting.location.toLowerCase().includes(query)
      );
    }
    
    // Apply date filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const monthFromNow = new Date(today);
    monthFromNow.setMonth(monthFromNow.getMonth() + 1);
    
    switch (dateFilter) {
      case 'today':
        filtered = filtered.filter(meeting => {
          const meetingDate = new Date(meeting.date);
          return meetingDate >= today && meetingDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
        });
        break;
      case 'week':
        filtered = filtered.filter(meeting => {
          const meetingDate = new Date(meeting.date);
          return meetingDate >= today && meetingDate < weekFromNow;
        });
        break;
      case 'month':
        filtered = filtered.filter(meeting => {
          const meetingDate = new Date(meeting.date);
          return meetingDate >= today && meetingDate < monthFromNow;
        });
        break;
    }
    
    return filtered;
  }, [upcomingMeetings, searchQuery, dateFilter]);

  // Group meetings by date
  const groupedMeetings = useMemo(() => {
    const groups: Record<string, Meeting[]> = {};
    
    filteredMeetings.forEach(meeting => {
      const dateKey = formatDate(meeting.date);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(meeting);
    });
    
    // Sort meetings within each group by time
    Object.keys(groups).forEach(date => {
      groups[date].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
    
    return groups;
  }, [filteredMeetings]);

  // Get paginated dates
  const paginatedData = useMemo(() => {
    const sortedDates = Object.keys(groupedMeetings).sort((a, b) => {
      const dateA = new Date(groupedMeetings[a][0].date);
      const dateB = new Date(groupedMeetings[b][0].date);
      return dateA.getTime() - dateB.getTime();
    });
    
    const totalMeetings = filteredMeetings.length;
    const totalPages = Math.ceil(totalMeetings / MEETINGS_PER_PAGE);
    
    // Calculate which meetings to show based on current page
    const startIndex = (currentPage - 1) * MEETINGS_PER_PAGE;
    const endIndex = startIndex + MEETINGS_PER_PAGE;
    
    let currentIndex = 0;
    const pageDates: string[] = [];
    const pageMeetings: Record<string, Meeting[]> = {};
    
    for (const date of sortedDates) {
      const dateMeetings = groupedMeetings[date];
      const dateStartIndex = currentIndex;
      const dateEndIndex = currentIndex + dateMeetings.length;
      
      // Check if this date's meetings fall within the current page range
      if (dateEndIndex > startIndex && dateStartIndex < endIndex) {
        pageDates.push(date);
        
        // Calculate which meetings from this date to include
        const meetingStartIndex = Math.max(0, startIndex - dateStartIndex);
        const meetingEndIndex = Math.min(dateMeetings.length, endIndex - dateStartIndex);
        
        pageMeetings[date] = dateMeetings.slice(meetingStartIndex, meetingEndIndex);
      }
      
      currentIndex += dateMeetings.length;
      
      if (currentIndex >= endIndex) break;
    }
    
    return {
      dates: pageDates,
      meetings: pageMeetings,
      totalPages,
      totalMeetings,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, totalMeetings)
    };
  }, [groupedMeetings, filteredMeetings, currentPage]);

  const toggleDateExpansion = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
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
          {/* Search and Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by student name, email, or meeting type..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1); // Reset to first page on search
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              {/* Date Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value as any);
                    setCurrentPage(1); // Reset to first page on filter change
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Upcoming</option>
                  <option value="today">Today</option>
                  <option value="week">Next 7 Days</option>
                  <option value="month">Next 30 Days</option>
                </select>
              </div>
            </div>
            
            {/* Results Summary */}
            {(searchQuery || dateFilter !== 'all') && (
              <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                Showing {paginatedData.totalMeetings} meeting{paginatedData.totalMeetings !== 1 ? 's' : ''}
                {searchQuery && ` matching "${searchQuery}"`}
                {dateFilter !== 'all' && ` in ${dateFilter === 'today' ? 'today' : dateFilter === 'week' ? 'the next 7 days' : 'the next 30 days'}`}
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchQuery || dateFilter !== 'all' ? 'No Meetings Found' : 'No Upcoming Meetings'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchQuery || dateFilter !== 'all' 
                  ? 'Try adjusting your search or filters.'
                  : "You don't have any scheduled meetings coming up."}
              </p>
              {(searchQuery || dateFilter !== 'all') ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setDateFilter('all');
                  }}
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  Clear Filters
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => setActiveTab('schedule')}
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  Schedule a Meeting
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Meetings grouped by date */}
              <div className="space-y-4">
                {paginatedData.dates.map((date) => {
                  const dateMeetings = paginatedData.meetings[date];
                  const isExpanded = expandedDates.has(date) || dateMeetings.length <= 3;
                  const displayMeetings = isExpanded ? dateMeetings : dateMeetings.slice(0, 3);
                  
                  return (
                    <div key={date} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                      {/* Date Header */}
                      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-gray-500" />
                            <h3 className="font-semibold text-gray-900 dark:text-white">{date}</h3>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              ({dateMeetings.length} meeting{dateMeetings.length !== 1 ? 's' : ''})
                            </span>
                          </div>
                          {dateMeetings.length > 3 && (
                            <button
                              onClick={() => toggleDateExpansion(date)}
                              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                            >
                              {isExpanded ? 'Show Less' : `Show ${dateMeetings.length - 3} More`}
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Meetings for this date */}
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {displayMeetings.map((meeting) => (
                          <div key={meeting.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {formatTime(meeting.date)}
                                  </span>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-gray-700 dark:text-gray-300">
                                    {meeting.type}
                                  </span>
                                  <span className={`ml-auto px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(meeting.status)}`}>
                                    {meeting.status}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    <span>{meeting.student.name}</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>{meeting.duration} minutes</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    {getLocationIcon(meeting.location)}
                                    <span>{meeting.location}</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <a 
                                      href={`mailto:${meeting.student.email}`}
                                      className="text-blue-600 hover:text-blue-700"
                                    >
                                      {meeting.student.email}
                                    </a>
                                  </div>
                                </div>
                                
                                {meeting.notes && (
                                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                                      {meeting.notes}
                                    </p>
                                  </div>
                                )}
                              </div>
                              
                              <div className="ml-4 flex-shrink-0">
                                <a
                                  href={`/students/${meeting.student.id}`}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                  View
                                  <ChevronRight className="h-3 w-3" />
                                </a>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Pagination */}
              {paginatedData.totalPages > 1 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Showing {paginatedData.startIndex} to {paginatedData.endIndex} of {paginatedData.totalMeetings} meetings
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, paginatedData.totalPages) }, (_, i) => {
                          let pageNum;
                          if (paginatedData.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= paginatedData.totalPages - 2) {
                            pageNum = paginatedData.totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                currentPage === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === paginatedData.totalPages}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
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