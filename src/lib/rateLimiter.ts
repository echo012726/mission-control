// Rate limiter using sliding window algorithm
interface RateLimitEntry {
  count: number;
  windowStart: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private maxRequests = 100; // requests per window
  private windowMs = 60000; // 1 minute window
  private cleanupInterval: NodeJS.Timeout | number | null = null;

  constructor() {
    // Cleanup old entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 300000);
  }

  check(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = this.store.get(ip);

    if (!entry || now > entry.windowStart + this.windowMs) {
      // New window
      this.store.set(ip, { count: 1, windowStart: now });
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetAt: now + this.windowMs
      };
    }

    if (entry.count >= this.maxRequests) {
      // Rate limited
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.windowStart + this.windowMs
      };
    }

    // Increment count
    entry.count++;
    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetAt: entry.windowStart + this.windowMs
    };
  }

  reset(ip: string): void {
    this.store.delete(ip);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [ip, entry] of this.store.entries()) {
      if (now > entry.windowStart + this.windowMs) {
        this.store.delete(ip);
      }
    }
  }

  getStats() {
    return {
      activeIPs: this.store.size,
      maxRequests: this.maxRequests,
      windowMs: this.windowMs
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
export const rateLimiter = new RateLimiter();

// Middleware helper for API routes
export function getRateLimitInfo(ip: string) {
  return rateLimiter.check(ip);
}
