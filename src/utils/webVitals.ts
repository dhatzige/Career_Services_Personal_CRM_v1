import { onCLS, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals';
import * as Sentry from '@sentry/react';

// Thresholds for performance metrics (in milliseconds)
const THRESHOLDS = {
  CLS: { good: 0.1, needs_improvement: 0.25 }, // Cumulative Layout Shift
  FCP: { good: 1800, needs_improvement: 3000 }, // First Contentful Paint
  LCP: { good: 2500, needs_improvement: 4000 }, // Largest Contentful Paint
  TTFB: { good: 800, needs_improvement: 1800 }, // Time to First Byte
  INP: { good: 200, needs_improvement: 500 }, // Interaction to Next Paint
};

// Rate a metric value
function rateMetric(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.needs_improvement) return 'needs-improvement';
  return 'poor';
}

// Send metric to analytics services
function sendToAnalytics(metric: Metric) {
  const rating = rateMetric(metric.name, metric.value);
  
  // Log to console in development
  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
    });
  }
  
  // Send to Sentry as custom measurement
  // Note: setMeasurement is deprecated in newer Sentry versions
  // Using context instead
  Sentry.setContext('web_vitals', {
    [`${metric.name.toLowerCase()}_value`]: metric.value,
    [`${metric.name.toLowerCase()}_rating`]: rating,
  });
  
  // Send as breadcrumb for context
  Sentry.addBreadcrumb({
    category: 'web-vitals',
    message: `${metric.name}: ${metric.value}`,
    level: rating === 'poor' ? 'warning' : 'info',
    data: {
      metric: metric.name,
      value: metric.value,
      rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
    },
  });
  
  // Report poor performance as an issue
  if (rating === 'poor') {
    Sentry.captureMessage(`Poor ${metric.name} performance: ${metric.value}`, 'warning');
  }
  
  // You can also send to other analytics services here
  // Example: Google Analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
      rating,
    });
  }
}

// Initialize Web Vitals monitoring
export function initWebVitals() {
  // Core Web Vitals
  onCLS(sendToAnalytics); // Cumulative Layout Shift
  onLCP(sendToAnalytics); // Largest Contentful Paint
  onFCP(sendToAnalytics); // First Contentful Paint
  
  // Additional metrics
  onTTFB(sendToAnalytics); // Time to First Byte
  onINP(sendToAnalytics); // Interaction to Next Paint (replaces FID)
}

// Get performance marks for specific operations
export function measureOperation(operationName: string, fn: () => void | Promise<void>) {
  const startMark = `${operationName}-start`;
  const endMark = `${operationName}-end`;
  const measureName = `${operationName}-duration`;
  
  performance.mark(startMark);
  
  const result = fn();
  
  if (result instanceof Promise) {
    return result.finally(() => {
      performance.mark(endMark);
      performance.measure(measureName, startMark, endMark);
      
      const measure = performance.getEntriesByName(measureName)[0];
      if (measure) {
        Sentry.addBreadcrumb({
          category: 'performance',
          message: `${operationName} completed`,
          level: 'info',
          data: {
            duration: measure.duration,
          },
        });
        
        // Clean up marks
        performance.clearMarks(startMark);
        performance.clearMarks(endMark);
        performance.clearMeasures(measureName);
      }
    });
  } else {
    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);
    
    const measure = performance.getEntriesByName(measureName)[0];
    if (measure) {
      Sentry.addBreadcrumb({
        category: 'performance',
        message: `${operationName} completed`,
        level: 'info',
        data: {
          duration: measure.duration,
        },
      });
      
      // Clean up marks
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(measureName);
    }
  }
  
  return result;
}

// React hook for component render performance
import { useEffect, useRef } from 'react';

export function useRenderPerformance(componentName: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());
  
  useEffect(() => {
    renderCount.current++;
    const currentTime = performance.now();
    const renderDuration = currentTime - lastRenderTime.current;
    
    if (renderDuration > 16.67) { // More than 1 frame (60fps)
      Sentry.addBreadcrumb({
        category: 'react-performance',
        message: `Slow render detected in ${componentName}`,
        level: 'warning',
        data: {
          renderCount: renderCount.current,
          duration: renderDuration,
        },
      });
    }
    
    lastRenderTime.current = currentTime;
  });
  
  return {
    renderCount: renderCount.current,
  };
}