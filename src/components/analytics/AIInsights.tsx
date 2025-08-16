import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, TrendingDown, AlertCircle, Target, Users, Calendar, RefreshCw } from 'lucide-react';
import { Student } from '../../types/student';
import { format } from 'date-fns';
import api from '../../services/api';

interface AIInsightsProps {
  students: Student[];
  dateRange: { start: Date; end: Date; label: string };
  metrics: any;
}

interface Insight {
  type: 'success' | 'warning' | 'info' | 'trend';
  title: string;
  description: string;
  icon: React.FC<any>;
  action?: string;
}

const AIInsights: React.FC<AIInsightsProps> = ({ students, dateRange, metrics }) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiGenerated, setAiGenerated] = useState<string | null>(null);

  // Generate rule-based insights
  useEffect(() => {
    const generatedInsights: Insight[] = [];

    // High no-show rate insight
    if (metrics.noShowRate > 15) {
      generatedInsights.push({
        type: 'warning',
        title: 'High No-Show Rate Detected',
        description: `${metrics.noShowRate.toFixed(1)}% of consultations are no-shows. Consider implementing reminder systems or investigating scheduling conflicts.`,
        icon: AlertCircle,
        action: 'Review no-show patterns'
      });
    }

    // Low engagement insight
    const lowEngagementPercent = (students.filter(s => {
      const recentConsultations = s.consultations.filter(c => {
        const date = new Date(c.date);
        return date >= dateRange.start && date <= dateRange.end;
      }).length;
      return recentConsultations === 0;
    }).length / students.length) * 100;

    if (lowEngagementPercent > 30) {
      generatedInsights.push({
        type: 'warning',
        title: 'Low Student Engagement',
        description: `${lowEngagementPercent.toFixed(0)}% of students haven't had consultations in ${dateRange.label.toLowerCase()}. Consider outreach campaigns.`,
        icon: Users,
        action: 'Launch engagement campaign'
      });
    }

    // Program performance insight
    if (metrics.topProgram) {
      generatedInsights.push({
        type: 'success',
        title: 'Top Performing Program',
        description: `${metrics.topProgram} shows the highest consultation volume. Share best practices from this program with others.`,
        icon: TrendingUp,
        action: 'Analyze success factors'
      });
    }

    // Consultation pattern insight
    const avgConsultationsPerWeek = metrics.totalConsultations / ((dateRange.end.getTime() - dateRange.start.getTime()) / (7 * 24 * 60 * 60 * 1000));
    if (avgConsultationsPerWeek > 50) {
      generatedInsights.push({
        type: 'info',
        title: 'High Consultation Volume',
        description: `Averaging ${avgConsultationsPerWeek.toFixed(0)} consultations per week. Ensure advisors have adequate support and resources.`,
        icon: Calendar,
        action: 'Review advisor workload'
      });
    }

    // Attendance improvement
    if (metrics.attendanceRate > 85) {
      generatedInsights.push({
        type: 'success',
        title: 'Excellent Attendance Rate',
        description: `${metrics.attendanceRate.toFixed(1)}% attendance rate shows strong student commitment. Maintain current practices.`,
        icon: Target,
        action: 'Document best practices'
      });
    }

    // Highly engaged students
    if (metrics.highEngagementStudents > metrics.totalStudents * 0.2) {
      generatedInsights.push({
        type: 'success',
        title: 'Strong Core Engagement',
        description: `${((metrics.highEngagementStudents / metrics.totalStudents) * 100).toFixed(0)}% of students are highly engaged with 3+ consultations.`,
        icon: Users,
        action: 'Leverage peer mentoring'
      });
    }

    setInsights(generatedInsights);
  }, [students, dateRange, metrics]);

  const generateAIInsights = async () => {
    setLoading(true);
    try {
      const analyticsData = {
        dateRange: {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
          label: dateRange.label
        },
        metrics,
        studentCount: students.length,
        consultationTypes: students.flatMap(s => s.consultations)
          .filter(c => {
            const date = new Date(c.date);
            return date >= dateRange.start && date <= dateRange.end;
          })
          .reduce((acc, c) => {
            acc[c.type] = (acc[c.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        programDistribution: students.reduce((acc, s) => {
          acc[s.specificProgram] = (acc[s.specificProgram] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      const response = await api.post('/ai/analytics-insights', analyticsData);
      setAiGenerated(response.data.insights);
    } catch (error) {
      console.error('Failed to generate AI insights:', error);
      // Fallback insights
      setAiGenerated(`Based on the data analysis for ${dateRange.label}:

1. **Consultation Patterns**: Your center is handling ${metrics.totalConsultations} consultations with ${metrics.attendanceRate.toFixed(1)}% attendance rate.

2. **Student Engagement**: ${metrics.highEngagementStudents} students show high engagement levels, while ${metrics.totalStudents - metrics.activeStudents} students may need additional outreach.

3. **Program Analysis**: ${metrics.topProgram} is your most active program. Consider replicating its engagement strategies across other programs.

4. **Recommendations**:
   - Focus on re-engaging inactive students through targeted campaigns
   - Implement automated reminder systems to reduce no-shows
   - Schedule regular check-ins for at-risk students
   - Celebrate and showcase highly engaged students as peer mentors`);
    } finally {
      setLoading(false);
    }
  };

  const getInsightStyles = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
          icon: 'text-green-600 dark:text-green-400',
          title: 'text-green-900 dark:text-green-100'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
          icon: 'text-yellow-600 dark:text-yellow-400',
          title: 'text-yellow-900 dark:text-yellow-100'
        };
      case 'info':
        return {
          container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
          icon: 'text-blue-600 dark:text-blue-400',
          title: 'text-blue-900 dark:text-blue-100'
        };
      case 'trend':
        return {
          container: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
          icon: 'text-purple-600 dark:text-purple-400',
          title: 'text-purple-900 dark:text-purple-100'
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Rule-based Insights */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Key Insights</h3>
          </div>
          <button
            onClick={generateAIInsights}
            disabled={loading}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate AI Analysis
              </>
            )}
          </button>
        </div>

        <div className="space-y-3">
          {insights.map((insight, index) => {
            const styles = getInsightStyles(insight.type);
            const Icon = insight.icon;
            
            return (
              <div key={index} className={`border rounded-lg p-4 ${styles.container}`}>
                <div className="flex items-start">
                  <Icon className={`h-5 w-5 ${styles.icon} mr-3 mt-0.5`} />
                  <div className="flex-1">
                    <h4 className={`font-medium ${styles.title}`}>{insight.title}</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      {insight.description}
                    </p>
                    {insight.action && (
                      <button className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline mt-2">
                        {insight.action} →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI-Generated Insights */}
      {aiGenerated && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800 p-6">
          <div className="flex items-center mb-4">
            <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">AI-Powered Analysis</h3>
          </div>
          <div className="prose dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
              {aiGenerated}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-700">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Generated on {format(new Date(), 'MMM dd, yyyy \'at\' h:mm a')} • Based on {metrics.totalStudents} students and {metrics.totalConsultations} consultations
            </p>
          </div>
        </div>
      )}

      {/* Removed Recommended Actions section per user request */}
    </div>
  );
};

export default AIInsights;