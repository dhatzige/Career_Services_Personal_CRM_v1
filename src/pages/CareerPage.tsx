import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';

export default function CareerPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Career Services</h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Generate comprehensive reports for career services
          </p>
        </div>

        {/* Report Generator Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
          <div className="flex items-center mb-6">
            <div className="inline-flex p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 mr-4">
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Report Generator</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Create detailed reports on student progress and career outcomes</p>
            </div>
          </div>
          
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Generate comprehensive reports including student career progress, consultation summaries, 
            and placement statistics. Export reports in various formats for administrative use.
          </p>

          <button
            onClick={() => navigate('/reports')}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white font-medium rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Go to Report Generator
          </button>
        </div>
      </div>
    </div>
  );
}