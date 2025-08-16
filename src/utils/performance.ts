import LZString from 'lz-string';
import React from 'react';

// Debounce utility for performance optimization
export const debounce = <T extends unknown[]>(
  func: (...args: T) => void,
  delay: number
): ((...args: T) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: T) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Throttle utility for performance optimization
export const throttle = <T extends unknown[]>(
  func: (...args: T) => void,
  delay: number
): ((...args: T) => void) => {
  let lastCall = 0;
  return (...args: T) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

// Compress and store data in localStorage
export const setCompressedItem = <T>(key: string, value: T): void => {
  try {
    const jsonString = JSON.stringify(value);
    const compressed = LZString.compress(jsonString);
    localStorage.setItem(key, compressed);
  } catch (error) {
    console.error('Failed to compress and store data:', error);
    // Fallback to regular storage
    localStorage.setItem(key, JSON.stringify(value));
  }
};

export const getCompressedItem = <T>(key: string): T | null => {
  try {
    const compressed = localStorage.getItem(key);
    if (!compressed) return null;
    
    // Try to decompress first
    const decompressed = LZString.decompress(compressed);
    if (decompressed) {
      return JSON.parse(decompressed);
    }
    
    // Fallback: try to parse as regular JSON (for backward compatibility)
    return JSON.parse(compressed);
  } catch (error) {
    console.error('Failed to decompress and parse data:', error);
    return null;
  }
};

// Lazy loading utility
export const lazyLoad = (importFunc: () => Promise<{ default: React.ComponentType<unknown> }>) => {
  return React.lazy(importFunc);
};

// Memory usage monitoring
export const getMemoryUsage = (): MemoryInfo | null => {
  if ('memory' in performance) {
    return (performance as Performance & { memory: MemoryInfo }).memory;
  }
  return null;
};

// Performance metrics collection
interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: MemoryInfo | null;
}

export const collectPerformanceMetrics = (): PerformanceMetrics => {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  return {
    loadTime: navigation.loadEventEnd - navigation.loadEventStart,
    renderTime: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
    memoryUsage: getMemoryUsage()
  };
};

// Virtual scrolling utilities
export const calculateVisibleItems = (
  scrollTop: number,
  itemHeight: number,
  containerHeight: number,
  totalItems: number
): { startIndex: number; endIndex: number; visibleItems: number } => {
  const startIndex = Math.floor(scrollTop / itemHeight);
  const visibleItems = Math.min(Math.ceil(containerHeight / itemHeight) + 1, totalItems);
  const endIndex = Math.min(startIndex + visibleItems, totalItems);
  
  return { startIndex, endIndex, visibleItems };
};

// Image lazy loading
export const setupImageLazyLoading = (
  imageSelector: string = 'img[data-src]',
  rootMargin: string = '100px'
): IntersectionObserver => {
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;
        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      }
    });
  }, { rootMargin });

  document.querySelectorAll(imageSelector).forEach(img => {
    imageObserver.observe(img);
  });

  return imageObserver;
};

// Virtual list item height calculator
export const calculateItemHeight = (index: number, data: any[]): number => {
  // Base height for student cards
  const baseHeight = 200;
  const item = data[index];
  
  if (!item) return baseHeight;
  
  // Add height for additional content
  let additionalHeight = 0;
  
  if (item.notes?.length > 0) {
    additionalHeight += Math.min(item.notes.length * 20, 60);
  }
  
  if (item.consultations?.length > 0) {
    additionalHeight += 20;
  }
  
  return baseHeight + additionalHeight;
};

// Cache management
class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
}

export const cacheManager = new CacheManager();