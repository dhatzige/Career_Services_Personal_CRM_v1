import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  BarChart, 
  Briefcase, 
  Users, 
  Video, 
  FileText, 
  Building2, 
  Calendar, 
  TrendingUp, 
  Clock, 
  Target,
  Award,
  AlertCircle,
  ChevronRight,
  Activity
} from 'lucide-react';
import api from '../../services/api';
import { toast } from '../ui/toast';

interface DashboardStats {
  applications: {
    total: number;
    active: number;
    interviews: number;
    offers: number;
  };
  workshops: {
    total: number;
    attended: number;
    totalHours: number;
    upcoming: number;
  };
  mockInterviews: {
    total: number;
    averageRating: number;
    improvement: number;
    scheduled: number;
  };
  documents: {
    total: number;
    active: number;
    needsReview: number;
    approved: number;
  };
  connections: {
    total: number;
    strong: number;
    followUps: number;
    referralPotential: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'application' | 'workshop' | 'interview' | 'document' | 'connection';
  title: string;
  description: string;
  date: string;
  status?: string;
}

export function CareerDashboard() {
  const { studentId } = useParams();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [studentId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // If no studentId, fetch overall stats instead
      const baseUrl = studentId ? `/career` : '/career';
      const studentPath = studentId ? `/student/${studentId}` : '/all';
      
      // Fetch all stats in parallel
      const [
        applicationsRes,
        workshopsRes,
        interviewsRes,
        documentsRes,
        connectionsRes
      ] = await Promise.all([
        api.get(`${baseUrl}/applications${studentPath}`).catch(() => ({ data: { data: [] } })),
        api.get(`${baseUrl}/workshops${studentPath}`).catch(() => ({ data: { data: [] } })),
        api.get(`${baseUrl}/mock-interviews${studentPath}`).catch(() => ({ data: { data: [] } })),
        api.get(`${baseUrl}/documents${studentPath}`).catch(() => ({ data: { data: [] } })),
        api.get(`${baseUrl}/employer-connections${studentPath}`).catch(() => ({ data: { data: [] } }))
      ]);

      // Process applications stats
      const applications = applicationsRes.data.data;
      const applicationStats = {
        total: applications.length,
        active: applications.filter((a: any) => ['Applied', 'Phone Screen', 'Interview Scheduled', 'Interviewed'].includes(a.status)).length,
        interviews: applications.filter((a: any) => ['Interview Scheduled', 'Interviewed'].includes(a.status)).length,
        offers: applications.filter((a: any) => a.status === 'Offer').length
      };

      // Process workshops stats
      const workshops = workshopsRes.data.data;
      const today = new Date().toISOString().split('T')[0];
      const workshopStats = {
        total: workshops.length,
        attended: workshops.filter((w: any) => w.attendance_status === 'attended').length,
        totalHours: workshops
          .filter((w: any) => w.attendance_status === 'attended')
          .reduce((sum: number, w: any) => sum + w.duration_hours, 0),
        upcoming: workshops.filter((w: any) => w.workshop_date >= today && w.attendance_status === 'registered').length
      };

      // Process mock interviews stats
      const interviews = interviewsRes.data.data;
      const avgRating = interviews.length > 0
        ? interviews.reduce((sum: number, i: any) => sum + i.overall_rating, 0) / interviews.length
        : 0;
      const improvement = calculateImprovement(interviews);
      const interviewStats = {
        total: interviews.length,
        averageRating: parseFloat(avgRating.toFixed(1)),
        improvement,
        scheduled: 0 // Would need a scheduled field in the data model
      };

      // Process documents stats
      const documents = documentsRes.data.data;
      const documentStats = {
        total: documents.length,
        active: documents.filter((d: any) => d.is_active).length,
        needsReview: documents.filter((d: any) => d.review_status === 'pending').length,
        approved: documents.filter((d: any) => d.review_status === 'approved').length
      };

      // Process connections stats
      const connections = connectionsRes.data.data;
      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const connectionStats = {
        total: connections.length,
        strong: connections.filter((c: any) => c.relationship_strength === 'strong').length,
        followUps: connections.filter((c: any) => {
          if (!c.follow_up_date) return false;
          const followUp = new Date(c.follow_up_date);
          return followUp >= new Date() && followUp <= weekFromNow;
        }).length,
        referralPotential: connections.filter((c: any) => c.referral_potential).length
      };

      setStats({
        applications: applicationStats,
        workshops: workshopStats,
        mockInterviews: interviewStats,
        documents: documentStats,
        connections: connectionStats
      });

      // Generate recent activities
      const activities: RecentActivity[] = [];
      
      // Add recent applications
      applications.slice(0, 3).forEach((app: any) => {
        activities.push({
          id: app.id,
          type: 'application',
          title: app.position_title,
          description: `${app.company_name} - ${app.status}`,
          date: app.application_date,
          status: app.status
        });
      });

      // Add recent workshops
      workshops.slice(0, 2).forEach((workshop: any) => {
        activities.push({
          id: workshop.id,
          type: 'workshop',
          title: workshop.workshop_name,
          description: `${workshop.presenter} - ${workshop.attendance_status}`,
          date: workshop.workshop_date,
          status: workshop.attendance_status
        });
      });

      // Add recent interviews
      interviews.slice(0, 2).forEach((interview: any) => {
        activities.push({
          id: interview.id,
          type: 'interview',
          title: `Mock Interview - ${interview.position_type}`,
          description: `${interview.interview_type} - Rating: ${interview.overall_rating}/5`,
          date: interview.interview_date
        });
      });

      // Sort by date
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivities(activities.slice(0, 5));

      // Get upcoming events
      const upcoming = [];
      
      // Add upcoming workshops
      workshops
        .filter((w: any) => w.workshop_date >= today && w.attendance_status === 'registered')
        .forEach((w: any) => {
          upcoming.push({
            type: 'workshop',
            title: w.workshop_name,
            date: w.workshop_date,
            time: w.duration_hours + ' hours'
          });
        });

      // Add follow-ups
      connections
        .filter((c: any) => c.follow_up_date && c.follow_up_date >= today)
        .forEach((c: any) => {
          upcoming.push({
            type: 'follow-up',
            title: `Follow up with ${c.contact_name}`,
            date: c.follow_up_date,
            company: c.company_name
          });
        });

      // Add interviews from applications
      applications
        .filter((a: any) => a.interview_dates && a.status === 'Interview Scheduled')
        .forEach((a: any) => {
          upcoming.push({
            type: 'interview',
            title: `Interview at ${a.company_name}`,
            date: today, // Would need actual interview date
            position: a.position_title
          });
        });

      upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setUpcomingEvents(upcoming.slice(0, 5));

    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateImprovement = (interviews: any[]) => {
    if (interviews.length < 2) return 0;
    const sorted = [...interviews].sort((a, b) => 
      new Date(b.interview_date).getTime() - new Date(a.interview_date).getTime()
    );
    const recent = sorted.slice(0, 3).reduce((sum, i) => sum + i.overall_rating, 0) / Math.min(3, sorted.length);
    const older = sorted.slice(-3).reduce((sum, i) => sum + i.overall_rating, 0) / Math.min(3, sorted.length);
    return parseFloat(((recent - older) / older * 100).toFixed(0));
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'application': return <Briefcase className="h-4 w-4" />;
      case 'workshop': return <Users className="h-4 w-4" />;
      case 'interview': return <Video className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'connection': return <Building2 className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading career dashboard...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">No data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-6 w-6" />
            Career Services Dashboard {!studentId && '- Overview'}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Briefcase className="h-8 w-8 text-blue-500" />
              <span className="text-3xl font-bold">{stats.applications.active}</span>
            </div>
            <div className="text-sm font-medium">Active Applications</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{stats.applications.total} total</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-8 w-8 text-green-500" />
              <span className="text-3xl font-bold">{stats.applications.interviews}</span>
            </div>
            <div className="text-sm font-medium">Interviews</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{stats.applications.offers} offers</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-8 w-8 text-purple-500" />
              <span className="text-3xl font-bold">{stats.workshops.totalHours}h</span>
            </div>
            <div className="text-sm font-medium">Workshop Hours</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{stats.workshops.attended} attended</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Award className="h-8 w-8 text-yellow-500" />
              <span className="text-3xl font-bold">{stats.mockInterviews.averageRating}</span>
            </div>
            <div className="text-sm font-medium">Interview Rating</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {stats.mockInterviews.improvement > 0 && '+'}
              {stats.mockInterviews.improvement}% improvement
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="h-8 w-8 text-indigo-500" />
              <span className="text-3xl font-bold">{stats.connections.strong}</span>
            </div>
            <div className="text-sm font-medium">Strong Connections</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{stats.connections.total} total</div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Action Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Action Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.documents.needsReview > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">{stats.documents.needsReview} documents pending review</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
            )}
            
            {stats.connections.followUps > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">{stats.connections.followUps} follow-ups this week</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
            )}
            
            {stats.workshops.upcoming > 0 && (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{stats.workshops.upcoming} upcoming workshops</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
            )}
            
            {stats.documents.active === 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm">No active resume on file</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">No upcoming events</div>
            ) : (
              upcomingEvents.map((event, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="mt-0.5">
                    {event.type === 'workshop' && <Users className="h-4 w-4 text-blue-500" />}
                    {event.type === 'interview' && <Video className="h-4 w-4 text-purple-500" />}
                    {event.type === 'follow-up' && <Building2 className="h-4 w-4 text-green-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{event.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(event.date).toLocaleDateString()}
                      {event.company && ` • ${event.company}`}
                      {event.time && ` • ${event.time}`}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{activity.title}</span>
                    {activity.status && (
                      <Badge variant="outline" className="text-xs">
                        {activity.status}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.description} • {new Date(activity.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Application Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Applied</span>
                <span className="font-medium">{stats.applications.active}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${(stats.applications.active / stats.applications.total) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-sm mt-3">
                <span>Interviews</span>
                <span className="font-medium">{stats.applications.interviews}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full" 
                  style={{ width: `${(stats.applications.interviews / stats.applications.total) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-sm mt-3">
                <span>Offers</span>
                <span className="font-medium">{stats.applications.offers}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${(stats.applications.offers / stats.applications.total) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Document Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Documents</span>
                <Badge className="bg-green-500">{stats.documents.active}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Approved</span>
                <Badge className="bg-blue-500">{stats.documents.approved}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Pending Review</span>
                <Badge className="bg-yellow-500">{stats.documents.needsReview}</Badge>
              </div>
              <div className="pt-3 border-t">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Total documents: {stats.documents.total}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Network Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-2xl font-bold">{stats.connections.total}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Connections</div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>With Referral Potential</span>
                <span className="font-medium">{stats.connections.referralPotential}</span>
              </div>
              <div className="flex justify-between">
                <span>Strong Relationships</span>
                <span className="font-medium">{stats.connections.strong}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}