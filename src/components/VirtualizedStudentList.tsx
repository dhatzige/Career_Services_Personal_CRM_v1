import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Student } from '../types/student';
import StudentCard from './StudentCard';

interface VirtualizedStudentListProps {
  students: Student[];
  onStudentClick: (student: Student) => void;
  height: number;
  itemHeight: number;
}

const VirtualizedStudentList: React.FC<VirtualizedStudentListProps> = ({
  students,
  onStudentClick,
  height,
  itemHeight
}) => {
  const ItemRenderer = useMemo(() => {
    return ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const student = students[index];
      if (!student) return null;

      return (
        <div style={style} className="px-2 py-2">
          <StudentCard student={student} onClick={onStudentClick} />
        </div>
      );
    };
  }, [students, onStudentClick]);

  if (students.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No students found
      </div>
    );
  }

  return (
    <List
      height={height}
      itemCount={students.length}
      itemSize={itemHeight}
      className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
    >
      {ItemRenderer}
    </List>
  );
};

export default VirtualizedStudentList;