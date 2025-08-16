import React, { useState } from 'react';
import type { Student, Consultation, Note } from '@/types/student';
import { 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  CalendarPlus,
  Sparkles,
  CalendarCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'react-hot-toast';
import { api } from '@/services/apiClient';
import { apiCache, cachePatterns } from '@/services/apiCache';
import { isNewStudent, hasUpcomingConsultation, hasConsultationToday, getMostRecentConsultation } from '@/utils/studentHelpers';

interface StudentTableViewProps {
  students: Student[];
  consultations?: Record<string, Consultation[]>;
  onStudentClick: (student: Student, tab?: string) => void;
  currentPage: number;
  totalPages: number;
  totalStudents: number;
  onPageChange: (page: number) => void;
  onStudentUpdated?: () => void;
  onStudentDelete?: (id: string) => void;
  onUpdateConsultation?: (id: string, updates: Partial<Consultation>) => void;
}

const StudentTableView: React.FC<StudentTableViewProps> = ({
  students,
  consultations = {},
  onStudentClick,
  currentPage,
  totalPages,
  totalStudents,
  onPageChange,
  onStudentUpdated,
  onStudentDelete,
  onUpdateConsultation
}) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Format the last consultation date
  const formatLastConsultation = (student: Student): string => {
    const consultation = getMostRecentConsultation(student);
    if (!consultation) return 'No consultations';
    
    const consultationDate = consultation.date || consultation.scheduled_date || consultation.consultation_date;
    if (!consultationDate) return 'No date';
    
    return format(new Date(consultationDate), 'MMM d, yyyy');
  };

  // Get attendance status icon and color with dynamic light/dark mode support
  const getAttendanceDisplay = (status?: string) => {
    switch (status) {
      case 'attended':
        return { 
          icon: CheckCircle, 
          color: 'text-white', 
          bgColor: 'bg-green-600 dark:bg-green-500',
          label: 'Attended' 
        };
      case 'no-show':
        return { 
          icon: XCircle, 
          color: 'text-white', 
          bgColor: 'bg-red-600 dark:bg-red-500',
          label: 'No Show' 
        };
      case 'cancelled':
        return { 
          icon: AlertCircle, 
          color: 'text-white', 
          bgColor: 'bg-orange-600 dark:bg-orange-500',
          label: 'Cancelled' 
        };
      case 'rescheduled':
        return { 
          icon: Clock, 
          color: 'text-white', 
          bgColor: 'bg-blue-600 dark:bg-blue-500',
          label: 'Rescheduled' 
        };
      case 'scheduled':
        return { 
          icon: Calendar, 
          color: 'text-white', 
          bgColor: 'bg-gray-600 dark:bg-gray-500',
          label: 'Scheduled' 
        };
      default:
        return null;
    }
  };

  // Get job search status color with proper light/dark mode contrast
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'actively searching':
        return 'bg-green-600 text-white dark:bg-green-500 dark:text-white';
      case 'searching for internship':
        return 'bg-cyan-600 text-white dark:bg-cyan-500 dark:text-white';
      case 'currently interning':
        return 'bg-teal-600 text-white dark:bg-teal-500 dark:text-white';
      case 'preparing':
        return 'bg-blue-600 text-white dark:bg-blue-400 dark:text-gray-900';
      case 'interviewing':
        return 'bg-purple-600 text-white dark:bg-purple-500 dark:text-white';
      case 'offer received':
        return 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-white';
      case 'employed':
        return 'bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white';
      case 'not started':
        return 'bg-gray-600 text-white dark:bg-gray-500 dark:text-white';
      case 'not seeking':
        return 'bg-slate-600 text-white dark:bg-slate-500 dark:text-white';
      default:
        return 'bg-gray-600 text-white dark:bg-gray-500 dark:text-white';
    }
  };

  // Quick update attendance status - flexible, not tied to consultations
  const updateAttendanceStatus = async (student: Student, newStatus: string) => {
    if (!onStudentUpdated) {
      toast.error('Update function not available');
      return;
    }

    setUpdatingId(student.id);
    
    try {
      // Update the student's attendance status directly
      await api.students.update(student.id, {
        last_attendance_status: newStatus
      });

      // Clear the entire cache to ensure fresh data
      apiCache.clear();
      
      toast.success('Attendance status updated');
      
      // Refresh the student list to show the update
      onStudentUpdated();
    } catch (error) {
      console.error('Error updating attendance status:', error);
      toast.error('Failed to update attendance status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Quick update job search status
  const updateJobSearchStatus = async (student: Student, newStatus: string) => {
    if (!onStudentUpdated) {
      toast.error('Update function not available');
      return;
    }

    setUpdatingId(student.id);
    
    try {
      // Update the student's job search status directly
      await api.students.update(student.id, {
        job_search_status: newStatus
      });

      // Clear the entire cache to ensure fresh data
      apiCache.clear();
      
      toast.success('Job search status updated');
      
      // Refresh the student list to show the update
      onStudentUpdated();
    } catch (error) {
      console.error('Error updating job search status:', error);
      toast.error('Failed to update job search status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle delete student
  const handleDeleteStudent = async (e: React.MouseEvent, studentId: string) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this student?')) {
      return;
    }

    try {
      if (onStudentDelete) {
        await onStudentDelete(studentId);
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Failed to delete student');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Program
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Job Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Last Consultation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Attendance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Notes
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {students.map((student) => {
              const recentConsultation = getMostRecentConsultation(student, consultations);
              // Use the student's lastAttendanceStatus or default to 'scheduled'
              const attendanceStatus = student.lastAttendanceStatus || 'scheduled';
              const attendanceDisplay = getAttendanceDisplay(attendanceStatus);
              
              return (
                <tr
                  key={student.id}
                  onClick={() => onStudentClick(student)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {student.firstName} {student.lastName}
                        </span>
                        {/* New/Upcoming consultation indicators */}
                        {isNewStudent(student) && (
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs px-2 py-0.5 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            New
                          </Badge>
                        )}
                        {hasConsultationToday(student, consultations) && (
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 text-xs px-2 py-0.5 flex items-center gap-1 animate-pulse">
                            <CalendarCheck className="h-3 w-3" />
                            Today
                          </Badge>
                        )}
                        {!hasConsultationToday(student, consultations) && hasUpcomingConsultation(student, consultations) && (
                          <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 text-xs px-2 py-0.5 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Upcoming
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {student.yearOfStudy}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="flex items-center text-gray-900 dark:text-gray-100">
                        <Mail className="h-4 w-4 mr-1 text-gray-400" />
                        {student.email}
                      </div>
                      {student.phone && (
                        <div className="flex items-center text-gray-500 dark:text-gray-400 mt-1">
                          <Phone className="h-4 w-4 mr-1 text-gray-400" />
                          {student.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="text-gray-900 dark:text-gray-100">{student.major}</div>
                      <div className="text-gray-500 dark:text-gray-400">{student.programType}</div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-auto"
                        >
                          <Badge className={getStatusColor(student.jobSearchStatus)}>
                            {student.jobSearchStatus || 'Not Started'}
                          </Badge>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuLabel>Set Job Search Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => updateJobSearchStatus(student, 'Not Started')}>
                          <span className="text-gray-700 dark:text-gray-300">Not Started</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateJobSearchStatus(student, 'Preparing')}>
                          <span className="text-blue-700 dark:text-blue-300">Preparing</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateJobSearchStatus(student, 'Actively Searching')}>
                          <span className="text-green-700 dark:text-green-300">Actively Searching</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateJobSearchStatus(student, 'Searching for Internship')}>
                          <span className="text-cyan-700 dark:text-cyan-300">Searching for Internship</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateJobSearchStatus(student, 'Currently Interning')}>
                          <span className="text-teal-700 dark:text-teal-300">Currently Interning</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateJobSearchStatus(student, 'Interviewing')}>
                          <span className="text-purple-700 dark:text-purple-300">Interviewing</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateJobSearchStatus(student, 'Offer Received')}>
                          <span className="text-emerald-700 dark:text-emerald-300">Offer Received</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateJobSearchStatus(student, 'Employed')}>
                          <span className="text-indigo-700 dark:text-indigo-300">Employed</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateJobSearchStatus(student, 'Not Seeking')}>
                          <span className="text-slate-700 dark:text-slate-300">Not Seeking</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {formatLastConsultation(student)}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
                            attendanceDisplay 
                              ? `${attendanceDisplay.bgColor} hover:opacity-90` 
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          disabled={updatingId === student.id}
                        >
                          {attendanceDisplay ? (
                            <>
                              <attendanceDisplay.icon className={`h-4 w-4 ${attendanceDisplay.color}`} />
                              <span className={`text-sm font-medium ${attendanceDisplay.color}`}>{attendanceDisplay.label}</span>
                            </>
                          ) : (
                            <>
                              <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              <span className="text-sm text-gray-500 dark:text-gray-400">Set Status</span>
                            </>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuLabel>Set Attendance Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => updateAttendanceStatus(student, 'scheduled')}>
                          <Calendar className="h-4 w-4 mr-2 text-gray-700 dark:text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300">Scheduled</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateAttendanceStatus(student, 'attended')}>
                          <CheckCircle className="h-4 w-4 mr-2 text-green-700 dark:text-green-400" />
                          <span className="text-green-700 dark:text-green-300">Attended</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateAttendanceStatus(student, 'no-show')}>
                          <XCircle className="h-4 w-4 mr-2 text-red-700 dark:text-red-400" />
                          <span className="text-red-700 dark:text-red-300">No Show</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateAttendanceStatus(student, 'cancelled')}>
                          <AlertCircle className="h-4 w-4 mr-2 text-orange-700 dark:text-orange-400" />
                          <span className="text-orange-700 dark:text-orange-300">Cancelled</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateAttendanceStatus(student, 'rescheduled')}>
                          <Clock className="h-4 w-4 mr-2 text-blue-700 dark:text-blue-400" />
                          <span className="text-blue-700 dark:text-blue-300">Rescheduled</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {student.notes && student.notes.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {student.notes.length}
                        </Badge>
                      )}
                      {student.quickNote && (
                        <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[150px]">
                          {student.quickNote}
                        </span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => onStudentClick(student)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStudentClick(student, 'notes')}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Add Note
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStudentClick(student, 'timeline')}>
                          <CalendarPlus className="h-4 w-4 mr-2" />
                          Schedule Consultation
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => handleDeleteStudent(e, student.id)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Student
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {students.length > 0 ? ((currentPage - 1) * students.length) + 1 : 0} to {Math.min(currentPage * students.length, totalStudents)} of {totalStudents} students
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTableView;