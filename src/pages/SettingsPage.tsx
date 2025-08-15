import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, Bell, Shield, Palette, Save, Download, Upload, Trash2, Database, Lock, Key, Sparkles, Calendar, Zap, Users, AlertCircle } from 'lucide-react';
import { activityLogger } from '../utils/activityLog';
import { useAuth } from '../contexts/CleanSupabaseAuth';
import { useTheme } from '../contexts/ThemeContext';
import { generateSampleData } from '../utils/sampleData';
import { exportToJSON } from '../utils/exportImport';
import CalendlySetup from '../components/settings/CalendlySetup';
import ImportExportSection from '../components/ImportExportSection';
import CalendlyIntegrationPanel from '../components/CalendlyIntegrationPanel';
import TeamManagement from '../components/settings/TeamManagement';

const SettingsPage: React.FC = () => {
  const { theme, setTheme, highContrast, setHighContrast } = useTheme();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [settings, setSettings] = useState({
    profile: {
      name: user?.user_metadata?.full_name || 'User',
      email: user?.email || '',
      phone: user?.user_metadata?.phone || '',
    },
    security: {
      sessionTimeout: 30,
      autoLogout: true,
    },
    appearance: {
      theme: 'system',
      language: 'en',
      highContrast: false,
      reducedMotion: false,
    },
    calendly: {
      calendlyUrl: localStorage.getItem('calendlyUrl') || '',
      enableCalendly: true,
      autoScheduleReminders: true,
    },
    accessibility: {
      screenReader: false,
      keyboardNavigation: true,
      announcements: true,
    }
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'calendly', label: 'Calendly', icon: Calendar },
    { id: 'integrations', label: 'Integrations', icon: Zap },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'data', label: 'Data Management', icon: Database }
  ];

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');

  // Update URL when tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    window.history.pushState(null, '', `/settings?tab=${tabId}`);
  };

  // Update active tab when URL parameter changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tabs.some(t => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Sync theme settings with ThemeContext
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        theme,
        highContrast
      }
    }));
  }, [theme, highContrast]);

  const handleSave = async () => {
    try {
      // Save general settings to localStorage  
      localStorage.setItem('app_settings', JSON.stringify(settings));
      
      // Settings saved successfully
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    }
  };

  const handleGenerateSampleData = () => {
    const count = parseInt(prompt('How many sample students to generate? (1-100)') || '25');
    if (count > 0 && count <= 100) {
      generateSampleData(count);
      alert(`Generated ${count} sample students successfully!`);
    }
  };

  const handleExportData = () => {
    exportToJSON();
  };

  const handleExportLogs = () => {
    const logs = activityLogger.exportLogs();
    const blob = new Blob([logs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const { signOut } = useAuth();
  
  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Profile Information</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Your profile information is managed through your Supabase account.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="mt-6">
                <a
                  href="https://supabase.com/dashboard/account/profile"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <User className="h-4 w-4 mr-2" />
                  Manage Profile on Supabase
                </a>
              </div>
            </div>
          </div>
        );

      case 'team':
        return <TeamManagement />;


      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Security Settings</h3>
              <div className="space-y-6">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Account Security</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Your account is managed through Supabase authentication.
                  </p>
                  <div className="flex space-x-3">
                    <a
                      href="https://supabase.com/dashboard/account/security"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Manage Account Security
                    </a>
                    <button
                      onClick={handleSignOut}
                      className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-600 text-sm font-medium rounded-md text-red-700 dark:text-red-300 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5" />
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      <p className="font-medium mb-1">Security Features:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>Secure authentication via Supabase</li>
                        <li>Encrypted data transmission</li>
                        <li>Regular security updates</li>
                        <li>Session management</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'calendly':
        return <CalendlySetup />;

      case 'ai':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">AI Settings</h3>
              <div className="space-y-6">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Claude API Configuration</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Configure your Claude API key to enable AI-generated reports and insights.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Claude API Key
                      </label>
                      <input
                        type="password"
                        value={settings.ai.claudeApiKey}
                        onChange={(e) => setSettings({
                          ...settings,
                          ai: { ...settings.ai, claudeApiKey: e.target.value }
                        })}
                        placeholder="sk-ant-api03-..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Get your API key from <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">console.anthropic.com</a>
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable AI Reports</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Generate monthly insights using AI</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.ai.enableAIReports}
                          onChange={(e) => setSettings({
                            ...settings,
                            ai: { ...settings.ai, enableAIReports: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-4">
                    <div className="flex items-start">
                      <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2 mt-0.5" />
                      <div className="text-xs text-blue-700 dark:text-blue-300">
                        <p className="font-medium mb-1">AI Features:</p>
                        <ul className="list-disc list-inside space-y-0.5">
                          <li>Monthly performance reports with insights</li>
                          <li>Trend analysis and recommendations</li>
                          <li>Student engagement patterns</li>
                          <li>Consultation effectiveness metrics</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Appearance & Accessibility</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Theme
                  </label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Language
                  </label>
                  <select
                    value={settings.appearance.language}
                    onChange={(e) => setSettings({
                      ...settings,
                      appearance: { ...settings.appearance, language: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">High Contrast Mode</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Increase contrast for better visibility</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={highContrast}
                        onChange={(e) => setHighContrast(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Reduced Motion</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Minimize animations and transitions</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.appearance.reducedMotion}
                        onChange={(e) => setSettings({
                          ...settings,
                          appearance: { ...settings.appearance, reducedMotion: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-8">
            {/* Warning Banner */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <div className="flex items-start">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-2">
                    ⚠️ Data Management - Use with Caution
                  </h3>
                  <p className="text-red-700 dark:text-red-200 text-sm">
                    These operations directly affect your database. Always backup your data before importing.
                    Bulk operations cannot be easily undone.
                  </p>
                </div>
              </div>
            </div>
            
            <ImportExportSection />
          </div>
        );

      case 'integrations':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">External Integrations</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Connect your CRM with external tools to automate workflows and sync data.
              </p>
            </div>

            <CalendlyIntegrationPanel onStudentCreated={() => {
              window.dispatchEvent(new CustomEvent('studentUpdated'));
            }} />

            {/* Future Integrations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                    <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Email Integration</h4>
                    <p className="text-xs text-gray-500">Coming soon</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sync with Gmail or Outlook to log email interactions.
                </p>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                    <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">SIS Integration</h4>
                    <p className="text-xs text-gray-500">Coming soon</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Connect with your Student Information System.
                </p>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                    <Zap className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Zapier Integration</h4>
                    <p className="text-xs text-gray-500">Coming soon</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Connect with 5,000+ apps through Zapier.
                </p>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                    <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">API Access</h4>
                    <p className="text-xs text-gray-500">Coming soon</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  RESTful API for custom integrations.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your account settings and preferences</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Mobile Tabs Dropdown */}
        <div className="sm:hidden border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3">
            <label htmlFor="tab-select" className="sr-only">Select a tab</label>
            <select
              id="tab-select"
              value={activeTab}
              onChange={(e) => handleTabChange(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {tabs.map(tab => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Desktop Tabs - Horizontal Scroll on Medium Screens */}
        <div className="hidden sm:block border-b border-gray-200 dark:border-gray-700">
          <nav className="flex overflow-x-auto px-4 sm:px-6 -mb-px scrollbar-hide">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center whitespace-nowrap space-x-1 lg:space-x-2 py-3 lg:py-4 px-2 lg:px-3 border-b-2 font-medium text-xs lg:text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden md:inline">{tab.label}</span>
                  <span className="md:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {renderTabContent()}
        </div>

        {/* Save Button */}
        <div className="flex justify-end px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSave}
            className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Save className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;