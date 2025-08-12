interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean;
  key?: string;
}

class APICache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  // Generate cache key from request details
  private generateKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  // Clear expired entries periodically
  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }

  // Get cached data if available and not expired
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (entry.expiresAt < now) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  // Set cache entry
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt
    });

    // Cleanup expired entries every 10 cache sets
    if (this.cache.size % 10 === 0) {
      this.cleanupExpired();
    }
  }

  // Check if data is stale but still usable
  isStale(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;
    
    return entry.expiresAt < Date.now();
  }

  // Invalidate cache entries matching a pattern
  invalidate(pattern: string | RegExp): void {
    if (typeof pattern === 'string') {
      // Exact match
      this.cache.delete(pattern);
      this.pendingRequests.delete(pattern);
    } else {
      // Pattern match
      const keysToDelete: string[] = [];
      for (const key of this.cache.keys()) {
        if (pattern.test(key)) {
          keysToDelete.push(key);
        }
      }
      // Delete all matching keys
      for (const key of keysToDelete) {
        this.cache.delete(key);
        this.pendingRequests.delete(key);
      }
    }
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  // Deduplicate concurrent requests
  async deduplicateRequest<T>(
    key: string,
    fetcher: () => Promise<T>
  ): Promise<T> {
    // Check if request is already pending
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending;
    }

    // Create new request
    const request = fetcher()
      .then(data => {
        this.pendingRequests.delete(key);
        return data;
      })
      .catch(error => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, request);
    return request;
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        timestamp: new Date(entry.timestamp).toISOString(),
        expiresAt: new Date(entry.expiresAt).toISOString(),
        isExpired: entry.expiresAt < Date.now()
      }))
    };
  }
}

// Export singleton instance
export const apiCache = new APICache();

// Cache invalidation helpers
export const cachePatterns = {
  students: /^(GET|POST|PUT|DELETE):.*\/students/,
  consultations: /^(GET|POST|PUT|DELETE):.*\/consultations/,
  notes: /^(GET|POST|PUT|DELETE):.*\/notes/,
  reports: /^GET:.*\/reports/,
  dashboard: /^GET:.*\/dashboard/,
};

// React hook for cache-aware data fetching
import { useState, useEffect, useRef } from 'react';

interface UseCachedAPIOptions extends CacheConfig {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useCachedAPI<T>(
  fetcher: () => Promise<T>,
  dependencies: any[],
  options: UseCachedAPIOptions = {}
) {
  const {
    ttl = 5 * 60 * 1000,
    staleWhileRevalidate = true,
    key,
    enabled = true,
    refetchOnWindowFocus = true,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  
  const cacheKey = key || JSON.stringify(dependencies);
  const isMountedRef = useRef(true);

  const fetchData = async (background = false) => {
    if (!enabled) return;

    try {
      if (!background) {
        setIsLoading(true);
      } else {
        setIsValidating(true);
      }

      // Check cache first
      const cached = apiCache.get<T>(cacheKey);
      if (cached && !apiCache.isStale(cacheKey)) {
        setData(cached);
        setError(null);
        if (!background) setIsLoading(false);
        onSuccess?.(cached);
        return;
      }

      // Use stale data while revalidating
      if (cached && staleWhileRevalidate && background) {
        setData(cached);
      }

      // Deduplicate concurrent requests
      const result = await apiCache.deduplicateRequest(cacheKey, fetcher);
      
      if (isMountedRef.current) {
        apiCache.set(cacheKey, result, ttl);
        setData(result);
        setError(null);
        onSuccess?.(result);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err as Error);
        onError?.(err as Error);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsValidating(false);
      }
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchData();
    
    return () => {
      isMountedRef.current = false;
    };
  }, dependencies);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (apiCache.isStale(cacheKey)) {
        fetchData(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [cacheKey, refetchOnWindowFocus]);

  const mutate = (newData: T | ((prev: T | null) => T)) => {
    const updated = typeof newData === 'function' 
      ? (newData as (prev: T | null) => T)(data)
      : newData;
    
    setData(updated);
    apiCache.set(cacheKey, updated, ttl);
  };

  const revalidate = () => fetchData(false);

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    revalidate
  };
}