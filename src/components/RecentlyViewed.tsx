import React, { useState, useEffect } from 'react';
import { Clock, User } from 'lucide-react';
import { Student } from '../types/student';
import api from '../services/api';

interface RecentlyViewedProps {
  onStudentClick: (student: Student) => void;
}

const RECENTLY_VIEWED_KEY = 'crm_recently_viewed';
const MAX_RECENT_ITEMS = 5;

export const addToRecentlyViewed = (studentId: string) => {
  const recent = getRecentlyViewed();
  const filtered = recent.filter(id => id !== studentId);
  const updated = [studentId, ...filtered].slice(0, MAX_RECENT_ITEMS);
  localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
};

export const removeFromRecentlyViewed = (studentId: string) => {
  const recent = getRecentlyViewed();
  const filtered = recent.filter(id => id !== studentId);
  localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(filtered));
};

export const getRecentlyViewed = (): string[] => {
  const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
  return stored ? JSON.parse(stored) : [];
};

const RecentlyViewed: React.FC<RecentlyViewedProps> = ({ onStudentClick }) => {
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);

  const loadRecentStudents = async () => {
    try {
      const recentIds = getRecentlyViewed();
      if (recentIds.length === 0) {
        setRecentStudents([]);
        return;
      }
      
      // Fetch all students from API
      const response = await api.students.list();
      // API returns the array directly, not wrapped in an object
      const allStudents = Array.isArray(response) ? response : (response?.data || []);
      
      const recent = recentIds
        .map(id => allStudents.find((s: Student) => s.id === id))
        .filter(Boolean) as Student[];
      
      setRecentStudents(recent);
    } catch (error) {
      console.error('Error loading recent students:', error);
      setRecentStudents([]);
    }
  };

  useEffect(() => {
    loadRecentStudents();
    
    // Listen for storage changes to update recently viewed
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === RECENTLY_VIEWED_KEY) {
        loadRecentStudents();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events when students are updated
    const handleStudentUpdate = () => {
      loadRecentStudents();
    };

    window.addEventListener('studentDeleted', handleStudentUpdate);
    window.addEventListener('studentUpdated', handleStudentUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('studentDeleted', handleStudentUpdate);
      window.removeEventListener('studentUpdated', handleStudentUpdate);
    };
  }, []);

  if (recentStudents.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No recent students</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 px-4 mb-3 flex items-center">
        <Clock className="h-4 w-4 mr-2" />
        Recently Viewed
      </h3>
      {recentStudents.map(student => (
        <button
          key={student.id}
          onClick={() => onStudentClick(student)}
          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {student.avatar ? (
                <img
                  src={student.avatar}
                  alt={`${student.firstName} ${student.lastName}`}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-300 font-medium text-sm">
                    {student.firstName[0]}{student.lastName[0]}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {student.firstName} {student.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {student.specificProgram}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default RecentlyViewed;