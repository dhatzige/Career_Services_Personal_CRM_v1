import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../contexts/CleanSupabaseAuth';
import { verifySupabaseOperations } from '../utils/testSupabaseConnection';

export default function SupabaseStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [details, setDetails] = useState<any>(null);
  const [operations, setOperations] = useState<any>(null);

  const checkConnection = async () => {
    setStatus('checking');
    try {
      // Check basic connection
      const { error } = await supabase.from('students').select('count').limit(1);
      
      if (error) {
        setStatus('error');
        setDetails({ error: error.message });
      } else {
        setStatus('connected');
        
        // Check all operations
        const ops = await verifySupabaseOperations();
        setOperations(ops);
        
        // Get some stats
        const { count: studentCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true });
          
        const { count: noteCount } = await supabase
          .from('notes')
          .select('*', { count: 'exact', head: true });
          
        const { count: consultationCount } = await supabase
          .from('consultations')
          .select('*', { count: 'exact', head: true });
        
        setDetails({
          students: studentCount || 0,
          notes: noteCount || 0,
          consultations: consultationCount || 0,
          url: import.meta.env.VITE_SUPABASE_URL
        });
      }
    } catch (err) {
      setStatus('error');
      setDetails({ error: 'Failed to connect to Supabase' });
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
          Supabase Connection Status
          {status === 'connected' && <CheckCircle className="h-5 w-5 text-green-500" />}
          {status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
          {status === 'checking' && <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />}
        </h3>
        <button
          onClick={checkConnection}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {status === 'connected' && details && (
        <div className="space-y-3">
          <div className="text-sm">
            <p className="text-gray-600 dark:text-gray-400">Database URL:</p>
            <p className="font-mono text-xs text-gray-700 dark:text-gray-300 truncate">
              {details.url}
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Students</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{details.students}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Notes</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{details.notes}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Consultations</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{details.consultations}</p>
            </div>
          </div>

          {operations && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Table Access:</p>
              <div className="space-y-1">
                {Object.entries(operations).map(([table, working]) => (
                  <div key={table} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-gray-600 dark:text-gray-400">{table}</span>
                    {working ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {status === 'error' && details && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 mt-3">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">Connection Error</p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{details.error}</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                Check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}