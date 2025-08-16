import React from 'react';
import { Student } from '../types/student';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, X } from 'lucide-react';
import { format } from 'date-fns';

interface StudentTableMobileProps {
  students: Student[];
  onStudentClick: (student: Student, tab?: 'timeline' | 'info' | 'notes') => void;
  onStudentDelete?: (student: Student) => void;
}

const StudentTableMobile: React.FC<StudentTableMobileProps> = ({
  students,
  onStudentClick,
  onStudentDelete
}) => {
  const getUpcomingConsultations = (student: Student) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return (student.consultations || [])
      .filter(c => new Date(c.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  };

  const getAttendanceRate = (student: Student) => {
    const completedConsultations = (student.consultations || []).filter(
      c => c.status === 'attended' || c.status === 'no-show' || c.attended !== undefined
    );
    
    if (completedConsultations.length === 0) return null;
    
    const attendedCount = completedConsultations.filter(
      c => c.status === 'attended' || c.attended === true
    ).length;
    
    return Math.round((attendedCount / completedConsultations.length) * 100);
  };

  return (
    <div className="space-y-3">
      {students.map((student) => {
        const upcomingConsultations = getUpcomingConsultations(student);
        const attendanceRate = getAttendanceRate(student);
        
        return (
          <div
            key={student.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow relative"
          >
            {/* Delete button - positioned absolutely */}
            {onStudentDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const studentName = student.firstName && student.lastName 
                    ? `${student.firstName} ${student.lastName}`
                    : student.email || 'this student';
                  if (confirm(`Are you sure you want to delete ${studentName}?`)) {
                    onStudentDelete(student);
                  }
                }}
                className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                title="Delete student"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            
            {/* Clickable area */}
            <div onClick={() => onStudentClick(student)} className="cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 pr-8">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {student.firstName} {student.lastName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {student.email}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
              </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Program</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {student.specificProgram}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Year</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {student.yearOfStudy}
                </span>
              </div>

              {attendanceRate !== null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Attendance</span>
                  <span className={`font-medium ${
                    attendanceRate >= 80 
                      ? 'text-green-600 dark:text-green-400' 
                      : attendanceRate >= 60 
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {attendanceRate}%
                  </span>
                </div>
              )}

              {upcomingConsultations.length > 0 && (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Next consultation
                  </p>
                  <div className="flex items-center text-sm text-gray-900 dark:text-gray-100">
                    <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400 dark:text-gray-500" />
                    {format(new Date(upcomingConsultations[0].date), 'MMM d, h:mm a')}
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StudentTableMobile;