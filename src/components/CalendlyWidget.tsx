import React, { useEffect } from 'react';
import { Calendar } from 'lucide-react';

interface CalendlyWidgetProps {
  url: string;
  studentName?: string;
  studentEmail?: string;
  height?: string;
}

declare global {
  interface Window {
    Calendly: any;
  }
}

export default function CalendlyWidget({ 
  url, 
  studentName, 
  studentEmail,
  height = '650px' 
}: CalendlyWidgetProps) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const openPopupWidget = () => {
    if (window.Calendly) {
      window.Calendly.initPopupWidget({
        url: url,
        prefill: {
          name: studentName,
          email: studentEmail,
          customAnswers: {
            a1: 'Career Services Appointment'
          }
        }
      });
    }
  };

  return (
    <div className="calendly-container">
      {/* Inline widget option */}
      <div 
        className="calendly-inline-widget" 
        data-url={url}
        style={{ minWidth: '320px', height: height }}
      />
      
      {/* Alternative: Button to open popup */}
      <div className="mt-4 text-center">
        <button
          onClick={openPopupWidget}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Calendar className="h-5 w-5 mr-2" />
          Schedule in Popup
        </button>
      </div>

      {/* Calendly CSS */}
      <link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet" />
    </div>
  );
}