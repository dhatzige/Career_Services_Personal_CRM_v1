import React, { useEffect, useState } from 'react';
import { Calendar, ExternalLink, Settings, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { toast } from '../ui/toast';

declare global {
  interface Window {
    Calendly: any;
  }
}

interface CalendlyConfig {
  url?: string;
  user?: {
    name: string;
    email: string;
    schedulingUrl: string;
    timezone: string;
  };
  eventTypes: Array<{
    uri: string;
    name: string;
    slug: string;
    schedulingUrl: string;
    duration: number;
    color: string;
  }> | string[];
  embedOptions: {
    hideEventTypeDetails: boolean;
    hideLandingPageDetails: boolean;
    primaryColor: string;
    textColor: string;
    hideGdprBanner: boolean;
  };
}

interface CalendlyEmbedProps {
  studentEmail?: string;
  studentName?: string;
  prefillData?: {
    name?: string;
    email?: string;
  };
  onEventScheduled?: () => void;
}

export default function CalendlyEmbed({ 
  studentEmail, 
  studentName, 
  prefillData,
  onEventScheduled 
}: CalendlyEmbedProps) {
  const [config, setConfig] = useState<CalendlyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEventType, setSelectedEventType] = useState<any>(null);

  useEffect(() => {
    loadCalendlyConfig();
  }, []);

  const loadCalendlyConfig = async () => {
    try {
      const response = await api.get('/calendar/config/calendly');
      console.log('Calendly config loaded:', response.data);
      setConfig(response.data.data);
      
      // Set default event type
      const eventTypes = response.data.data.eventTypes;
      if (eventTypes && eventTypes.length > 0) {
        // If eventTypes are objects (from API), use the first one
        if (typeof eventTypes[0] === 'object') {
          setSelectedEventType(eventTypes[0]);
        } else {
          // Legacy string format
          setSelectedEventType(eventTypes[0]);
        }
      }
    } catch (error) {
      console.error('Error loading Calendly config:', error);
      if (error.response?.status === 404) {
        toast.error('Calendly integration not configured. Please contact your administrator.');
      } else {
        toast.error('Failed to load Calendly configuration');
      }
    } finally {
      setLoading(false);
    }
  };

  const openCalendlyPopup = () => {
    if (!config) {
      console.error('Calendly config not available');
      return;
    }

    let calendlyUrl = '';
    
    // Determine the URL based on config structure
    if (selectedEventType && typeof selectedEventType === 'object') {
      // New API format with event type objects
      calendlyUrl = selectedEventType.schedulingUrl;
    } else if (config.user?.schedulingUrl && selectedEventType) {
      // Using user scheduling URL with event type slug
      calendlyUrl = `${config.user.schedulingUrl}/${selectedEventType}`;
    } else if (config.url && selectedEventType) {
      // Legacy format
      calendlyUrl = `${config.url}/${selectedEventType}`;
    } else {
      toast.error('Unable to determine Calendly URL');
      console.error('Unable to determine URL:', { 
        selectedEventType, 
        configUser: config.user,
        configUrl: config.url 
      });
      return;
    }

    // Add prefill data to URL if available
    const params = new URLSearchParams();
    if (prefillData?.name || studentName) {
      params.append('name', prefillData?.name || studentName || '');
    }
    if (prefillData?.email || studentEmail) {
      params.append('email', prefillData?.email || studentEmail || '');
    }
    
    // Add UTM parameters
    params.append('utm_source', 'career-services-crm');
    params.append('utm_medium', 'direct');
    params.append('utm_campaign', 'student-scheduling');

    const finalUrl = `${calendlyUrl}?${params.toString()}`;
    console.log('Opening Calendly in new tab with URL:', finalUrl);

    try {
      // Open in a new tab/window to avoid permission issues
      const calendlyWindow = window.open(finalUrl, '_blank', 'width=1000,height=800');
      
      if (!calendlyWindow) {
        toast.error('Please allow popups to schedule meetings');
        return;
      }

      // Listen for messages from the opened window
      const checkInterval = setInterval(() => {
        try {
          // Check if window is closed
          if (calendlyWindow.closed) {
            clearInterval(checkInterval);
            // Optionally refresh meetings list
            if (onEventScheduled) {
              onEventScheduled();
            }
          }
        } catch (e) {
          // Window is from different origin, ignore
        }
      }, 1000);

      // Clean up after 5 minutes
      setTimeout(() => {
        clearInterval(checkInterval);
      }, 300000);

    } catch (error) {
      console.error('Error opening Calendly:', error);
      toast.error('Failed to open scheduling page');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Calendly Not Configured
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Please configure Calendly integration in the settings to enable scheduling.
        </p>
        <Link
          to="/settings"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <Settings className="h-4 w-4" />
          Go to Settings
        </Link>
      </div>
    );
  }

  // Show demo mode warning if using demo configuration
  if (config.isDemo) {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900 dark:text-yellow-100">
                Demo Mode
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Calendly integration is in demo mode. To enable real scheduling, add your Calendly API key to the .env file.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
          <div className="flex items-start gap-4">
            <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Schedule a Meeting (Demo)
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                In a real setup, clicking the button below would open your Calendly scheduling page.
              </p>
              <button
                onClick={() => toast.info('Demo mode - configure Calendly in .env file')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Calendar className="h-5 w-5" />
                Open Calendar (Demo)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {config.eventTypes.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Meeting Type
          </label>
          <select
            value={selectedEventType ? (typeof selectedEventType === 'object' ? selectedEventType.uri : selectedEventType) : ''}
            onChange={(e) => {
              const eventType = config.eventTypes.find(et => 
                typeof et === 'object' ? et.uri === e.target.value : et === e.target.value
              );
              setSelectedEventType(eventType);
            }}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            {config.eventTypes.map((type) => {
              if (typeof type === 'object') {
                return (
                  <option key={type.uri} value={type.uri}>
                    {type.name} ({type.duration} min)
                  </option>
                );
              } else {
                return (
                  <option key={type} value={type}>
                    {type.split('-').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </option>
                );
              }
            })}
          </select>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
        <div className="flex items-start gap-4">
          <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Schedule a Meeting
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Click the button below to open the scheduling calendar and book your appointment.
            </p>
            <button
              onClick={openCalendlyPopup}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Calendar className="h-5 w-5" />
              Open Calendar
            </button>
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-500 dark:text-gray-400">
        <p className="flex items-center gap-1">
          <ExternalLink className="h-3 w-3" />
          Powered by Calendly - scheduling will open in a popup window
        </p>
      </div>
    </div>
  );
}