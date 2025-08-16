import React, { useState } from 'react';
import { CheckCircle, AlertCircle, RefreshCw, ExternalLink, Calendar, Zap, Plus } from 'lucide-react';
import { simulateCalendlyEvent } from '../utils/calendlyIntegration';

interface CalendlyIntegrationPanelProps {
  onStudentCreated?: () => void;
}

interface TestResult {
  success: boolean;
  error?: string;
  isNewStudent?: boolean;
  consultationType?: string;
  eventTime?: string;
}

const CalendlyIntegrationPanel: React.FC<CalendlyIntegrationPanelProps> = ({ onStudentCreated }) => {
  const [isTestMode, setIsTestMode] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTestIntegration = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      const result = await simulateCalendlyEvent(
        'Test Student',
        'test.student@university.edu',
        'Initial Consultation',
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        45,
        [
          { question: 'What program are you in?', answer: 'Computer Science' },
          { question: 'What year are you?', answer: '2nd year' },
          { question: 'What would you like to discuss?', answer: 'Career planning and internship opportunities' }
        ]
      );

      setTestResult(result);
      if (result?.success && onStudentCreated) {
        onStudentCreated();
      }
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Test failed'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
            <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Calendly Integration</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Automatically create students from Calendly bookings</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">Integration Ready</span>
            </div>
            <span className="text-xs text-green-600 dark:text-green-400">Configured</span>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Features:</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <span>Auto-create student profiles from new bookings</span>
              </li>
              <li className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <span>Extract program info from booking forms</span>
              </li>
              <li className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <span>Create consultation records automatically</span>
              </li>
              <li className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <span>Handle existing students gracefully</span>
              </li>
            </ul>
          </div>

          {/* Setup Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Setup Instructions:</h4>
            <ol className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
              <li>Go to your Calendly account → Integrations → Webhooks</li>
              <li>Create a new webhook with URL: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">https://your-domain.com/api/calendly-webhook</code></li>
              <li>Subscribe to "Invitee Created" events</li>
              <li>Add form fields to collect: Program, Year of Study, Major (optional)</li>
              <li>Test the integration using the button below</li>
            </ol>
          </div>

          {/* Test Integration */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Test Integration</h4>
              <button
                onClick={() => setIsTestMode(!isTestMode)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
              >
                {isTestMode ? 'Hide' : 'Show'} Test Panel
              </button>
            </div>

            {isTestMode && (
              <div className="space-y-3">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  This will simulate a Calendly booking and create a test student with consultation.
                </p>
                
                <button
                  onClick={handleTestIntegration}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {loading ? 'Testing...' : 'Test Integration'}
                </button>

                {testResult && (
                  <div className={`p-3 rounded-lg border ${
                    testResult.success
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}>
                    <div className="flex items-start space-x-2">
                      {testResult.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                      )}
                      <div className="text-xs">
                        {testResult.success ? (
                          <div className={`${testResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                            <p className="font-medium">✅ Integration Test Successful!</p>
                            <p>Created {testResult.isNewStudent ? 'new' : 'existing'} student with {testResult.consultationType} consultation</p>
                            <p>Event time: {new Date(testResult.eventTime).toLocaleString()}</p>
                          </div>
                        ) : (
                          <div className="text-red-700 dark:text-red-300">
                            <p className="font-medium">❌ Test Failed</p>
                            <p>{testResult.error}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* External Links */}
          <div className="flex space-x-2">
            <a
              href="https://calendly.com/integrations/webhooks"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Calendly Webhooks
            </a>
            <a
              href="https://developer.calendly.com/api-docs/b3A6MjYxNDM5NzE-webhooks"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              API Docs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendlyIntegrationPanel;