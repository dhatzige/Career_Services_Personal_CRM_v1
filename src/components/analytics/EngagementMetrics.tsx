import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Award, UserCheck, Clock, Calendar, Target } from 'lucide-react';
import { Student } from '../../types/student';
import { format, differenceInDays, subDays } from 'date-fns';

interface EngagementMetricsProps {
  students: Student[];
  dateRange: { start: Date; end: Date };
}

interface EngagementLevel {
  level: 'highly-engaged' | 'engaged' | 'at-risk' | 'disengaged';
  color: string;
  bgColor: string;
  icon: React.FC<any>;
  description: string;
}

const ENGAGEMENT_LEVELS: Record<string, EngagementLevel> = {
  'highly-engaged': {
    level: 'highly-engaged',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/50',
    icon: Award,
    description: 'Regular consultations, high attendance'
  },
  'engaged': {
    level: 'engaged',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/50',
    icon: UserCheck,
    description: 'Active participation, good attendance'
  },
  'at-risk': {
    level: 'at-risk',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/50',
    icon: AlertCircle,
    description: 'Declining engagement or attendance issues'
  },
  'disengaged': {
    level: 'disengaged',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/50',
    icon: TrendingDown,
    description: 'No recent activity or high no-show rate'
  }
};

const EngagementMetrics: React.FC<EngagementMetricsProps> = ({ students, dateRange }) => {
  const engagementData = useMemo(() => {
    const studentEngagement = students.map(student => {
      // Get consultations in date range (protect against undefined)
      const consultationsInRange = (student.consultations || []).filter(c => {
        const date = new Date(c.date);
        return date >= dateRange.start && date <= dateRange.end;
      });

      // Calculate metrics
      const totalConsultations = consultationsInRange.length;
      const attendedConsultations = consultationsInRange.filter(c => c.status === 'attended').length;
      const noShowConsultations = consultationsInRange.filter(c => c.status === 'no-show').length;
      const attendanceRate = totalConsultations > 0 ? (attendedConsultations / totalConsultations) * 100 : 0;
      
      // Days since last consultation (protect against undefined)
      const lastConsultation = (student.consultations || [])
        .filter(c => c.status === 'attended')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      const daysSinceLastConsultation = lastConsultation 
        ? differenceInDays(new Date(), new Date(lastConsultation.date))
        : null;

      // Notes activity (protect against undefined)
      const recentNotes = (student.notes || []).filter(n => {
        const date = new Date(n.dateCreated);
        return date >= dateRange.start && date <= dateRange.end;
      }).length;

      // Determine engagement level
      let engagementLevel: string;
      if (totalConsultations >= 3 && attendanceRate >= 80 && recentNotes >= 2) {
        engagementLevel = 'highly-engaged';
      } else if (totalConsultations >= 2 && attendanceRate >= 60) {
        engagementLevel = 'engaged';
      } else if (totalConsultations >= 1 || (daysSinceLastConsultation && daysSinceLastConsultation <= 30)) {
        engagementLevel = 'at-risk';
      } else {
        engagementLevel = 'disengaged';
      }

      // Calculate engagement score (0-100)
      const consultationScore = Math.min(totalConsultations * 10, 30);
      const attendanceScore = (attendanceRate / 100) * 30;
      const activityScore = Math.min(recentNotes * 5, 20);
      const recencyScore = daysSinceLastConsultation 
        ? Math.max(0, 20 - (daysSinceLastConsultation / 7) * 5)
        : 0;
      
      const engagementScore = consultationScore + attendanceScore + activityScore + recencyScore;

      return {
        student,
        totalConsultations,
        attendedConsultations,
        noShowConsultations,
        attendanceRate,
        daysSinceLastConsultation,
        recentNotes,
        engagementLevel,
        engagementScore
      };
    });

    // Group by engagement level
    const grouped = {
      'highly-engaged': studentEngagement.filter(s => s.engagementLevel === 'highly-engaged'),
      'engaged': studentEngagement.filter(s => s.engagementLevel === 'engaged'),
      'at-risk': studentEngagement.filter(s => s.engagementLevel === 'at-risk'),
      'disengaged': studentEngagement.filter(s => s.engagementLevel === 'disengaged')
    };

    // Calculate trends (compare to previous period)
    const previousPeriodDays = differenceInDays(dateRange.end, dateRange.start);
    const previousStart = subDays(dateRange.start, previousPeriodDays);
    const previousEnd = dateRange.start;

    const previousEngagement = students.map(student => {
      const consultations = (student.consultations || []).filter(c => {
        const date = new Date(c.date);
        return date >= previousStart && date < previousEnd;
      });
      return consultations.filter(c => c.status === 'attended').length;
    });

    const currentEngagementTotal = studentEngagement.reduce((sum, s) => sum + s.attendedConsultations, 0);
    const previousEngagementTotal = previousEngagement.reduce((sum, count) => sum + count, 0);
    const engagementTrend = previousEngagementTotal > 0 
      ? ((currentEngagementTotal - previousEngagementTotal) / previousEngagementTotal) * 100
      : 0;

    const totalScore = studentEngagement.reduce((sum, s) => sum + s.engagementScore, 0);
    const averageScore = studentEngagement.length > 0 ? totalScore / studentEngagement.length : 0;

    return {
      byLevel: grouped,
      overall: studentEngagement,
      engagementTrend,
      averageScore
    };
  }, [students, dateRange]);

  return (
    <div className="space-y-6">
      {/* Overall Engagement Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Student Engagement Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(ENGAGEMENT_LEVELS).map(([key, level]) => {
            const count = engagementData.byLevel[key].length;
            const percentage = students.length > 0 ? (count / students.length) * 100 : 0;
            const Icon = level.icon;
            
            return (
              <div key={key} className={`${level.bgColor} rounded-lg p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`h-5 w-5 ${level.color}`} />
                  <span className={`text-2xl font-bold ${level.color}`}>
                    {count}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                  {key.replace('-', ' ')}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {percentage.toFixed(1)}% of students
                </p>
              </div>
            );
          })}
        </div>

        {/* Engagement Score */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Average Engagement Score</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {isNaN(engagementData.averageScore) ? '0.0' : engagementData.averageScore.toFixed(1)}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/100</span>
            </p>
          </div>
          <div className="text-right">
            <div className={`flex items-center ${engagementData.engagementTrend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {engagementData.engagementTrend >= 0 ? <TrendingUp className="h-5 w-5 mr-1" /> : <TrendingDown className="h-5 w-5 mr-1" />}
              <span className="text-lg font-medium">
                {isNaN(engagementData.engagementTrend) ? '0.0' : Math.abs(engagementData.engagementTrend).toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">vs previous period</p>
          </div>
        </div>
      </div>

      {/* At-Risk Students Alert */}
      {engagementData.byLevel['at-risk'].length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mr-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              At-Risk Students ({engagementData.byLevel['at-risk'].length})
            </h3>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            These students show signs of declining engagement and may need additional support.
          </p>
          <div className="space-y-3">
            {engagementData.byLevel['at-risk'].slice(0, 5).map(({ student, daysSinceLastConsultation, attendanceRate }) => (
              <div key={student.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {student.yearOfStudy} - {student.specificProgram}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {daysSinceLastConsultation ? `${daysSinceLastConsultation}d since last meeting` : 'No recent meetings'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {attendanceRate.toFixed(0)}% attendance rate
                  </p>
                </div>
              </div>
            ))}
            {engagementData.byLevel['at-risk'].length > 5 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                And {engagementData.byLevel['at-risk'].length - 5} more...
              </p>
            )}
          </div>
        </div>
      )}

      {/* High Performers */}
      {engagementData.byLevel['highly-engaged'].length > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Award className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Highly Engaged Students ({engagementData.byLevel['highly-engaged'].length})
            </h3>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            These students demonstrate excellent engagement and consistent participation.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {engagementData.byLevel['highly-engaged'].slice(0, 6).map(({ student, totalConsultations, engagementScore }) => (
              <div key={student.id} className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      {engagementScore.toFixed(0)}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {totalConsultations} consultations
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Engagement Factors */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Engagement Factors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {students.length > 0 
                ? (engagementData.overall.reduce((sum, s) => sum + s.totalConsultations, 0) / students.length).toFixed(1)
                : '0.0'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg consultations</p>
          </div>
          
          <div className="text-center">
            <Target className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {students.length > 0 
                ? (engagementData.overall.reduce((sum, s) => sum + s.attendanceRate, 0) / students.length).toFixed(0)
                : '0'}%
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg attendance</p>
          </div>
          
          <div className="text-center">
            <Clock className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {engagementData.overall.filter(s => s.daysSinceLastConsultation && s.daysSinceLastConsultation <= 14).length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Active last 2 weeks</p>
          </div>
          
          <div className="text-center">
            <UserCheck className="h-8 w-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {engagementData.overall.filter(s => s.recentNotes > 0).length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">With recent notes</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EngagementMetrics;