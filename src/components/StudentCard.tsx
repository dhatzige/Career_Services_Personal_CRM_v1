import { Calendar, Mail, Briefcase, GraduationCap, AlertCircle, Phone, MapPin, Building, Linkedin, FileText, Clock, Sparkles, CalendarCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { isNewStudent, hasUpcomingConsultation, hasConsultationToday } from '@/utils/studentHelpers';
import type { Student } from '@/types';

interface StudentCardProps {
  student: Student;
  onClick: () => void;
}

export default function StudentCard({ student, onClick }: StudentCardProps) {
  const hasHighNoShows = student.no_show_count && student.no_show_count >= 3;
  
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'actively searching':
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'preparing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'interviewing':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'offer received':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'employed':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'not started':
      case 'not seeking':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getYearBadgeColor = (year?: string) => {
    switch (year) {
      case '1st year':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case '2nd year':
        return 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case '3rd year':
        return 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      case '4th year':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'Graduate':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300';
      case 'Alumni':
        return 'bg-gray-50 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300';
      default:
        return 'bg-gray-50 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300';
    }
  };

  const daysSinceInteraction = student.last_interaction 
    ? Math.floor((new Date().getTime() - new Date(student.last_interaction).getTime()) / (1000 * 3600 * 24))
    : null;

  return (
    <Card 
      className="hover:shadow-xl transition-all duration-200 cursor-pointer dark:bg-gray-800 dark:border-gray-700 group hover:scale-[1.02] overflow-hidden"
      onClick={onClick}
    >
      {/* Color accent bar at top */}
      <div className={`h-1 ${getStatusColor(student.job_search_status).split(' ')[0]}`} />
      
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <div className="flex items-start gap-2">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {student.first_name} {student.last_name}
              </CardTitle>
              {/* New/Upcoming consultation indicators */}
              {isNewStudent(student) && (
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs px-2 py-0.5 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  New
                </Badge>
              )}
              {hasConsultationToday(student) && (
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 text-xs px-2 py-0.5 flex items-center gap-1 animate-pulse">
                  <CalendarCheck className="h-3 w-3" />
                  Today
                </Badge>
              )}
              {!hasConsultationToday(student) && hasUpcomingConsultation(student) && (
                <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 text-xs px-2 py-0.5 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Upcoming
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              {student.year_of_study && (
                <Badge variant="secondary" className={`text-xs ${getYearBadgeColor(student.year_of_study)}`}>
                  {student.year_of_study}
                </Badge>
              )}
              {student.program_type && (
                <Badge variant="outline" className="text-xs">
                  {student.program_type}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {student.resume_on_file && (
              <FileText className="h-4 w-4 text-green-500" title="Resume on file" />
            )}
            {student.linkedin_url && (
              <Linkedin className="h-4 w-4 text-blue-500" title="LinkedIn profile available" />
            )}
            {hasHighNoShows && (
              <AlertCircle className="h-5 w-5 text-red-500" title={`${student.no_show_count} no-shows`} />
            )}
          </div>
        </div>
        {student.job_search_status && (
          <Badge className={`${getStatusColor(student.job_search_status)} font-medium`}>
            {student.job_search_status}
          </Badge>
        )}
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-2">
          {student.email && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">
              <Mail className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="truncate">{student.email}</span>
            </div>
          )}
          
          {student.phone && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Phone className="mr-2 h-4 w-4 flex-shrink-0" />
              <span>{student.phone}</span>
            </div>
          )}
          
          {student.major && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <GraduationCap className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="font-medium">{student.major}</span>
            </div>
          )}
        </div>
        
        {student.career_interests && student.career_interests.length > 0 && (
          <div className="pt-2 border-t dark:border-gray-700">
            <div className="flex items-start text-sm">
              <Briefcase className="mr-2 h-4 w-4 flex-shrink-0 text-gray-500 mt-0.5" />
              <div className="flex flex-wrap gap-1">
                {student.career_interests.slice(0, 3).map((interest, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {interest}
                  </Badge>
                ))}
                {student.career_interests.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{student.career_interests.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}

        {(student.target_industries?.length > 0 || student.target_locations?.length > 0) && (
          <div className="space-y-2 pt-2 border-t dark:border-gray-700">
            {student.target_industries?.length > 0 && (
              <div className="flex items-start text-sm">
                <Building className="mr-2 h-4 w-4 flex-shrink-0 text-gray-500 mt-0.5" />
                <span className="text-gray-600 dark:text-gray-400 truncate">
                  {student.target_industries.slice(0, 2).join(', ')}
                  {student.target_industries.length > 2 && ` +${student.target_industries.length - 2}`}
                </span>
              </div>
            )}
            {student.target_locations?.length > 0 && (
              <div className="flex items-start text-sm">
                <MapPin className="mr-2 h-4 w-4 flex-shrink-0 text-gray-500 mt-0.5" />
                <span className="text-gray-600 dark:text-gray-400 truncate">
                  {student.target_locations.slice(0, 2).join(', ')}
                  {student.target_locations.length > 2 && ` +${student.target_locations.length - 2}`}
                </span>
              </div>
            )}
          </div>
        )}

        {student.tags && student.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {student.tags.slice(0, 4).map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {student.tags.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{student.tags.length - 4}
              </Badge>
            )}
          </div>
        )}

        {student.quick_note && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
              {student.quick_note}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-3">
            {daysSinceInteraction !== null && (
              <div className="flex items-center">
                <Clock className="mr-1 h-3 w-3" />
                <span>
                  {daysSinceInteraction === 0 ? 'Today' : 
                   daysSinceInteraction === 1 ? 'Yesterday' :
                   `${daysSinceInteraction}d ago`}
                </span>
              </div>
            )}
          </div>
          {student.no_show_count && student.no_show_count > 0 && (
            <div className="text-red-600 dark:text-red-400 font-medium">
              {student.no_show_count} no-show{student.no_show_count > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}