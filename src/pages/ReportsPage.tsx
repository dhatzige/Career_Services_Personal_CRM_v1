import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { 
  FileText, 
  Download, 
  Mail, 
  Calendar,
  TrendingUp,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3
} from 'lucide-react';
import { api } from '../services/apiClient';
import { toast } from '../components/ui/toast';

interface DailySummary {
  date: string;
  displayDate: string;
  consultations: {
    total: number;
    attended: number;
    noShows: number;
    cancelled: number;
    rescheduled: number;
    pending: number;
    attendanceRate: string;
  };
  byAdvisor: Array<{
    advisor: string;
    total: number;
    attended: number;
    noShows: number;
  }>;
  notesCreated: number;
  studentsWithNoShowsToday: Array<{
    id: string;
    name: string;
    email: string;
    noShowCount: number;
  }>;
}

interface WeeklyMetrics {
  weekOf: string;
  summary: {
    totalConsultations: number;
    totalAttended: number;
    totalNoShows: number;
    totalCancelled: number;
    totalNotes?: number;
    totalNotesCreated?: number;
    activeStudents?: number;
    uniqueStudentsSeen?: number;
    attendanceRate: string;
  };
  dailyMetrics?: Array<{
    date: string;
    dayName: string;
    consultations: {
      total: number;
      attended: number;
      noShows: number;
    };
    notes: number;
  }>;
  dailyBreakdown?: Array<{
    date: string;
    displayDate: string;
    total: number;
    attended: number;
    noShows: number;
  }>;
  consultationTypes?: Array<{ type: string; count: number }> | { [key: string]: number };
  studentEngagement?: {
    highEngagement: number;
    mediumEngagement: number;
    lowEngagement: number;
    noEngagement: number;
  };
  topicsDiscussed?: Array<string>;
  highNoShowStudents?: Array<{
    id: string;
    name: string;
    email: string;
    noShowCount: number;
    lastNoShowDate?: string;
  }>;
}

const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [weeklyMetrics, setWeeklyMetrics] = useState<WeeklyMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');

  // Fetch daily summary
  const fetchDailySummary = async (date: Date) => {
    try {
      setLoading(true);
      const response = await api.get('/reports/daily-summary', {
        params: { date: date.toISOString() }
      });
      setDailySummary(response.data);
    } catch (error) {
      console.error('Error fetching daily summary:', error);
      toast.error('Failed to load daily summary');
    } finally {
      setLoading(false);
    }
  };

  // Fetch weekly metrics
  const fetchWeeklyMetrics = async (date: Date) => {
    try {
      setLoading(true);
      const weekStart = startOfWeek(date);
      const response = await api.get('/reports/weekly-metrics', {
        params: { startDate: weekStart.toISOString() }
      });
      setWeeklyMetrics(response.data);
    } catch (error) {
      console.error('Error fetching weekly metrics:', error);
      toast.error('Failed to load weekly metrics');
    } finally {
      setLoading(false);
    }
  };

  // Send daily summary email
  const sendDailyEmail = async () => {
    if (!emailRecipient) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      setSendingEmail(true);
      await api.post('/reports/send-daily-email', {
        recipientEmail: emailRecipient,
        date: selectedDate.toISOString()
      });
      toast.success('Daily summary email sent successfully');
      setEmailRecipient('');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  // Export data
  const exportData = async (type: 'consultations' | 'students' | 'weekly-metrics') => {
    try {
      const response = await api.get('/reports/export', {
        params: { 
          type,
          format: 'csv',
          startDate: type === 'weekly-metrics' ? startOfWeek(selectedDate).toISOString() : undefined
        },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Export downloaded successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  useEffect(() => {
    if (activeTab === 'daily') {
      fetchDailySummary(selectedDate);
    } else {
      fetchWeeklyMetrics(selectedDate);
    }
  }, [activeTab, selectedDate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              View daily summaries and weekly metrics
            </p>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(parseISO(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('daily')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'daily'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Daily Summary
            </div>
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'weekly'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Weekly Metrics
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : activeTab === 'daily' && dailySummary ? (
        <div className="space-y-6">
          {/* Daily Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Consultations</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {dailySummary.consultations.total}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Attended</p>
                  <p className="text-2xl font-bold text-green-600">
                    {dailySummary.consultations.attended}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">No-Shows</p>
                  <p className="text-2xl font-bold text-red-600">
                    {dailySummary.consultations.noShows}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Attendance Rate</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {dailySummary.consultations.attendanceRate}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </div>

          {/* By Advisor */}
          {dailySummary.byAdvisor.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                By Advisor
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Advisor
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attended
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        No-Shows
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {dailySummary.byAdvisor.map((advisor, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {advisor.advisor}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">
                          {advisor.total}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-green-600">
                          {advisor.attended}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-red-600">
                          {advisor.noShows}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Email Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Send Daily Summary
            </h3>
            <div className="flex gap-4">
              <input
                type="email"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                placeholder="Enter email address"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={sendDailyEmail}
                disabled={sendingEmail}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg
                         hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              >
                <Mail className="w-4 h-4" />
                {sendingEmail ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>

          {/* Export Options */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Export Data
            </h3>
            <div className="flex gap-4">
              <button
                onClick={() => exportData('consultations')}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600
                         rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Consultations
              </button>
              <button
                onClick={() => exportData('students')}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600
                         rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Students
              </button>
            </div>
          </div>
        </div>
      ) : activeTab === 'weekly' && weeklyMetrics ? (
        <div className="space-y-6">
          {/* Weekly Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Consultations</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {weeklyMetrics.summary.totalConsultations}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Students</p>
                  <p className="text-2xl font-bold text-green-600">
                    {weeklyMetrics.summary.activeStudents || weeklyMetrics.summary.uniqueStudentsSeen || 0}
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Notes</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {weeklyMetrics.summary.totalNotes || weeklyMetrics.summary.totalNotesCreated || 0}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Attendance Rate</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {weeklyMetrics.summary.attendanceRate}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </div>

          {/* Daily Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Daily Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Day
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attended
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No-Shows
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {(weeklyMetrics.dailyBreakdown || weeklyMetrics.dailyMetrics || []).map((day, index) => (
                    <tr key={index} className={day.date === format(new Date(), 'yyyy-MM-dd') ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {day.dayName || day.displayDate || day.date}
                        {day.date === format(new Date(), 'yyyy-MM-dd') && (
                          <span className="ml-2 text-xs text-blue-600">(Today)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">
                        {day.consultations?.total || day.total || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-green-600">
                        {day.consultations?.attended || day.attended || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-red-600">
                        {day.consultations?.noShows || day.noShows || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-purple-600">
                        {day.notes || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Consultation Types */}
          {((Array.isArray(weeklyMetrics.consultationTypes) && weeklyMetrics.consultationTypes.length > 0) || 
            (weeklyMetrics.consultationTypes && typeof weeklyMetrics.consultationTypes === 'object' && Object.keys(weeklyMetrics.consultationTypes).length > 0)) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Consultation Types
              </h3>
              <div className="space-y-3">
                {(Array.isArray(weeklyMetrics.consultationTypes) 
                  ? weeklyMetrics.consultationTypes 
                  : Object.entries(weeklyMetrics.consultationTypes || {}).map(([type, count]) => ({ type, count }))
                ).map((type, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-900 dark:text-white">{type.type}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ 
                            width: `${(type.count / weeklyMetrics.summary.totalConsultations) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                        {type.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* High No-Show Students */}
          {weeklyMetrics.highNoShowStudents && weeklyMetrics.highNoShowStudents.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Students Requiring Attention
                </h3>
              </div>
              <div className="space-y-3">
                {weeklyMetrics.highNoShowStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 
                                                   border border-red-200 dark:border-red-900 
                                                   rounded-lg bg-red-50 dark:bg-red-900/20">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{student.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">{student.noShowCount}</p>
                      <p className="text-xs text-gray-500">no-shows</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Export Weekly Report */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Export Weekly Report
            </h3>
            <button
              onClick={() => exportData('weekly-metrics')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg
                       hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Weekly Report (CSV)
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <p className="text-gray-600 dark:text-gray-400 text-center">
            No data available for the selected date range. Try selecting a different date.
          </p>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;