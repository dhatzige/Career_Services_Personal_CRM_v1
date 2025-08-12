import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/CleanSupabaseAuth';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  Settings, 
  LogOut, 
  Moon, 
  Sun,
  User,
  Plus,
  FileText,
  Keyboard,
  HelpCircle,
  Calendar,
  Zap,
  Briefcase,
  Sparkles,
  Clock,
  BarChart3
} from 'lucide-react';
import { THEME_KEY } from '../utils/constants';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useDebouncedSearch } from '../utils/search';
import RecentlyViewed from './RecentlyViewed';
import QuickNoteModal from './QuickNoteModal';
import HelpModal from './HelpModal';
import OfflineIndicator from './OfflineIndicator';
import AIAssistant from './AIAssistant';
import { Student } from '../types/student';
import { announceToScreenReader } from '../utils/accessibility';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showQuickNote, setShowQuickNote] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { signOut, user } = useAuth();
  const { actualTheme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();


  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[aria-label="User menu"]') && !target.closest('.absolute')) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [userMenuOpen]);

  const debouncedSearch = useDebouncedSearch((query: string) => {
    if (query.trim()) {
      navigate(`/students?search=${encodeURIComponent(query)}`);
    }
  });

  useKeyboardShortcuts({
    onNewStudent: () => {
      navigate('/students');
      announceToScreenReader('Opening new student form');
    },
    onSearch: () => {
      const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
        announceToScreenReader('Search focused');
      }
    },
    onQuickNote: () => {
      setShowQuickNote(true);
      announceToScreenReader('Opening quick note modal');
    },
    onEscape: () => {
      setShowQuickNote(false);
      setShowShortcuts(false);
      setShowHelp(false);
    }
  });

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Help modal (?)
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setShowHelp(true);
        }
      }
      
      // Settings (Ctrl+,)
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        navigate('/settings');
      }
      
      // Advanced search (Ctrl+K)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Open advanced search modal
        announceToScreenReader('Advanced search shortcut pressed');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const toggleDarkMode = () => {
    const newTheme = actualTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    announceToScreenReader(`Switched to ${newTheme} mode`);
  };


  const handleLogout = async () => {
    await signOut();
    announceToScreenReader('Logged out successfully');
  };

  const handleStudentClick = (student: Student) => {
    navigate('/students');
  };


  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, shortcut: 'Alt+1' },
    { name: "Today's Schedule", href: '/today', icon: Clock, shortcut: 'Alt+2' },
    { name: 'Students', href: '/students', icon: Users, shortcut: 'Alt+3' },
    { name: 'Career Services', href: '/career', icon: Briefcase, shortcut: 'Alt+4' },
    { name: 'Calendar', href: '/calendar', icon: Calendar, shortcut: 'Alt+5' },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, shortcut: 'Alt+6' },
    { name: 'Reports', href: '/reports', icon: FileText, shortcut: 'Alt+7' },
    { name: 'Settings', href: '/settings', icon: Settings, shortcut: 'Alt+8' },
  ];

  const shortcuts = [
    { key: 'Alt + 1-8', action: 'Navigate to pages' },
    { key: 'Ctrl + Shift + N', action: 'Quick Note' },
    { key: 'Ctrl + ,', action: 'Settings' },
    { key: '?', action: 'Help' },
    { key: 'Esc', action: 'Close Modal' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
      >
        Skip to main content
      </a>

      {/* Mobile sidebar with overlay */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
        sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
          onClick={() => setSidebarOpen(false)} 
        />
        <div className={`fixed inset-y-0 left-0 flex w-64 flex-col bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Career CRM</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-md p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 overflow-y-auto" role="navigation" aria-label="Main navigation">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg mb-2 transition-all duration-200 ${
                    location.pathname === item.href
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:translate-x-1'
                  }`}
                  aria-current={location.pathname === item.href ? 'page' : undefined}
                >
                  <Icon className="h-5 w-5 mr-3 flex-shrink-0" aria-hidden="true" />
                  <span className="flex-1">{item.name}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">{item.shortcut}</span>
                </Link>
              );
            })}
          </nav>
          
          {/* Mobile Theme Controls */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label={`Switch to ${actualTheme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {actualTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
            <RecentlyViewed onStudentClick={handleStudentClick} />
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-800 px-6 pb-4 shadow-lg border-r border-gray-200 dark:border-gray-700">
          <div className="flex h-16 shrink-0 items-center border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Career CRM</h1>
          </div>
          <nav className="flex flex-1 flex-col" role="navigation" aria-label="Main navigation">
            <ul className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          className={`flex gap-x-3 rounded-lg p-3 text-sm font-semibold leading-6 transition-colors ${
                            location.pathname === item.href
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          aria-current={location.pathname === item.href ? 'page' : undefined}
                          title={`${item.name} (${item.shortcut})`}
                        >
                          <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
              <li className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <RecentlyViewed onStudentClick={handleStudentClick} />
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 bg-white dark:bg-gray-800 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 border-b border-gray-200 dark:border-gray-700">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-300 lg:hidden hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Quick Actions */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowQuickNote(true)}
                  className="p-2 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  title="Quick Note (Ctrl+Shift+N)"
                  aria-label="Open quick note modal"
                >
                  <FileText className="h-5 w-5" />
                </button>

                
                <button
                  onClick={() => setShowShortcuts(true)}
                  className="p-2 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  title="Keyboard Shortcuts"
                  aria-label="Show keyboard shortcuts"
                >
                  <Keyboard className="h-5 w-5" />
                </button>

                <button
                  onClick={() => setShowHelp(true)}
                  className="p-2 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  title="Help (?)"
                  aria-label="Open help documentation"
                >
                  <HelpCircle className="h-5 w-5" />
                </button>
              </div>

              {/* Theme toggles */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={toggleDarkMode}
                  className="p-2 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  title="Toggle theme"
                  aria-label={`Switch to ${actualTheme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {actualTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>

              </div>

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-x-2 rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="User menu"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="h-8 w-8 bg-blue-600 dark:bg-blue-700 rounded-full flex items-center justify-center text-white font-semibold">
                    {user?.email ? user.email.charAt(0).toUpperCase() : 'A'}
                  </div>
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                        {user?.email || 'User'}
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <main id="main-content" className="py-6" role="main">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Modals */}
      <QuickNoteModal
        isOpen={showQuickNote}
        onClose={() => setShowQuickNote(false)}
        onNoteAdded={() => {
          announceToScreenReader('Note added successfully');
        }}
      />


      <HelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />

      {/* AI Assistant Modal */}
      {showAIAssistant && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setShowAIAssistant(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl h-[600px]">
              <AIAssistant onClose={() => setShowAIAssistant(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Assistant Button */}
      <button
        onClick={() => setShowAIAssistant(true)}
        className="fixed bottom-6 right-6 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-40"
        title="Open AI Career Assistant"
        aria-label="Open AI Career Assistant"
      >
        <Sparkles className="h-6 w-6" />
      </button>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" onClick={() => setShowShortcuts(false)} />
            
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full" role="dialog" aria-labelledby="shortcuts-title" aria-modal="true">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <Keyboard className="h-5 w-5 text-blue-600" />
                  <h3 id="shortcuts-title" className="text-lg font-medium text-gray-900 dark:text-white">
                    Keyboard Shortcuts
                  </h3>
                </div>
                <button
                  onClick={() => setShowShortcuts(false)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  aria-label="Close shortcuts modal"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="space-y-3">
                  {shortcuts.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {shortcut.action}
                      </span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
};

export default Layout;