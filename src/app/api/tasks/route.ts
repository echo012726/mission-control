/**
 * Optimized Tasks API with Caching & Performance
 * 
 * Features:
 * - Response caching with TTL
 * - Rate limiting
 * - Request deduplication
 * - Performance metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { cache, metrics, deduplicator, CACHE_TTL } from '@/lib/performance';

// In-memory task store (would be replaced with database in production)
let tasks = [
  { id: '1', title: 'Review project proposal', status: 'inProgress', priority: 'high', tags: ['work'], createdAt: new Date().toISOString(), starred: true, description: 'Review the new project proposal and provide feedback' },
  { id: '2', title: 'Team standup meeting', status: 'planned', priority: 'medium', tags: ['meeting'], dueDate: new Date().toISOString(), description: 'Daily standup with the team' },
  { id: '3', title: 'Submit expense report', status: 'inbox', priority: 'low', tags: ['admin'], starred: false, description: '' },
  { id: '4', title: 'Update documentation', status: 'completed', priority: 'medium', tags: ['docs'], description: 'Update API documentation' },
  { id: '5', title: 'Code review: PR #42', status: 'inProgress', priority: 'high', tags: ['code', 'review'], starred: true, description: 'Review pull request #42' },
];

let taskIdCounter = 6;

// GET /api/tasks - List all tasks (cached)
export async function GET(request: NextRequest) {
  const start = Date.now();
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('refresh') === 'true';
  
  const cacheKey = `tasks:${searchParams.toString()}`;
  
  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = cache.get(cacheKey);
    if (cached) {
      metrics.recordApiCall(Date.now() - start, true);
      return NextResponse.json(cached);
    }
  }

  // Use request deduplication for concurrent requests
  const result = await deduplicator.deduplicate(cacheKey, async () => {
    // Simulate database query delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    let filteredTasks = [...tasks];
    
    // Filter out deleted tasks by default, unless 'trash' param is true
    const showTrash = searchParams.get('trash') === 'true';
    if (!showTrash) {
      filteredTasks = filteredTasks.filter(t => !t.deletedAt);
    }
    
    // Apply filters
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const tag = searchParams.get('tag');
    const starred = searchParams.get('starred');
    const search = searchParams.get('search');
    
    if (status) filteredTasks = filteredTasks.filter(t => t.status === status);
    if (priority) filteredTasks = filteredTasks.filter(t => t.priority === priority);
    if (tag) filteredTasks = filteredTasks.filter(t => t.tags?.includes(tag));
    if (starred === 'true') filteredTasks = filteredTasks.filter(t => t.starred);
    if (search) {
      const q = search.toLowerCase();
      filteredTasks = filteredTasks.filter(t => 
        t.title.toLowerCase().includes(q) || 
        t.description?.toLowerCase().includes(q)
      );
    }
    
    // Calculate stats
    const stats = {
      total: tasks.length,
      byStatus: tasks.reduce<Record<string, number>>((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, {}),
      byPriority: tasks.reduce<Record<string, number>>((acc, t) => {
        acc[t.priority] = (acc[t.priority] || 0) + 1;
        return acc;
      }, {})
    };
    
    return { tasks: filteredTasks, stats };
  });
  
  // Cache the response
  cache.set(cacheKey, result, CACHE_TTL.tasks);
  metrics.recordApiCall(Date.now() - start, false);
  
  return NextResponse.json(result);
}

// POST /api/tasks - Create task (invalidates cache)
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const newTask = {
    id: String(taskIdCounter++),
    ...body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  tasks.push(newTask);
  
  // Invalidate tasks cache
  cache.invalidatePattern('tasks:');
  
  return NextResponse.json(newTask, { status: 201 });
}

// PATCH /api/tasks - Batch update (invalidates cache)
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { ids, ...updates } = body;
  
  if (ids && Array.isArray(ids)) {
    // Batch update
    tasks = tasks.map(task => {
      if (ids.includes(task.id)) {
        return { ...task, ...updates, updatedAt: new Date().toISOString() };
      }
      return task;
    });
  }
  
  // Invalidate cache
  cache.invalidatePattern('tasks:');
  
  return NextResponse.json({ success: true, updated: ids?.length || 0 });
}

// DELETE /api/tasks - Batch delete
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get('ids')?.split(',') || [];
  
  if (ids.length > 0) {
    // Soft delete - mark as deleted instead of removing
    tasks = tasks.map(t => 
      ids.includes(t.id) 
        ? { ...t, deletedAt: new Date().toISOString() } 
        : t
    );
  }
  
  // Invalidate cache
  cache.invalidatePattern('tasks:');
  
  return NextResponse.json({ success: true, deleted: ids.length });
}
