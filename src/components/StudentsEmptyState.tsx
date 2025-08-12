import { Plus, Search, Users, Upload, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StudentsEmptyStateProps {
  searchTerm: string;
  hasFilters: boolean;
  onAddStudent: () => void;
  onClearFilters?: () => void;
  onImport?: () => void;
}

export default function StudentsEmptyState({ 
  searchTerm, 
  hasFilters,
  onAddStudent,
  onClearFilters,
  onImport
}: StudentsEmptyStateProps) {
  if (searchTerm || hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
          <Search className="h-8 w-8 text-gray-400 dark:text-gray-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No students found
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md">
          {searchTerm 
            ? `No students match "${searchTerm}". Try adjusting your search terms.`
            : 'No students match the selected filters. Try adjusting your filters.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          {hasFilters && onClearFilters && (
            <Button variant="outline" onClick={onClearFilters}>
              Clear filters
            </Button>
          )}
          <Button onClick={onAddStudent}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Student
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="mb-8 relative">
        <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-2xl opacity-50" />
        <div className="relative p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full">
          <Users className="h-12 w-12 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 text-center">
        Welcome to Career Services CRM
      </h3>
      <p className="text-base text-gray-600 dark:text-gray-300 mb-8 text-center max-w-lg">
        Start building your student database to track consultations, career progress, and engagement.
      </p>

      <Button onClick={onAddStudent} size="lg" className="mb-12">
        <Plus className="mr-2 h-5 w-5" />
        Add First Student
      </Button>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-3xl">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/30 rounded-xl">
            <FileSpreadsheet className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Track Progress
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            Monitor career development and job search status
          </p>
        </div>
        
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 p-4 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
            <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Manage Consultations
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            Schedule and track student meetings
          </p>
        </div>
        
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 p-4 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
            <Search className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Advanced Analytics
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            Gain insights from engagement data
          </p>
        </div>
      </div>
    </div>
  );
}