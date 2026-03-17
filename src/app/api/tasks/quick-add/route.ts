import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/auth'
import { broadcastEvent } from '@/lib/sse-server'
import { triggerTaskCreated } from '@/lib/webhooks'
import { triggerTaskEvent } from '@/lib/pusher'

// Quick add API key - should be set in environment variables
// Use MISSION_CONTROL_API_KEY env var or fallback to test key
const API_KEY = process.env.MISSION_CONTROL_API_KEY || 'mc_quick_add_2026'

export async function POST(req: NextRequest) {
  try {
    // Check API key authentication
    const apiKey = req.headers.get('X-API-Key')
    
    if (!apiKey || apiKey !== API_KEY) {
      // Also allow token-based auth for flexibility
      const authHeader = req.headers.get('Authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized - Invalid or missing API key' }, { status: 401 })
      }
    }

    const body = await req.json()
    const { 
      title, 
      description, 
      status, 
      priority, 
      tags, 
      labels, 
      agentId, 
      dueDate, 
      recurrence, 
      customFields, 
      estimatedTime 
    } = body

    if (!title) {
      return NextResponse.json({ error: 'Title required' }, { status: 400 })
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'inbox',
        priority: priority || 'medium',
        tags: tags ? JSON.stringify(tags) : '[]',
        labels: labels ? JSON.stringify(labels) : '[]',
        agentId,
        dueDate: dueDate ? new Date(dueDate) : null,
        recurrence: recurrence || null,
        estimatedTime: estimatedTime || null,
        customFields: customFields ? JSON.stringify(customFields) : '[]',
      },
      include: {
        subtasks: { orderBy: { order: 'asc' } },
      },
    })

    await logActivity('task_created', { taskId: task.id, title: task.title, source: 'api' })
    
    // Broadcast to all connected SSE clients
    broadcastEvent('task_created', task)

    // Trigger webhooks
    triggerTaskCreated(task)

    // Trigger real-time via Pusher
    triggerTaskEvent('task:created', task).catch(console.error)

    return NextResponse.json({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      createdAt: task.createdAt,
      message: 'Task created successfully'
    })
  } catch (error) {
    console.error('Quick add error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET method to test API key validity
export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('X-API-Key')
  
  if (!apiKey || apiKey !== API_KEY) {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Quick Add API is running',
    endpoint: 'POST /api/tasks/quick-add',
    fields: {
      title: 'string (required)',
      description: 'string (optional)',
      status: 'string: inbox|planned|in_progress|blocked|done (optional, default: inbox)',
      priority: 'string: low|medium|high (optional, default: medium)',
      tags: 'array (optional)',
      labels: 'array (optional)',
      dueDate: 'ISO date string (optional)',
      recurrence: 'string (optional)',
      customFields: 'object (optional)',
      estimatedTime: 'number in minutes (optional)'
    }
  })
}
