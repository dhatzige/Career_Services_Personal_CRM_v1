import React, { useState, useRef, useEffect } from 'react';
import { Download, Upload, Save, RefreshCw, AlertCircle, CheckCircle, FileJson, Archive } from 'lucide-react';
import api from '../../services/api';
import { toast } from '../ui/toast';

interface Backup {
  filename: string;
  size: number;
  created: string;
  modified: string;
}

export default function BackupRestore() {
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [importOptions, setImportOptions] = useState({
    mergeExisting: false,
    skipExisting: true,
    importUsers: false
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const response = await api.get('/backup/list');
      setBackups(response.data.backups);
    } catch (error) {
      console.error('Error loading backups:', error);
      // In development, don't show errors for missing auth
      if (import.meta.env.DEV && error.response?.status === 401) {
        console.warn('Backup API not available in development mode');
        setBackups([]); // Set empty backups to prevent UI issues
      }
    }
  };

  const handleExport = async (format: 'json' | 'zip') => {
    try {
      setLoading(true);
      const response = await api.get('/backup/export', {
        params: {
          format,
          includeFiles: format === 'zip'
        },
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data], {
        type: format === 'zip' ? 'application/zip' : 'application/json'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = format === 'zip' ? 'crm_backup.zip' : 'crm_export.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
      console.error('Export error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (file: File) => {
    try {
      setLoading(true);
      
      // Read file content
      const content = await file.text();
      const data = JSON.parse(content);

      // Validate data structure
      if (!data.metadata || !data.data) {
        throw new Error('Invalid import file format');
      }

      const response = await api.post('/backup/import', {
        data,
        options: importOptions
      });

      if (response.data.success) {
        toast.success(`Import completed! Imported: ${JSON.stringify(response.data.results.imported)}`);
        if (response.data.results.errors.length > 0) {
          console.warn('Import errors:', response.data.results.errors);
        }
      }
    } catch (error) {
      toast.error('Failed to import data');
      console.error('Import error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setLoading(true);
      const response = await api.post('/backup/create');
      
      if (response.data.success) {
        toast.success('Backup created successfully');
        loadBackups();
      }
    } catch (error) {
      toast.error('Failed to create backup');
      console.error('Backup error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (filename: string) => {
    if (!window.confirm('Are you sure you want to restore from this backup? This may overwrite existing data.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(`/backup/restore/${filename}`, {
        clearExisting: false
      });

      if (response.data.success) {
        toast.success('Backup restored successfully');
        window.location.reload(); // Reload to show restored data
      }
    } catch (error) {
      toast.error('Failed to restore backup');
      console.error('Restore error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Export Data
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Export all your CRM data for backup or transfer purposes.
        </p>

        <div className="flex gap-4">
          <button
            onClick={() => handleExport('json')}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <FileJson className="h-5 w-5" />
            Export as JSON
          </button>

          <button
            onClick={() => handleExport('zip')}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Archive className="h-5 w-5" />
            Export as ZIP (with files)
          </button>
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Import Data
        </h3>

        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Import data from a previously exported JSON file.
          </p>

          {/* Import Options */}
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={importOptions.skipExisting}
                onChange={(e) => setImportOptions({
                  ...importOptions,
                  skipExisting: e.target.checked,
                  mergeExisting: !e.target.checked
                })}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Skip existing records (recommended)
              </span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={importOptions.importUsers}
                onChange={(e) => setImportOptions({
                  ...importOptions,
                  importUsers: e.target.checked
                })}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Import user accounts
              </span>
            </label>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImport(file);
              }}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Upload className="h-5 w-5" />
              Select File to Import
            </button>
          </div>
        </div>
      </div>

      {/* Backup Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Backup Management
          </h3>
          <button
            onClick={handleCreateBackup}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            Create Backup
          </button>
        </div>

        {backups.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              No backups found. Create your first backup to protect your data.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {backups.map((backup) => (
              <div
                key={backup.filename}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {backup.filename}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatFileSize(backup.size)} • Created: {new Date(backup.created).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleRestore(backup.filename)}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-1">Backup Best Practices:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Create regular backups before major changes</li>
              <li>Export as ZIP to include uploaded files</li>
              <li>Store backups in a secure location</li>
              <li>Test restore functionality periodically</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}