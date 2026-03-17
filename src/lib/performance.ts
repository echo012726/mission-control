/**
 * Mission Control - Performance Optimization Layer
 * 
 * Features:
 * - In-memory cache with TTL
 * - Rate limiting
 * - Request deduplication
 * - Response compression hints
 */

// Cache configuration
const CACHE_TTL = {
  tasks: 30000,        // 30 seconds
  stats: 60000,       // 1 minute
  search: 15000,      // 15 seconds
  default: 10000      // 10 seconds
};

// In-memory cache store
class Cache {
  store: Map<string, any>;
  timestamps: Map<string, number>;
  
  constructor() {
    this.store = new Map();
    this.timestamps = new Map();
  }

  get(key: string): any {
    if (!this.store.has(key)) return null;
    
    const ttl = this.timestamps.get(key);
    if (ttl === undefined || Date.now() > ttl) {
      this.delete(key);
      return null;
    }
    
    return this.store.get(key);
  }

  set(key: string, value: any, ttl: number = CACHE_TTL.default): void {
    this.store.set(key, value);
    this.timestamps.set(key, Date.now() + ttl);
  }

  delete(key: string): boolean {
    this.store.delete(key);
    this.timestamps.delete(key);
    return true;
  }

  clear(): void {
    this.store.clear();
    this.timestamps.clear();
  }

  // Invalidate keys matching pattern
  invalidatePattern(pattern: string): void {
    for (const key of this.store.keys()) {
      if (key.includes(pattern)) {
        this.delete(key);
      }
    }
  }
}

// Rate limiter
class RateLimiter {
  requests: Map<string, number>;
  
  constructor() {
    this.requests = new Map();
  }

  isAllowed(identifier: string, maxRequests: number = 100, windowMs: number = 60000): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const key = `${identifier}:${Math.floor(now / windowMs)}`;
    
    const count = this.requests.get(key) || 0;
    
    if (count >= maxRequests) {
      return { allowed: false, remaining: 0, resetAt: (Math.floor(now / windowMs) + 1) * windowMs };
    }
    
    this.requests.set(key, count + 1);
    return { allowed: true, remaining: maxRequests - count - 1, resetAt: (Math.floor(now / windowMs) + 1) * windowMs };
  }

  cleanup(): void {
    const now = Date.now();
    const windowMs = 60000;
    for (const key of this.requests.keys()) {
      const [, timestamp] = key.split(':');
      if (parseInt(timestamp) * windowMs < now - windowMs * 2) {
        this.requests.delete(key);
      }
    }
  }
}

// Request deduplication
class RequestDeduplicator {
  pending: Map<string, Promise<any>>;
  
  constructor() {
    this.pending = new Map();
  }

  async deduplicate<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.pending.has(key)) {
      return this.pending.get(key) as Promise<T>;
    }

    const promise = fn();
    this.pending.set(key, promise);

    try {
      return await promise;
    } finally {
      this.pending.delete(key);
    }
  }
}

// Performance metrics
class PerformanceMetrics {
  metrics: {
    apiCalls: number;
    cacheHits: number;
    cacheMisses: number;
    rateLimited: number;
    avgResponseTime: number;
    requestTimes: number[];
  };
  
  constructor() {
    this.metrics = {
      apiCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      rateLimited: 0,
      avgResponseTime: 0,
      requestTimes: []
    };
  }

  recordApiCall(duration: number, fromCache = false) {
    this.metrics.apiCalls++;
    if (fromCache) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
    
    this.metrics.requestTimes.push(duration);
    if (this.metrics.requestTimes.length > 100) {
      this.metrics.requestTimes.shift();
    }
    
    const sum = this.metrics.requestTimes.reduce((a, b) => a + b, 0);
    this.metrics.avgResponseTime = sum / this.metrics.requestTimes.length;
  }

  recordRateLimit() {
    this.metrics.rateLimited++;
  }

  getMetrics() {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.apiCalls > 0 
        ? (this.metrics.cacheHits / this.metrics.apiCalls * 100).toFixed(1) + '%'
        : '0%'
    };
  }

  reset() {
    this.metrics = {
      apiCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      rateLimited: 0,
      avgResponseTime: 0,
      requestTimes: []
    };
  }
}

// Export singleton instances
const cache = new Cache();
const rateLimiter = new RateLimiter();
const deduplicator = new RequestDeduplicator();
const metrics = new PerformanceMetrics();

// Cache middleware helper
function cacheMiddleware(getCacheKey: (req: any) => string, ttl: number) {
  return async (req: any, res: any, next: any) => {
    const cacheKey = getCacheKey(req);
    const cached = cache.get(cacheKey);
    
    if (cached) {
      const start = Date.now();
      metrics.recordApiCall(Date.now() - start, true);
      return res.json(cached);
    }
    
    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (data: any) => {
      cache.set(cacheKey, data, ttl);
      metrics.recordApiCall(0, false);
      return originalJson(data);
    };
    
    next();
  };
}

// Rate limit middleware
function rateLimitMiddleware(identifier = 'ip', maxRequests = 100) {
  return (req: any, res: any, next: any) => {
    const id = req.headers[identifier] || req.ip || 'unknown';
    const result = rateLimiter.isAllowed(id, maxRequests);
    
    if (!result.allowed) {
      metrics.recordRateLimit();
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000)
      });
    }
    
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', result.resetAt);
    next();
  };
}

// Auto-cleanup every 5 minutes
setInterval(() => {
  rateLimiter.cleanup();
  // Clean expired cache entries
  const now = Date.now();
  for (const [key, ttl] of cache.timestamps) {
    if (now > ttl) {
      cache.delete(key);
    }
  }
}, 300000);

module.exports = {
  cache,
  rateLimiter,
  deduplicator,
  metrics,
  cacheMiddleware,
  rateLimitMiddleware,
  CACHE_TTL
};

export {
  cache,
  rateLimiter,
  deduplicator,
  metrics,
  cacheMiddleware,
  rateLimitMiddleware,
  CACHE_TTL
};
