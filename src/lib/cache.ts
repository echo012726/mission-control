// In-memory cache with TTL support
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class Cache {
  private store = new Map<string, CacheEntry<unknown>>();
  private defaultTTL = 30000; // 30 seconds default
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Cleanup expired entries every 60 seconds
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  set<T>(key: string, value: T, ttl: number = this.defaultTTL): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    
    return entry.value as T;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    
    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  // Metrics
  // Get all keys (for invalidation)
  getKeys(): string[] {
    return Array.from(this.store.keys());
  }

  getStats() {
    let valid = 0;
    const now = Date.now();
    for (const entry of this.store.values()) {
      if (now <= entry.expiresAt) valid++;
    }
    return {
      totalEntries: this.store.size,
      validEntries: valid,
      expiredEntries: this.store.size - valid
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Singleton instance
export const cache = new Cache();

// Cache middleware helper for API routes
export function withCache<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<{ data: T; cached: boolean }> {
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return Promise.resolve({ data: cached, cached: true });
  }
  
  return fetcher().then(data => {
    cache.set(key, data, ttl);
    return { data, cached: false };
  });
}

// Invalidate cache by pattern
export function invalidateCache(pattern: string): number {
  let count = 0;
  const keys = cache.getKeys();
  for (const key of keys) {
    if (key.includes(pattern)) {
      cache.delete(key);
      count++;
    }
  }
  return count;
}
