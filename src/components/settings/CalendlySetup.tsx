import React, { useState } from 'react';
import { Calendar, CheckCircle, Webhook, RefreshCw } from 'lucide-react';
import { toast } from '../ui/toast';

export default function CalendlySetup() {
  const [syncing, setSyncing] = useState(false);

  const handleManualSync = async () => {
    try {
      setSyncing(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/calendar/webhook/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`Synced ${result.syncedCount} events from Calendly`);
      } else {
        toast.error('Failed to sync Calendly events');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Failed to connect to Calendly');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
        <div className="flex items-start">
          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 mr-3 mt-0.5" />
          <div>
            <h3 className="text-lg font-medium text-green-900 dark:text-green-100 mb-2">
              Calendly Integration Active
            </h3>
            <p className="text-green-700 dark:text-green-200 text-sm">
              Your Calendly integration is working correctly. Meetings are automatically synced to your CRM.
            </p>
          </div>
        </div>
      </div>

      {/* Manual Sync */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Manual Sync</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              If you notice missing meetings, you can manually sync with Calendly.
            </p>
          </div>
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      {/* Configuration Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start">
          <Webhook className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
          <div>
            <h4 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
              How Calendly Integration Works
            </h4>
            <ul className="text-blue-700 dark:text-blue-200 text-sm space-y-2">
              <li>• Production: Webhooks automatically sync new bookings</li>
              <li>• Development: Use "Sync Now" button to fetch recent bookings</li>
              <li>• Student profiles are auto-created from booking info</li>
              <li>• Consultations appear in Today's Schedule and Calendar</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Webhook URL for Reference */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Webhook Configuration</h4>
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Production Webhook URL:
            </label>
            <code className="block text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded border text-gray-800 dark:text-gray-200">
              https://career-services-personal-crm.fly.dev/api/calendar/webhook/calendly
            </code>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Development URL:
            </label>
            <code className="block text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded border text-gray-800 dark:text-gray-200">
              http://localhost:4001/api/calendar/webhook/calendly
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}