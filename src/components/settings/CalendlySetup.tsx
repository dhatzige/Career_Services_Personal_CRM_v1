import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, AlertCircle, Webhook, RefreshCw, ExternalLink } from 'lucide-react';
import api from '../../services/api';
import { toast } from '../ui/toast';

export default function CalendlySetup() {
  const [loading, setLoading] = useState(true);
  const [setupLoading, setSetupLoading] = useState(false);
  const [calendlyInfo, setCalendlyInfo] = useState<any>(null);
  const [webhookUrl, setWebhookUrl] = useState('');

  useEffect(() => {
    loadCalendlyInfo();
    
    // Generate webhook URL
    const baseUrl = window.location.origin.replace(':5173', ':4001');
    setWebhookUrl(`${baseUrl}/api/calendar/webhook/calendly`);
  }, []);

  const loadCalendlyInfo = async () => {
    try {
      setLoading(true);
      const response = await api.get('/setup/calendly-info');
      setCalendlyInfo(response.data.data);
    } catch (error) {
      console.error('Error loading Calendly info:', error);
      if (error.response?.status === 401) {
        // In development, show a warning instead of error
        if (import.meta.env.DEV) {
          console.warn('Calendly API not available in development mode');
        } else {
          toast.error('Calendly API key is invalid or expired');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const setupWebhook = async () => {
    try {
      setSetupLoading(true);
      // Use the simpler webhook setup endpoint
      const response = await api.post('/calendar/webhook/setup', {
        webhookUrl
      });
      
      toast.success('Calendly webhook configured successfully!');
      
      // Update the .env file note
      console.log('Webhook Secret:', response.data.data.webhookSecret);
      toast.info(`Save this webhook secret in your .env file: ${response.data.data.webhookSecret}`);
      
      // Reload info
      await loadCalendlyInfo();
    } catch (error) {
      console.error('Error setting up webhook:', error);
      toast.error('Failed to setup Calendly webhook');
    } finally {
      setSetupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Calendly Integration Setup
          </h2>
        </div>

        {calendlyInfo ? (
          <>
            {/* Account Info */}
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-900 dark:text-green-100">
                    Connected to Calendly
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    {calendlyInfo.user.name} ({calendlyInfo.user.email})
                  </p>
                  <a
                    href={calendlyInfo.user.schedulingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400 hover:underline mt-1"
                  >
                    {calendlyInfo.user.schedulingUrl}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Event Types */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                Available Event Types
              </h3>
              <div className="space-y-2">
                {(calendlyInfo.eventTypes || []).map((eventType: any) => (
                  <div
                    key={eventType.slug || eventType.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {eventType.name || eventType.slug || 'Unnamed Event'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {eventType.duration || '30'} minutes • {eventType.active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <a
                      href={eventType.schedulingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Webhook Setup */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                Webhook Configuration
              </h3>
              
              {calendlyInfo.webhooks.length > 0 ? (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg mb-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-100">
                        Webhook Configured
                      </p>
                      {calendlyInfo.webhooks.map((webhook: any, index: number) => (
                        <div key={index} className="text-sm text-green-700 dark:text-green-300 mt-1">
                          <p className="font-mono text-xs">{webhook.callbackUrl}</p>
                          <p className="text-xs">Events: {webhook.events.join(', ')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-900 dark:text-yellow-100">
                          Webhook Not Configured
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          Set up a webhook to automatically sync Calendly events with your CRM.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Webhook URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        readOnly
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(webhookUrl);
                          toast.success('Webhook URL copied');
                        }}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={setupWebhook}
                    disabled={setupLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {setupLoading ? (
                      <RefreshCw className="h-5 w-5 animate-spin" />
                    ) : (
                      <Webhook className="h-5 w-5" />
                    )}
                    {setupLoading ? 'Setting up...' : 'Setup Webhook'}
                  </button>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Setup Instructions
              </h4>
              <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-decimal list-inside">
                <li>Your Calendly API token has been configured</li>
                <li>Click "Setup Webhook" to automatically configure event syncing</li>
                <li>Save the webhook secret provided after setup to your .env file</li>
                <li>Test the integration by scheduling a test event</li>
              </ol>
            </div>
          </>
        ) : (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-100">
                  Unable to Connect to Calendly
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Please check your Calendly API token in the .env file.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}