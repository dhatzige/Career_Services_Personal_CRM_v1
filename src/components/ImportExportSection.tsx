import React, { useState } from 'react';
import { Upload, Download, FileText, Database, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { exportData, importStudentsFromCSV, downloadCSVTemplate, exportBackup } from '../services/importExportService';
import { toast } from 'react-hot-toast';

const ImportExportSection: React.FC = () => {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    successCount?: number;
    errorCount?: number;
  } | null>(null);

  const handleExport = async (type: 'students' | 'consultations' | 'notes') => {
    setExporting(type);
    try {
      await exportData(type, 'csv');
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(null);
    }
  };

  const handleBackupExport = async () => {
    setExporting('backup');
    try {
      await exportBackup();
    } catch (error) {
      console.error('Backup export failed:', error);
    } finally {
      setExporting(null);
    }
  };

  const handleFileImport = async (file: File) => {
    setImporting(true);
    setImportResult(null);

    try {
      const result = await importStudentsFromCSV(file);
      setImportResult(result);
      
      // Refresh the page after successful import
      if (result.success && result.successCount && result.successCount > 0) {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : 'Import failed'
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Export Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Export Data
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Download your data in CSV format for backup or analysis.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Students Export */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
              <h4 className="font-medium text-gray-900 dark:text-white">Students</h4>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Export all student records with contact info and program details
            </p>
            <button
              onClick={() => handleExport('students')}
              disabled={exporting === 'students'}
              className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                       disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting === 'students' ? 'Exporting...' : 'Export Students'}
            </button>
          </div>

          {/* Consultations Export */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <FileText className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
              <h4 className="font-medium text-gray-900 dark:text-white">Consultations</h4>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Export all consultation records with attendance and notes
            </p>
            <button
              onClick={() => handleExport('consultations')}
              disabled={exporting === 'consultations'}
              className="w-full px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 
                       disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting === 'consultations' ? 'Exporting...' : 'Export Consultations'}
            </button>
          </div>

          {/* Notes Export */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
              <h4 className="font-medium text-gray-900 dark:text-white">Notes</h4>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Export all notes and follow-up records
            </p>
            <button
              onClick={() => handleExport('notes')}
              disabled={exporting === 'notes'}
              className="w-full px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 
                       disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting === 'notes' ? 'Exporting...' : 'Export Notes'}
            </button>
          </div>

          {/* Full Backup */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Database className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2" />
              <h4 className="font-medium text-gray-900 dark:text-white">Full Backup</h4>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Complete system backup with all data in JSON format
            </p>
            <button
              onClick={handleBackupExport}
              disabled={exporting === 'backup'}
              className="w-full px-3 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 
                       disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting === 'backup' ? 'Exporting...' : 'Export Backup'}
            </button>
          </div>
        </div>
      </div>

      {/* Import Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Import Students
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Import new students from a CSV file. Existing students with the same email will be skipped.
        </p>

        {/* Import Result */}
        {importResult && (
          <div className={`mb-6 p-4 rounded-lg ${
            importResult.success 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-start">
              {importResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
              )}
              <div>
                <p className={`font-medium ${
                  importResult.success 
                    ? 'text-green-800 dark:text-green-200' 
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {importResult.message}
                </p>
                {importResult.successCount !== undefined && importResult.errorCount !== undefined && (
                  <p className="text-sm mt-1">
                    Successfully imported: {importResult.successCount}, Failed: {importResult.errorCount}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CSV Template */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              1. Download Template
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Start by downloading our CSV template to see the correct format.
            </p>
            <button
              onClick={downloadCSVTemplate}
              className="w-full px-4 py-2 border border-blue-600 text-blue-600 dark:text-blue-400 
                       rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors 
                       flex items-center justify-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Download CSV Template
            </button>
          </div>

          {/* Import Upload */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              2. Upload Your File
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select your CSV file with student data to import.
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileImport(file);
              }}
              className="hidden"
              id="csv-import"
              disabled={importing}
            />
            <label
              htmlFor="csv-import"
              className={`w-full px-4 py-2 bg-blue-600 text-white rounded-lg 
                       hover:bg-blue-700 transition-colors flex items-center justify-center
                       cursor-pointer ${importing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Upload className="h-4 w-4 mr-2" />
              {importing ? 'Importing...' : 'Upload CSV File'}
            </label>
          </div>
        </div>

        {/* Import Guidelines */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-2">CSV Import Guidelines:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Required fields: First Name, Last Name, Email</li>
                <li>Duplicate emails will be automatically skipped</li>
                <li>Use UTF-8 encoding for special characters</li>
                <li>Date format should be MM/DD/YYYY or YYYY-MM-DD</li>
                <li>Status options: Active, Inactive, Graduated</li>
                <li>Program Type options: Bachelor's, Master's, PhD</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportExportSection;