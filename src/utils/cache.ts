import { Redis } from '@upstash/redis';
import logger from './logger';

// Cache configuration
const CACHE_CONFIG = {
  // Default TTL in seconds
  DEFAULT_TTL: 300, // 5 minutes
  
  // Cache key prefixes
  PREFIXES: {
    STUDENT: 'student:',
    CONSULTATION: 'consultation:',
    CAREER: 'career:',
    AI_RESPONSE: 'ai:',
    DASHBOARD: 'dashboard:',
    REPORT: 'report:',
    SESSION: 'session:',
  },
  
  // Cache TTLs by type (in seconds)
  TTL: {
    STUDENT_LIST: 60,      // 1 minute for frequently changing data
    STUDENT_DETAIL: 300,   // 5 minutes
    DASHBOARD_STATS: 120,  // 2 minutes
    AI_RESPONSE: 3600,     // 1 hour for AI responses
    REPORT: 600,           // 10 minutes for reports
    CAREER_DATA: 1800,     // 30 minutes for career data
  }
};

// Initialize Redis client
let redisClient: Redis | null = null;

export function initCache() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    logger.warn('Redis cache disabled - missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN');
    return;
  }
  
  try {
    redisClient = new Redis({
      url,
      token,
    });
    
    logger.info('Redis cache initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Redis cache', { error });
  }
}

// Generic cache wrapper
export async function withCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = CACHE_CONFIG.DEFAULT_TTL
): Promise<T> {
  if (!redisClient) {
    return fetchFn();
  }
  
  try {
    // Try to get from cache
    const cached = await redisClient.get(key);
    if (cached) {
      logger.debug(`Cache hit: ${key}`);
      return cached as T;
    }
    
    // Cache miss - fetch data
    logger.debug(`Cache miss: ${key}`);
    const data = await fetchFn();
    
    // Store in cache
    await redisClient.setex(key, ttl, JSON.stringify(data));
    
    return data;
  } catch (error) {
    logger.error('Cache operation failed', { error, key });
    // Fallback to direct fetch on cache error
    return fetchFn();
  }
}

// Invalidate cache by pattern
export async function invalidateCache(pattern: string): Promise<void> {
  if (!redisClient) {
    return;
  }
  
  try {
    // Note: Upstash Redis doesn't support SCAN, so we'll need to handle this differently
    // For now, we'll invalidate specific keys
    logger.info(`Cache invalidation requested for pattern: ${pattern}`);
  } catch (error) {
    logger.error('Cache invalidation failed', { error, pattern });
  }
}

// Clear specific cache key
export async function clearCache(key: string): Promise<void> {
  if (!redisClient) {
    return;
  }
  
  try {
    await redisClient.del(key);
    logger.debug(`Cache cleared: ${key}`);
  } catch (error) {
    logger.error('Failed to clear cache', { error, key });
  }
}

// Batch cache operations
export async function batchGetCache(keys: string[]): Promise<Map<string, any>> {
  const result = new Map<string, any>();
  
  if (!redisClient || keys.length === 0) {
    return result;
  }
  
  try {
    const values = await redisClient.mget(...keys);
    keys.forEach((key, index) => {
      if (values[index]) {
        result.set(key, values[index]);
      }
    });
  } catch (error) {
    logger.error('Batch cache get failed', { error });
  }
  
  return result;
}

// Cache decorator for class methods
export function CacheResult(prefix: string, ttl: number = CACHE_CONFIG.DEFAULT_TTL) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${prefix}:${propertyKey}:${JSON.stringify(args)}`;
      
      return withCache(
        cacheKey,
        () => originalMethod.apply(this, args),
        ttl
      );
    };
    
    return descriptor;
  };
}

// Student-specific cache helpers
export const studentCache = {
  async getList(fetchFn: () => Promise<any>) {
    return withCache(
      `${CACHE_CONFIG.PREFIXES.STUDENT}list`,
      fetchFn,
      CACHE_CONFIG.TTL.STUDENT_LIST
    );
  },
  
  async getById(id: string, fetchFn: () => Promise<any>) {
    return withCache(
      `${CACHE_CONFIG.PREFIXES.STUDENT}${id}`,
      fetchFn,
      CACHE_CONFIG.TTL.STUDENT_DETAIL
    );
  },
  
  async invalidate(id?: string) {
    if (id) {
      await clearCache(`${CACHE_CONFIG.PREFIXES.STUDENT}${id}`);
    }
    await clearCache(`${CACHE_CONFIG.PREFIXES.STUDENT}list`);
  }
};

// Dashboard cache helpers
export const dashboardCache = {
  async getStats(fetchFn: () => Promise<any>) {
    return withCache(
      `${CACHE_CONFIG.PREFIXES.DASHBOARD}stats`,
      fetchFn,
      CACHE_CONFIG.TTL.DASHBOARD_STATS
    );
  },
  
  async invalidate() {
    await clearCache(`${CACHE_CONFIG.PREFIXES.DASHBOARD}stats`);
  }
};

// AI response cache helpers
export const aiCache = {
  async getResponse(prompt: string, fetchFn: () => Promise<any>) {
    const cacheKey = `${CACHE_CONFIG.PREFIXES.AI_RESPONSE}${Buffer.from(prompt).toString('base64')}`;
    return withCache(
      cacheKey,
      fetchFn,
      CACHE_CONFIG.TTL.AI_RESPONSE
    );
  }
};

// Report cache helpers
export const reportCache = {
  async getReport(type: string, params: any, fetchFn: () => Promise<any>) {
    const cacheKey = `${CACHE_CONFIG.PREFIXES.REPORT}${type}:${JSON.stringify(params)}`;
    return withCache(
      cacheKey,
      fetchFn,
      CACHE_CONFIG.TTL.REPORT
    );
  },
  
  async invalidate(type?: string) {
    if (type) {
      // Would need to implement pattern-based invalidation
      logger.info(`Report cache invalidation requested for type: ${type}`);
    }
  }
};

// Export cache configuration for reference
export { CACHE_CONFIG };