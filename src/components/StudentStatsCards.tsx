import { Users, Briefcase, AlertCircle, Target, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Student, Consultation } from '@/types';

interface StudentStatsCardsProps {
  students: Student[];
  consultations?: Record<string, Consultation[]>;
  onStatClick?: (filterType: string, filterValue: string) => void;
  activeFilter?: { type: string; value: string } | null;
}

export default function StudentStatsCards({ students, consultations = {}, onStatClick, activeFilter }: StudentStatsCardsProps) {
  // Calculate statistics
  const totalStudents = students.length;
  
  const activeJobSeekers = students.filter(s => {
    const status = s.job_search_status || s.jobSearchStatus || '';
    return ['Actively Searching', 'Searching for Internship', 'Interviewing'].includes(status);
  }).length;
  
  const employed = students.filter(s => {
    const status = s.job_search_status || s.jobSearchStatus || '';
    return status === 'Employed' || status === 'Offer Received' || status === 'Currently Interning';
  }).length;
  
  const highNoShows = students.filter(s => {
    const count = s.no_show_count || s.noShowCount || 0;
    return count >= 3;
  }).length;
  
  const withResume = students.filter(s => s.resume_on_file || s.resumeOnFile).length;

  const byYear = students.reduce((acc, s) => {
    const year = s.year_of_study || s.yearOfStudy || 'Unknown';
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // For 2 or fewer students, don't show "Most are X" since it's not meaningful
  const mostCommonYear = totalStudents > 2 
    ? Object.entries(byYear).reduce((max, [year, count]) => 
        count > max.count ? { year, count } : max, { year: '', count: 0 }
      ).year
    : '';
  
  // Create a more appropriate subtitle based on student count
  const getYearSubtitle = () => {
    if (totalStudents === 0) return 'No students yet';
    if (totalStudents === 1) {
      const year = Object.keys(byYear)[0];
      return year ? `${year}` : 'No year specified';
    }
    if (totalStudents === 2) {
      const years = Object.entries(byYear).map(([year, count]) => 
        count === 2 ? `Both ${year}` : year
      ).join(' and ');
      return years;
    }
    return mostCommonYear ? `Most are ${mostCommonYear}` : 'Various years';
  };

  const stats = [
    {
      title: 'Total Students',
      value: totalStudents,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
      subtitle: getYearSubtitle(),
      filterType: 'all',
      filterValue: 'all',
      clickable: true
    },
    {
      title: 'Active Job Seekers',
      value: activeJobSeekers,
      icon: Briefcase,
      color: 'bg-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400',
      subtitle: totalStudents > 0 ? `${Math.round((activeJobSeekers / totalStudents) * 100)}% of total` : '0% of total',
      filterType: 'jobStatus',
      filterValue: 'active', // Special value that will filter for active job searching statuses
      clickable: true
    },
    {
      title: 'Employed/Offers',
      value: employed,
      icon: Award,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
      subtitle: totalStudents > 0 ? `${Math.round((employed / totalStudents) * 100)}% success rate` : '0% success rate',
      filterType: 'jobStatus',
      filterValue: 'employed', // Special value for employed/offer statuses
      clickable: true
    },
    {
      title: 'Resumes on File',
      value: withResume,
      icon: Target,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      subtitle: totalStudents > 0 ? `${Math.round((withResume / totalStudents) * 100)}% have resumes` : '0% have resumes',
      filterType: 'activity',
      filterValue: 'has_resume',
      clickable: true
    },
    {
      title: 'High No-Shows',
      value: highNoShows,
      icon: AlertCircle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-600 dark:text-red-400',
      subtitle: highNoShows > 0 
        ? `${highNoShows} student${highNoShows !== 1 ? 's' : ''} with 3+ no-shows`
        : 'No students with high no-shows',
      filterType: 'consultations',
      filterValue: 'high_no_shows',
      clickable: true
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const isClickable = stat.clickable && onStatClick;
        
        // Check if this stat card is the active filter
        const isActive = activeFilter && 
          activeFilter.type === stat.filterType && 
          (activeFilter.value === stat.filterValue ||
           (stat.filterType === 'jobStatus' && 
            ((stat.filterValue === 'active' && activeFilter.value === 'active_seekers') ||
             (stat.filterValue === 'employed' && activeFilter.value === 'employed_offers'))));
        
        return (
          <Card 
            key={index} 
            className={`transition-all ${
              isClickable ? 'hover:shadow-lg cursor-pointer hover:scale-105' : 'hover:shadow-lg'
            } ${
              isActive ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : ''
            }`}
            onClick={() => {
              if (isClickable) {
                onStatClick(stat.filterType, stat.filterValue);
              }
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.textColor}`} />
                </div>
                <span className={`text-2xl font-bold ${stat.textColor}`}>
                  {stat.value}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                {stat.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {stat.subtitle}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}