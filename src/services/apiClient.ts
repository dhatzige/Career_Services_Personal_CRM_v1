import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import * as Sentry from '@sentry/react';
import { supabase } from '../contexts/CleanSupabaseAuth';
import { apiCache, cachePatterns } from './apiCache';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

// Custom error class for API errors
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Create axios instance with defaults
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Cache configuration per endpoint
const cacheConfig: Record<string, { ttl: number; cache: boolean }> = {
  '/students': { ttl: 5 * 60 * 1000, cache: true }, // 5 minutes
  '/consultations': { ttl: 3 * 60 * 1000, cache: true }, // 3 minutes
  '/notes': { ttl: 3 * 60 * 1000, cache: true }, // 3 minutes
  '/dashboard/stats': { ttl: 10 * 60 * 1000, cache: true }, // 10 minutes
  '/reports': { ttl: 30 * 60 * 1000, cache: true }, // 30 minutes
};

// Request interceptor for auth and caching
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Try to get current session (this will refresh if needed)
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Failed to get session:', error);
        // Try to refresh the session
        const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
        if (refreshedSession?.access_token) {
          config.headers.Authorization = `Bearer ${refreshedSession.access_token}`;
        }
      } else if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
      
      // Add request ID for tracing
      const requestId = crypto.randomUUID();
      config.headers['X-Request-ID'] = requestId;
      
      // Check cache for GET requests
      if (config.method?.toLowerCase() === 'get' && config.url) {
        const endpoint = config.url.split('?')[0];
        const cacheSettings = cacheConfig[endpoint];
        
        if (cacheSettings?.cache) {
          const cacheKey = `${config.method}:${config.baseURL}${config.url}`;
          const cached = apiCache.get(cacheKey);
          
          if (cached) {
            // Return cached response
            config.adapter = () => Promise.resolve({
              data: cached,
              status: 200,
              statusText: 'OK (Cached)',
              headers: {},
              config: config as any,
            });
          }
        }
      }
      
      // Log to Sentry breadcrumb
      Sentry.addBreadcrumb({
        category: 'api',
        message: `API Request: ${config.method?.toUpperCase()} ${config.url}`,
        level: 'info',
        data: {
          requestId,
          method: config.method,
          url: config.url,
        },
      });
      
      return config;
    } catch (error) {
      Sentry.captureException(error);
      return Promise.reject(error);
    }
  },
  (error) => {
    Sentry.captureException(error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and caching
apiClient.interceptors.response.use(
  (response) => {
    // Cache successful GET responses
    if (response.config.method?.toLowerCase() === 'get' && 
        response.status === 200 && 
        response.config.url &&
        response.statusText !== 'OK (Cached)') {
      
      const endpoint = response.config.url.split('?')[0];
      const cacheSettings = cacheConfig[endpoint];
      
      if (cacheSettings?.cache) {
        const cacheKey = `${response.config.method}:${response.config.baseURL}${response.config.url}`;
        apiCache.set(cacheKey, response.data, cacheSettings.ttl);
      }
    }
    
    // Invalidate related caches on mutations
    if (['post', 'put', 'patch', 'delete'].includes(response.config.method?.toLowerCase() || '')) {
      const url = response.config.url || '';
      
      // Invalidate related caches based on URL patterns
      if (url.includes('/students')) {
        apiCache.invalidate(cachePatterns.students);
        apiCache.invalidate(cachePatterns.dashboard);
      } else if (url.includes('/consultations')) {
        apiCache.invalidate(cachePatterns.consultations);
        apiCache.invalidate(cachePatterns.dashboard);
        apiCache.invalidate(cachePatterns.reports);
      } else if (url.includes('/notes')) {
        apiCache.invalidate(cachePatterns.notes);
      }
    }
    
    // Log successful response
    Sentry.addBreadcrumb({
      category: 'api',
      message: `API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`,
      level: 'info',
      data: {
        status: response.status,
        requestId: response.config.headers?.['X-Request-ID'],
        cached: response.statusText === 'OK (Cached)',
      },
    });
    
    return response;
  },
  (error: AxiosError) => {
    const requestId = error.config?.headers?.['X-Request-ID'];
    const method = error.config?.method?.toUpperCase();
    const url = error.config?.url;
    
    // Create structured error
    let apiError: APIError;
    
    if (error.response) {
      // Server responded with error
      const status = error.response.status;
      const data = error.response.data as any;
      
      apiError = new APIError(
        data?.message || `API Error: ${status}`,
        status,
        data?.code,
        data?.details
      );
      
      // Special handling for auth errors
      if (status === 401) {
        if (!import.meta.env.DEV) {
          window.dispatchEvent(new Event('unauthorized'));
        }
      }
      
      // Log to Sentry with context
      Sentry.captureException(apiError, {
        tags: {
          api_error: true,
          status_code: status,
          endpoint: url,
        },
        extra: {
          requestId,
          method,
          response: data,
        },
      });
    } else if (error.request) {
      // Request made but no response
      apiError = new APIError(
        'Network error - no response from server',
        0,
        'NETWORK_ERROR'
      );
      
      Sentry.captureException(apiError, {
        tags: {
          api_error: true,
          error_type: 'network',
        },
        extra: {
          requestId,
          method,
          url,
        },
      });
    } else {
      // Request setup error
      apiError = new APIError(
        error.message || 'Request failed',
        undefined,
        'REQUEST_ERROR'
      );
      
      Sentry.captureException(error);
    }
    
    return Promise.reject(apiError);
  }
);

// Centralized API methods
export const api = {
  // Generic methods
  get: <T = any>(url: string, config?: any) => 
    apiClient.get<T>(url, config).then(res => res.data),
    
  post: <T = any>(url: string, data?: any, config?: any) => 
    apiClient.post<T>(url, data, config).then(res => res.data),
    
  put: <T = any>(url: string, data?: any, config?: any) => 
    apiClient.put<T>(url, data, config).then(res => res.data),
    
  patch: <T = any>(url: string, data?: any, config?: any) => 
    apiClient.patch<T>(url, data, config).then(res => res.data),
    
  delete: <T = any>(url: string, config?: any) => 
    apiClient.delete<T>(url, config).then(res => res.data),

  // Entity-specific methods for better type safety
  students: {
    list: () => api.get('/students'),
    get: (id: string) => api.get(`/students/${id}`),
    create: (data: any) => api.post('/students', data),
    update: (id: string, data: any) => api.put(`/students/${id}`, data),
    delete: (id: string) => api.delete(`/students/${id}`),
  },

  notes: {
    list: (studentId?: string) => 
      api.get(studentId ? `/notes/student/${studentId}` : '/notes'),
    get: (id: string) => api.get(`/notes/${id}`),
    create: (studentId: string, data: any) => api.post(`/notes/student/${studentId}`, data),
    update: (id: string, data: any) => api.put(`/notes/${id}`, data),
    delete: (id: string) => api.delete(`/notes/${id}`),
  },

  consultations: {
    list: () => api.get('/consultations'),
    listByStudent: (studentId: string) => 
      api.get(`/consultations/student/${studentId}`),
    get: (id: string) => api.get(`/consultations/${id}`),
    create: (studentId: string, data: any) => 
      api.post(`/consultations/student/${studentId}`, data),
    update: (id: string, data: any) => api.put(`/consultations/${id}`, data),
    delete: (id: string) => api.delete(`/consultations/${id}`),
    
    // Special endpoints
    dateRange: (startDate: string, endDate: string) => 
      api.get(`/consultations/date-range/${startDate}/${endDate}`),
    stats: () => api.get('/consultations/stats/overview'),
  },

  // Health check
  health: () => api.get('/health'),
};

// Export both for flexibility
export default apiClient;