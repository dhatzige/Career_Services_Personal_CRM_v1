import React, { useState, useEffect, useCallback } from 'react';
import { X, Search } from 'lucide-react';
import { Student } from '../types/student';
import { loadStudents } from '../utils/studentData';
import { SearchFilters, createAdvancedSearch } from '../utils/search';

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResults: (students: Student[]) => void;
}

const AdvancedSearchModal: React.FC<AdvancedSearchModalProps> = ({
  isOpen,
  onClose,
  onResults
}) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Partial<SearchFilters>>({
    programs: [],
    years: [],
    statuses: [],
    consultationTypes: [],
    dateRange: {},
    hasNotes: null,
    hasConsultations: null
  });
  const [results, setResults] = useState<Student[]>([]);
  const [facets, setFacets] = useState<{
    programs: { [key: string]: number };
    years: { [key: string]: number };
    statuses: { [key: string]: number };
  }>({ programs: {}, years: {}, statuses: {} });

  const students = loadStudents();
  const search = createAdvancedSearch(students);

  const performSearch = useCallback(() => {
    const searchResults = search.search(query, filters);
    setResults(searchResults.students);
    setFacets(searchResults.facets);
  }, [search, query, filters]);

  useEffect(() => {
    if (isOpen) {
      performSearch();
    }
  }, [isOpen, performSearch]);

  const handleFilterChange = (key: keyof SearchFilters, value: unknown) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const addToFilter = (key: 'programs' | 'years' | 'statuses' | 'consultationTypes', value: string) => {
    const currentValues = filters[key] || [];
    if (!currentValues.includes(value)) {
      handleFilterChange(key, [...currentValues, value]);
    }
  };

  const removeFromFilter = (key: 'programs' | 'years' | 'statuses' | 'consultationTypes', value: string) => {
    const currentValues = filters[key] || [];
    handleFilterChange(key, currentValues.filter(v => v !== value));
  };

  const clearFilters = () => {
    setFilters({
      programs: [],
      years: [],
      statuses: [],
      consultationTypes: [],
      dateRange: {},
      hasNotes: null,
      hasConsultations: null
    });
    setQuery('');
  };

  const applyResults = () => {
    onResults(results);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Advanced Search
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex h-[70vh]">
            {/* Filters Sidebar */}
            <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Search Query */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search Query
                  </label>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search students..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Programs Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Programs
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {Object.entries(facets.programs || {}).map(([program, count]) => (
                      <label key={program} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.programs?.includes(program) || false}
                          onChange={(e) => {
                            if (e.target.checked) {
                              addToFilter('programs', program);
                            } else {
                              removeFromFilter('programs', program);
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          {program} ({count})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Years Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Year of Study
                  </label>
                  <div className="space-y-2">
                    {Object.entries(facets.years || {}).map(([year, count]) => (
                      <label key={year} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.years?.includes(year) || false}
                          onChange={(e) => {
                            if (e.target.checked) {
                              addToFilter('years', year);
                            } else {
                              removeFromFilter('years', year);
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          {year} ({count})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <div className="space-y-2">
                    {Object.entries(facets.statuses || {}).map(([status, count]) => (
                      <label key={status} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.statuses?.includes(status) || false}
                          onChange={(e) => {
                            if (e.target.checked) {
                              addToFilter('statuses', status);
                            } else {
                              removeFromFilter('statuses', status);
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          {status} ({count})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Additional Filters */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Additional Filters
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.hasNotes === true}
                        onChange={(e) => handleFilterChange('hasNotes', e.target.checked ? true : null)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Has Notes
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.hasConsultations === true}
                        onChange={(e) => handleFilterChange('hasConsultations', e.target.checked ? true : null)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Has Consultations
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                  Results ({results.length})
                </h4>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                >
                  Clear Filters
                </button>
              </div>

              <div className="space-y-3">
                {results.map(student => (
                  <div
                    key={student.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white">
                          {student.firstName} {student.lastName}
                        </h5>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {student.specificProgram} • {student.yearOfStudy}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {student.consultations.length} consultations
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {student.notes.length} notes
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={applyResults}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Apply Results ({results.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearchModal;