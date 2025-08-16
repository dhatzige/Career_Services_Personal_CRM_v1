import * as Sentry from '@sentry/react';

/**
 * Wrapper for API calls with Sentry performance monitoring
 */
export async function fetchWithSentry<T>(
  url: string,
  options: RequestInit = {},
  spanName?: string
): Promise<T> {
  const method = options.method || 'GET';
  const name = spanName || `${method} ${url}`;
  
  return Sentry.startSpan(
    {
      op: 'http.client',
      name,
    },
    async (span) => {
      span.setAttribute('http.method', method);
      span.setAttribute('http.url', url);
      
      try {
        const response = await fetch(url, options);
        
        span.setAttribute('http.status_code', response.status);
        
        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
          Sentry.captureException(error, {
            tags: {
              http_status: response.status,
              api_endpoint: url,
            },
          });
          throw error;
        }
        
        const data = await response.json();
        return data as T;
      } catch (error) {
        span.setStatus('error');
        throw error;
      }
    }
  );
}

/**
 * Track UI interactions with performance monitoring
 */
export function trackUIInteraction(
  interactionName: string,
  callback: () => void | Promise<void>,
  attributes?: Record<string, any>
) {
  return Sentry.startSpan(
    {
      op: 'ui.click',
      name: interactionName,
    },
    async (span) => {
      // Add custom attributes
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          span.setAttribute(key, value);
        });
      }
      
      try {
        await callback();
      } catch (error) {
        span.setStatus('error');
        Sentry.captureException(error);
        throw error;
      }
    }
  );
}

/**
 * Track database operations
 */
export async function trackDatabaseOperation<T>(
  operation: string,
  tableName: string,
  callback: () => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    {
      op: 'db.query',
      name: `${operation} ${tableName}`,
    },
    async (span) => {
      span.setAttribute('db.operation', operation);
      span.setAttribute('db.table', tableName);
      
      try {
        const result = await callback();
        return result;
      } catch (error) {
        span.setStatus('error');
        Sentry.captureException(error, {
          tags: {
            db_operation: operation,
            db_table: tableName,
          },
        });
        throw error;
      }
    }
  );
}

/**
 * Track form submissions
 */
export function trackFormSubmission(
  formName: string,
  callback: () => void | Promise<void>,
  formData?: Record<string, any>
) {
  return Sentry.startSpan(
    {
      op: 'form.submit',
      name: `Submit ${formName}`,
    },
    async (span) => {
      span.setAttribute('form.name', formName);
      
      // Add form field count but not the actual data for privacy
      if (formData) {
        span.setAttribute('form.field_count', Object.keys(formData).length);
      }
      
      try {
        await callback();
        span.setAttribute('form.success', true);
      } catch (error) {
        span.setAttribute('form.success', false);
        span.setStatus('error');
        Sentry.captureException(error, {
          contexts: {
            form: {
              name: formName,
              field_count: formData ? Object.keys(formData).length : 0,
            },
          },
        });
        throw error;
      }
    }
  );
}

/**
 * Add breadcrumb for navigation
 */
export function addNavigationBreadcrumb(from: string, to: string) {
  Sentry.addBreadcrumb({
    category: 'navigation',
    message: `Navigated from ${from} to ${to}`,
    level: 'info',
    data: {
      from,
      to,
    },
  });
}

/**
 * Track search operations
 */
export function trackSearch(
  searchType: string,
  query: string,
  resultCount: number
) {
  Sentry.addBreadcrumb({
    category: 'search',
    message: `Searched ${searchType}: "${query}"`,
    level: 'info',
    data: {
      search_type: searchType,
      query_length: query.length,
      result_count: resultCount,
    },
  });
}

/**
 * Capture exceptions with additional context
 */
export function captureExceptionWithContext(
  error: Error,
  context: {
    tags?: Record<string, string>;
    user?: any;
    extra?: Record<string, any>;
  }
) {
  Sentry.withScope((scope) => {
    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    
    if (context.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    
    if (context.user) {
      scope.setUser(context.user);
    }
    
    Sentry.captureException(error);
  });
}