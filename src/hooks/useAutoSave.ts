import { useEffect, useCallback } from 'react';
import { debounce } from '../utils/performance';

export const useAutoSave = <T>(
  data: T,
  key: string,
  delay: number = 1000
) => {
  // Debounced save function
  const debouncedSave = useCallback(
    debounce((dataToSave: T) => {
      try {
        localStorage.setItem(key, JSON.stringify(dataToSave));
      } catch (error) {
        console.error('Failed to auto-save data:', error);
      }
    }, delay),
    [key, delay]
  );

  // Auto-save whenever data changes
  useEffect(() => {
    if (data) {
      debouncedSave(data);
    }
  }, [data, debouncedSave]);

  // Clear auto-saved data
  const clearAutoSave = useCallback(() => {
    localStorage.removeItem(key);
  }, [key]);

  // Load auto-saved data
  const loadAutoSave = useCallback((): T | null => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, [key]);

  return { clearAutoSave, loadAutoSave };
};