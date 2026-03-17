# Performance Optimization - Implementation Plan

## Feature: API Caching & Rate Limiting

### Overview
Add performance optimization layer with in-memory caching, rate limiting, and request deduplication to improve API response times and prevent abuse.

### Implementation Steps

1. **Create cache utility** (`/src/lib/cache.ts`)
   - In-memory cache with TTL support
   - Set, get, delete, clear functions
   - Automatic expiration cleanup

2. **Create rate limiter** (`/src/lib/rateLimiter.ts`)
   - Token bucket or sliding window algorithm
   - 100 requests per minute per IP
   - Return 429 when limit exceeded

3. **Add caching to API routes**
   - Tasks list endpoint
   - Search endpoint
   - Metrics/stats endpoint

4. **Add performance metrics endpoint** (`/api/performance`)
   - Cache hit/miss stats
   - Request counts
   - Response time averages

5. **Cache invalidation**
   - Invalidate on task create/update/delete
   - Invalidate on manual refresh

### Files to Create/Modify
- `/src/lib/cache.ts` (new)
- `/src/lib/rateLimiter.ts` (new)
- `/src/app/api/tasks/route.ts` (add caching)
- `/src/app/api/tasks/search/route.ts` (add caching)
- `/src/app/api/performance/route.ts` (new)
- `.env` (add cache settings)

### Acceptance Criteria
- [ ] Cache stores data with TTL
- [ ] Rate limiter blocks >100 req/min
- [ ] Tasks API uses cache
- [ ] Cache invalidates on mutations
- [ ] Performance metrics accessible
