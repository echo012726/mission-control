/**
 * Performance Metrics API
 * 
 * Returns caching and performance statistics
 */

import { NextResponse } from 'next/server';
import { metrics, cache } from '@/lib/performance';

export async function GET() {
  const perfMetrics = metrics.getMetrics();
  
  // Cache stats
  const cacheStats = {
    entries: cache.store.size,
    ttl: {
      tasks: '30s',
      stats: '1m',
      search: '15s',
      default: '10s'
    }
  };
  
  return NextResponse.json({
    metrics: perfMetrics,
    cache: cacheStats,
    uptime: process.uptime?.() || 'N/A',
    timestamp: new Date().toISOString()
  });
}

// Reset metrics
export async function DELETE() {
  metrics.reset();
  cache.clear();
  return NextResponse.json({ message: 'Metrics reset' });
}
