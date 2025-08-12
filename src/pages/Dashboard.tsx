import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, TrendingUp, Calendar, AlertCircle, Clock, CheckCircle, FileText, Sparkles, Plus, Database } from 'lucide-react';
import api from '../services/api';
import DashboardCharts from '../components/DashboardCharts';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // Debug navigation
  const handleNavigate = (path: string) => {
    console.log('Navigating to:', path);
    navigate(path);
  };
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats from backend API
      const statsResponse = await api.get('/dashboard/stats');
      
      if (statsResponse.success && statsResponse.stats) {
        // Transform the API stats to match the component's expected format
        const apiStats = statsResponse.stats;
        setStats({
          totalStudents: apiStats.totalStudents || 0,
          activeStudents: apiStats.activeStudents || 0,
          totalConsultations: apiStats.totalConsultations || 0,
          consultationsThisMonth: apiStats.monthlyConsultations || 0,
          pendingFollowUps: apiStats.pendingFollowUps || 0,
          totalNoShows: 0, // Not provided by current API
          studentsWithNoShows: 0, // Not provided by current API
          highNoShowStudents: [] // Not provided by current API
        });
      }
      
      // Fetch students list separately if needed for charts
      const studentsResponse = await api.students.list();
      // API returns the array directly, not wrapped in an object
      if (Array.isArray(studentsResponse)) {
        setStudents(studentsResponse);
      } else if (studentsResponse?.success && studentsResponse?.data) {
        // Fallback for wrapped response format
        setStudents(studentsResponse.data || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set default empty stats to avoid undefined errors
      setStats({
        totalStudents: 0,
        activeStudents: 0,
        totalConsultations: 0,
        consultationsThisMonth: 0,
        pendingFollowUps: 0,
        totalNoShows: 0,
        studentsWithNoShows: 0,
        highNoShowStudents: []
      });
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAIReport = async () => {
    if (!stats || !students) return;
    
    setGeneratingReport(true);
    try {
      // Prepare data for AI report generation
      const monthlyData = {
        totalStudents: stats.totalStudents,
        activeStudents: stats.activeStudents,
        consultationsThisMonth: stats.consultationsThisMonth,
        pendingFollowUps: stats.pendingFollowUps,
        averageAttendanceRate: stats.averageAttendanceRate || 0,
        upcomingConsultations: stats.upcomingConsultations || 0
      };

      // Get recent consultations data
      const consultationsResponse = await api.get('/consultations', {
        params: { limit: 50 }
      });

      // Calculate trends
      const trends = {
        studentGrowth: stats.newStudentsThisMonth || 0,
        consultationTrend: stats.consultationsThisMonth > (stats.consultationsLastMonth || 0) ? 'increasing' : 'decreasing',
        engagementRate: stats.activeStudents / stats.totalStudents
      };

      // Call AI API to generate report
      const response = await api.post('/ai/dashboard-report', {
        monthlyData,
        students: students.slice(0, 20), // Send sample of students
        consultations: consultationsResponse.data || [],
        trends
      });

      if (response.success && response.report) {
        setAiReport(response.report);
      } else {
        // Fallback to basic report if AI fails
        setAiReport(`## Monthly Summary
        
Total Students: ${stats.totalStudents}
Active Students: ${stats.activeStudents}
Consultations This Month: ${stats.consultationsThisMonth}
Pending Follow-ups: ${stats.pendingFollowUps}

### Insights
- ${stats.activeStudents} out of ${stats.totalStudents} students are actively engaged (${Math.round((stats.activeStudents/stats.totalStudents) * 100)}%)
- ${stats.consultationsThisMonth} consultations conducted this month
- ${stats.pendingFollowUps} follow-ups need attention

*Generated with basic analytics. Configure Claude API for advanced insights.*`);
      }
    } catch (error) {
      console.error('Failed to generate AI report:', error);
      // Fallback report on error
      setAiReport(`## Monthly Summary
      
Total Students: ${stats.totalStudents}
Active Students: ${stats.activeStudents}
Consultations This Month: ${stats.consultationsThisMonth}
Pending Follow-ups: ${stats.pendingFollowUps}

### Quick Insights
- Engagement Rate: ${Math.round((stats.activeStudents/stats.totalStudents) * 100)}%
- Monthly consultations: ${stats.consultationsThisMonth}
- Requires attention: ${stats.pendingFollowUps} follow-ups

*Note: AI analysis temporarily unavailable.*`);
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!stats || students.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's what's happening with your students.</p>
          </div>
        </div>

        {/* Empty State */}
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <Users className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No students yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Get started by adding your first student to see dashboard analytics.
          </p>
          <button
            onClick={() => handleNavigate('/students')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Student
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    { 
      name: 'Total Students', 
      value: stats.totalStudents.toString(), 
      icon: Users, 
      change: `${stats.activeStudents} active`, 
      changeType: 'neutral',
      color: 'blue'
    },
    { 
      name: 'This Month', 
      value: stats.consultationsThisMonth.toString(), 
      icon: Calendar, 
      change: `${stats.totalConsultations} total`, 
      changeType: 'increase',
      color: 'green'
    },
    { 
      name: 'Pending Follow-ups', 
      value: stats.pendingFollowUps.toString(), 
      icon: Clock, 
      change: 'Require attention', 
      changeType: stats.pendingFollowUps > 0 ? 'decrease' : 'neutral',
      color: stats.pendingFollowUps > 0 ? 'yellow' : 'gray'
    },
    { 
      name: 'Recent Notes', 
      value: (stats.recentNotes || 0).toString(), 
      icon: BookOpen, 
      change: 'Last 7 days', 
      changeType: 'neutral',
      color: 'purple'
    },
    {
      name: 'Active Students',
      value: stats.activeStudents.toString(),
      icon: CheckCircle,
      change: stats.totalStudents > 0 ? `${Math.round((stats.activeStudents / stats.totalStudents) * 100)}% of total` : '0% of total',
      changeType: 'neutral',
      color: 'green'
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
      yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
      purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
      gray: 'bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400',
      red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's what's happening with your students.</p>
        </div>
        <button
          onClick={handleGenerateAIReport}
          disabled={generatingReport || !students.length}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {generatingReport ? 'Generating...' : 'Generate AI Report'}
        </button>
      </div>


      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        {stat.name}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                          {stat.value}
                        </div>
                      </dd>
                      <dd className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {stat.change}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Report */}
      {aiReport && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800 p-6">
          <div className="flex items-center mb-4">
            <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">AI-Generated Monthly Report</h2>
          </div>
          <div className="prose dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
              {aiReport}
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <DashboardCharts students={students} />

      {/* High No-Show Alert */}
      {/* High no-show students section - temporarily disabled */}

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button 
              onClick={() => handleNavigate('/students')}
              className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/70 transition-colors group"
            >
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Add New Student</span>
            </button>
            <button className="flex items-center p-4 bg-green-50 dark:bg-green-900/50 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/70 transition-colors group">
              <FileText className="h-6 w-6 text-green-600 dark:text-green-400 mr-3 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Quick Note</span>
            </button>
            <button className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/50 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/70 transition-colors group">
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-3 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">View Reports</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activities</h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {students.slice(0, 5).map((student, index) => (
            <div key={student.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {student.firstName} {student.lastName}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {student.consultations && student.consultations.length > 0 
                        ? `Last consultation: ${student.consultations[student.consultations.length - 1].type}`
                        : 'New student added'
                      }
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {student.lastInteraction 
                    ? new Date(student.lastInteraction).toLocaleDateString()
                    : new Date(student.dateAdded).toLocaleDateString()
                  }
                </div>
              </div>
            </div>
          ))}
          {students.length === 0 && (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No recent activities</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;