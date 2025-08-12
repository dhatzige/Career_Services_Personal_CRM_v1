import { useEffect } from 'react';

interface KeyboardShortcuts {
  onNewStudent?: () => void;
  onSearch?: () => void;
  onQuickNote?: () => void;
  onEscape?: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return;
      }

      // Ctrl+N for new student
      if (event.ctrlKey && event.key === 'n' && shortcuts.onNewStudent) {
        event.preventDefault();
        shortcuts.onNewStudent();
      }

      // / for search
      if (event.key === '/' && shortcuts.onSearch) {
        event.preventDefault();
        shortcuts.onSearch();
      }

      // Ctrl+Shift+N for quick note
      if (event.ctrlKey && event.shiftKey && event.key === 'N' && shortcuts.onQuickNote) {
        event.preventDefault();
        shortcuts.onQuickNote();
      }

      // Escape key
      if (event.key === 'Escape' && shortcuts.onEscape) {
        shortcuts.onEscape();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};