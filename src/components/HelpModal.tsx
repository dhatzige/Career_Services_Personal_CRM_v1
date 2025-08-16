import React, { useState } from 'react';
import { X, HelpCircle, Keyboard, Search, Users, Calendar, Settings, FileText, Zap } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
    { id: 'getting-started', label: 'Getting Started', icon: Zap },
    { id: 'students', label: 'Managing Students', icon: Users },
    { id: 'consultations', label: 'Consultations', icon: Calendar },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'search', label: 'Search & Filters', icon: Search },
    { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: Keyboard },
    { id: 'analytics', label: 'Analytics & Reports', icon: Settings }
  ];

  const shortcuts = [
    { key: 'Alt + 1', action: 'Go to Dashboard' },
    { key: 'Alt + 2', action: "Go to Today's Schedule" },
    { key: 'Alt + 3', action: 'Go to Students' },
    { key: 'Alt + 4', action: 'Go to Career Services' },
    { key: 'Alt + 5', action: 'Go to Calendar' },
    { key: 'Alt + 6', action: 'Go to Analytics' },
    { key: 'Alt + 7', action: 'Go to Reports' },
    { key: 'Alt + 8', action: 'Go to Settings' },
    { key: 'Ctrl + Shift + N', action: 'Open Quick Note' },
    { key: 'Ctrl + ,', action: 'Open Settings' },
    { key: '?', action: 'Show this Help' },
    { key: 'Esc', action: 'Close Modal/Dialog' }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'getting-started':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Getting Started</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Welcome to Career Services CRM</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  A comprehensive system for university career services to track student consultations, manage career development, and analyze engagement patterns.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">First Steps</h4>
                <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400">
                  <li>Add your first student using the "Add Student" button</li>
                  <li>Create consultation records to track meetings</li>
                  <li>Use notes to record important information</li>
                  <li>Explore the dashboard for insights and analytics</li>
                </ol>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Key Features</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                  <li>Student management with career tracking</li>
                  <li>Consultation scheduling and no-show tracking</li>
                  <li>Comprehensive notes system with templates</li>
                  <li>Advanced filtering by year, program, and career status</li>
                  <li>Analytics dashboard with AI insights</li>
                  <li>Daily and weekly reports</li>
                  <li>Import/Export functionality for data migration</li>
                </ul>
              </div>
            </div>
          </div>
        );
        
      case 'students':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Managing Students</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Adding Students</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Click the "Add Student" button or use Ctrl+N to open the student creation form.
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                  <li>Step 1: Add an optional quick note</li>
                  <li>Step 2: Enter basic information (name, email, phone)</li>
                  <li>Step 3: Select academic details (year, program type, specific program)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Student Profiles</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Click on any student to view their detailed profile, including:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                  <li>Timeline of all interactions</li>
                  <li>Consultation history</li>
                  <li>Notes and tags</li>
                  <li>Contact information</li>
                  <li>Academic progress</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Bulk Actions</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Select multiple students to perform bulk actions like exporting data or adding tags.
                </p>
              </div>
            </div>
          </div>
        );
        
      case 'consultations':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Consultations</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Types of Consultations</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                  <li>1-to-1 consultation</li>
                  <li>CV review</li>
                  <li>LinkedIn optimization</li>
                  <li>Masters preparation</li>
                  <li>Interview preparation</li>
                  <li>Job navigation</li>
                  <li>Initial assessment</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Recording Consultations</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  From a student's profile, click "Add Consultation" to record:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                  <li>Consultation type and date</li>
                  <li>Duration and attendance status</li>
                  <li>Notes and outcomes</li>
                  <li>Follow-up requirements</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Calendar View</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Use the calendar view to see all consultations at a glance and identify scheduling patterns.
                </p>
              </div>
            </div>
          </div>
        );
        
      case 'notes':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notes System</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Creating Notes</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Add notes from student profiles or use the quick note feature (Ctrl+Shift+N).
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                  <li>Choose from note templates for common scenarios</li>
                  <li>Different note types (General, Academic, Career, etc.)</li>
                  <li>Pin important notes to keep them visible</li>
                  <li>Privacy settings for sensitive notes</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Note Templates</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Use pre-built templates for:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                  <li>Initial consultations</li>
                  <li>CV reviews</li>
                  <li>Interview preparation</li>
                  <li>Follow-up meetings</li>
                  <li>Masters preparation</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Quick Notes</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Use Ctrl+Shift+N to quickly add notes from anywhere in the application without navigating to a student profile.
                </p>
              </div>
            </div>
          </div>
        );
        
      case 'search':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Search & Filters</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Basic Search</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Use the search bar to find students by name, email, major, or year of study.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Advanced Filters</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Use the Filters button to access advanced filtering options:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                  <li>Academic Year (1st-4th year, Graduate, Alumni)</li>
                  <li>Degree Program (Bachelor's, Master's)</li>
                  <li>Career Status (Active job seekers, Employed, etc.)</li>
                  <li>Student Activity (Recently viewed, Has notes, Resume on file)</li>
                  <li>Consultation Status (Had consultations, Upcoming, High no-shows)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Clickable Stats Cards</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Click on any statistics card at the top of the Students page to instantly filter:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                  <li>Total Students - View all students</li>
                  <li>Active Job Seekers - Students actively searching</li>
                  <li>Employed/Offers - Successfully placed students</li>
                  <li>Resumes on File - Students with uploaded resumes</li>
                  <li>High No-Shows - Students needing follow-up</li>
                </ul>
              </div>
            </div>
          </div>
        );
        
      case 'shortcuts':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Keyboard Shortcuts</h3>
            
            <div className="space-y-3">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-gray-700 dark:text-gray-300">{shortcut.action}</span>
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Tip:</strong> Most shortcuts work globally throughout the application. 
                Some may be context-specific when you're in forms or modals.
              </p>
            </div>
          </div>
        );
        
      case 'analytics':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics & Reports</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Analytics Dashboard</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  View comprehensive metrics including student engagement, consultation trends, and career placement statistics.
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 mt-2">
                  <li>Real-time student engagement scoring</li>
                  <li>Career status distribution charts</li>
                  <li>Program-wise analytics</li>
                  <li>AI-generated insights and recommendations</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Daily Reports</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Automatically generated summaries of daily activities including consultations, new students, and important notes.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Weekly Reports</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Comprehensive weekly overviews with trends, high-engagement students, and upcoming consultation schedules.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Export Options</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Export data in multiple formats (CSV, Excel, PDF) for further analysis or sharing with stakeholders.
                </p>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <HelpCircle className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Help & Documentation
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex h-[70vh]">
            {/* Sidebar */}
            <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
              <nav className="p-4 space-y-1">
                {sections.map(section => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{section.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;