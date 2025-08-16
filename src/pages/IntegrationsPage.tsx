import React from 'react';
import { Zap, Calendar, Mail, Database, ExternalLink } from 'lucide-react';
import CalendlyIntegrationPanel from '../components/CalendlyIntegrationPanel';

const IntegrationsPage: React.FC = () => {
  const handleStudentCreated = () => {
    // Refresh any relevant data
    window.dispatchEvent(new CustomEvent('studentUpdated'));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Integrations</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Connect your CRM with external tools to automate workflows and sync data.
        </p>
      </div>

      {/* Active Integrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CalendlyIntegrationPanel onStudentCreated={handleStudentCreated} />

        {/* Future Integrations */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <Mail className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Email Integration</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Coming soon</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sync with Gmail, Outlook, or other email providers to automatically log email interactions with students.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <Database className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">SIS Integration</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Coming soon</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Connect with your Student Information System to automatically sync enrollment data and academic records.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <Zap className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Zapier Integration</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Coming soon</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Connect with 5,000+ apps through Zapier to create custom automation workflows.
            </p>
          </div>
        </div>
      </div>

      {/* Integration Guide */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Integration Setup Guide</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">📅 Calendly Webhook Setup</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>Log into your Calendly account and go to Integrations → Webhooks</li>
                <li>Click "Create Webhook" and enter your webhook URL</li>
                <li>Subscribe to "Invitee Created" events</li>
                <li>Add these form fields to your event types:
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                    <li><strong>Program Type:</strong> Dropdown (Bachelor's, Master's, PhD)</li>
                    <li><strong>Degree Program:</strong> Text field or dropdown</li>
                    <li><strong>Year of Study:</strong> Dropdown (1st year, 2nd year, etc.)</li>
                    <li><strong>Major/Specialization:</strong> Text field (for Business Admin students)</li>
                  </ul>
                </li>
                <li>Test the integration using the test button above</li>
              </ol>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h5 className="font-medium text-blue-900 dark:text-blue-300 mb-2">🔧 Technical Requirements</h5>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Webhook endpoint that can receive POST requests</li>
                <li>• HTTPS URL (required by Calendly)</li>
                <li>• Ability to process JSON payloads</li>
                <li>• Optional: Webhook signature verification for security</li>
              </ul>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h5 className="font-medium text-green-900 dark:text-green-300 mb-2">✨ What Happens Automatically</h5>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <li>• New student profile created with booking information</li>
                <li>• Consultation record added with meeting details</li>
                <li>• Academic information extracted from form responses</li>
                <li>• Existing students get new consultations added</li>
                <li>• Academic year progression calculated automatically</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsPage;