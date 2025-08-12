import React, { useMemo, useCallback } from 'react';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Student, ConsultationType } from '../types/student';
import { format } from 'date-fns';
import { User, Calendar, CheckCircle, XCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface VirtualizedStudentTableProps {
  students: Student[];
  selectedStudents: Set<string>;
  expandedRows: Set<string>;
  onSelectStudent: (studentId: string) => void;
  onToggleAllStudents: () => void;
  onExpandRow: (studentId: string) => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onViewDetails: (student: Student) => void;
}

const VirtualizedStudentTable: React.FC<VirtualizedStudentTableProps> = ({
  students,
  selectedStudents,
  expandedRows,
  onSelectStudent,
  onToggleAllStudents,
  onExpandRow,
  onEditStudent,
  onDeleteStudent,
  onViewDetails,
}) => {
  // Calculate row heights
  const getItemSize = useCallback((index: number) => {
    if (index === 0) return 50; // Header row
    const student = students[index - 1];
    if (!student) return 0;
    
    const isExpanded = expandedRows.has(student.id);
    const baseHeight = 65;
    const expandedHeight = 200; // Approximate height for expanded content
    
    return isExpanded ? baseHeight + expandedHeight : baseHeight;
  }, [students, expandedRows]);

  // Header component
  const TableHeader = () => (
    <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 font-medium text-sm text-gray-700 dark:text-gray-300">
      <div className="w-10">
        <input
          type="checkbox"
          checked={selectedStudents.size === students.length && students.length > 0}
          onChange={onToggleAllStudents}
          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
        />
      </div>
      <div className="flex-1 grid grid-cols-6 gap-4">
        <div>Name</div>
        <div>Email</div>
        <div>Program</div>
        <div>Status</div>
        <div>Last Interaction</div>
        <div className="text-right">Actions</div>
      </div>
    </div>
  );

  // Row renderer
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    if (index === 0) {
      return <div style={style}><TableHeader /></div>;
    }

    const student = students[index - 1];
    if (!student) return null;

    const isExpanded = expandedRows.has(student.id);
    const isSelected = selectedStudents.has(student.id);

    return (
      <div style={style} className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
          <div className="w-10">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelectStudent(student.id)}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1 grid grid-cols-6 gap-4 items-center">
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {student.firstName} {student.lastName}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {student.email}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {student.specificProgram}
            </div>
            <div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                student.status === 'Active' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : student.status === 'Inactive'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {student.status}
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {student.lastInteraction 
                ? format(new Date(student.lastInteraction), 'MMM d, yyyy')
                : 'Never'
              }
            </div>
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => onExpandRow(student.id)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <button
                onClick={() => onViewDetails(student)}
                className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <ExternalLink size={16} />
              </button>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="px-16 pb-4 bg-gray-50 dark:bg-gray-800">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Recent Consultations</h4>
                {student.consultations && student.consultations.length > 0 ? (
                  <div className="space-y-1">
                    {student.consultations.slice(0, 3).map((consultation, idx) => (
                      <div key={idx} className="flex items-center text-gray-600 dark:text-gray-400">
                        <Calendar size={14} className="mr-2" />
                        <span>{format(new Date(consultation.date), 'MMM d, yyyy')} - {consultation.type}</span>
                        {consultation.attended ? (
                          <CheckCircle size={14} className="ml-2 text-green-500" />
                        ) : (
                          <XCircle size={14} className="ml-2 text-red-500" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No consultations yet</p>
                )}
              </div>
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Contact Information</h4>
                <div className="space-y-1 text-gray-600 dark:text-gray-400">
                  <div>Phone: {student.phone || 'Not provided'}</div>
                  <div>Year: {student.yearOfStudy}</div>
                  <div>Program Type: {student.programType}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const itemCount = students.length + 1; // +1 for header

  return (
    <div className="h-full w-full">
      <AutoSizer>
        {({ height, width }: { height: number; width: number }) => (
          <List
            height={height}
            itemCount={itemCount}
            itemSize={getItemSize}
            width={width}
            className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
};

export default VirtualizedStudentTable;