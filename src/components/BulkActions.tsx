import React, { useState } from 'react';
import { Download, Tag, Trash2 } from 'lucide-react';
import { Student } from '../types/student';
import { exportToCSV } from '../utils/exportImport';

interface BulkActionsProps {
  selectedStudents: Student[];
  onClearSelection: () => void;
  onBulkTag: (tag: string) => void;
  onBulkDelete: () => void;
}

const BulkActions: React.FC<BulkActionsProps> = ({
  selectedStudents,
  onClearSelection,
  onBulkTag,
  onBulkDelete
}) => {
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleExport = () => {
    exportToCSV(selectedStudents, `selected-students-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      onBulkTag(newTag.trim());
      setNewTag('');
      setShowTagInput(false);
    }
  };

  if (selectedStudents.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {selectedStudents.length} selected
          </span>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExport}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              title="Export selected students"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>

            <div className="relative">
              {showTagInput ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="Enter tag"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    autoFocus
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowTagInput(false)}
                    className="px-3 py-2 text-gray-600 dark:text-gray-400 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowTagInput(true)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  title="Add tag to selected students"
                >
                  <Tag className="h-4 w-4 mr-2" />
                  Tag
                </button>
              )}
            </div>

            <button
              onClick={onBulkDelete}
              className="inline-flex items-center px-3 py-2 border border-red-300 dark:border-red-600 text-sm font-medium rounded-md text-red-700 dark:text-red-300 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Delete selected students"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>

          <button
            onClick={onClearSelection}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkActions;