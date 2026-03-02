import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { broadcastEvent } from '@/lib/sse-server'

interface EchoActivity {
  id: string
  type: 'cron_run' | 'approval' | 'subagent_result' | 'session_event' | 'heartbeat' | 'task_action'
  message: string
  agent?: string
  timestamp: number
  metadata?: Record<string, unknown>
}

/**
 * Activity Stream from Echo
 * Shows Echo's activity including cron runs, approvals, subagent results
 */
export async function GET(req: NextRequest) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '50')
  const includeMock = searchParams.get('mock') !== 'false' // Default to including mock data

  const activities: EchoActivity[] = []

  // 1. Get real activities from Mission Control database
  const dbActivities = await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  // Map database activities to Echo activity format
  for (const activity of dbActivities) {
    let type: EchoActivity['type'] = 'session_event'
    let message = activity.type
    const metadata = activity.payload ? JSON.parse(activity.payload) : {}

    // Categorize activity types
    if (activity.type.includes('cron')) {
      type = 'cron_run'
      message = `Cron: ${metadata.cronName || 'job'} executed`
    } else if (activity.type.includes('approval')) {
      type = 'approval'
      message = `Approval ${metadata.status || 'requested'}: ${metadata.type || 'action'}`
    } else if (activity.type.includes('subagent') || activity.type.includes('agent')) {
      type = 'subagent_result'
      message = `Agent ${metadata.action || 'action'}: ${metadata.task || 'task'}`
    } else if (activity.type.includes('task')) {
      type = 'task_action'
      message = `Task: ${metadata.title || activity.type}`
    }

    activities.push({
      id: activity.id,
      type,
      message,
      timestamp: new Date(activity.createdAt).getTime(),
      metadata
    })
  }

  // 2. Add mock real-time events for demonstration
  if (includeMock) {
    const now = Date.now()
    const mockActivities: EchoActivity[] = [
      {
        id: 'mock-cron-1',
        type: 'cron_run',
        message: 'Cron: Mission Control Build completed',
        agent: 'Echo',
        timestamp: now - 60000, // 1 minute ago
        metadata: { cronId: '825818b6-2311-427f-8529-a2eaa71ee0d4', duration: 45 }
      },
      {
        id: 'mock-cron-2',
        type: 'cron_run',
        message: 'Cron: Health check completed',
        agent: 'Echo',
        timestamp: now - 300000, // 5 minutes ago
        metadata: { status: 'healthy', checksRun: 12 }
      },
      {
        id: 'mock-approval-1',
        type: 'approval',
        message: 'Pending approval: Execute dangerous command',
        agent: 'Echo',
        timestamp: now - 180000, // 3 minutes ago
        metadata: { approvalType: 'command_execution', risk: 'high' }
      },
      {
        id: 'mock-subagent-1',
        type: 'subagent_result',
        message: 'Subagent completed: GitHub issues fetch',
        agent: 'Echo',
        timestamp: now - 600000, // 10 minutes ago
        metadata: { subagentId: 'researcher', resultCount: 5 }
      },
      {
        id: 'mock-heartbeat-1',
        type: 'heartbeat',
        message: 'Heartbeat: All systems operational',
        agent: 'Echo',
        timestamp: now - 30000, // 30 seconds ago
        metadata: { sessionKey: 'main', status: 'active' }
      },
      {
        id: 'mock-session-1',
        type: 'session_event',
        message: 'Session started: Main conversation',
        agent: 'Echo',
        timestamp: now - 3600000, // 1 hour ago
        metadata: { channel: 'discord', model: 'MiniMax-M2.5' }
      },
      {
        id: 'mock-task-1',
        type: 'task_action',
        message: 'Task completed: Deploy to production',
        agent: 'Echo',
        timestamp: now - 7200000, // 2 hours ago
        metadata: { taskId: 'task-123', status: 'done' }
      }
    ]

    // Merge mock activities with real ones, sorted by timestamp
    activities.push(...mockActivities)
  }

  // Sort all activities by timestamp (newest first) and limit
  activities.sort((a, b) => b.timestamp - a.timestamp)
  const finalActivities = activities.slice(0, limit)

  return NextResponse.json(finalActivities)
}

/**
 * Manually trigger an activity log entry (for testing)
 */
export async function POST(req: NextRequest) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { type, message, metadata } = body

    if (!type || !message) {
      return NextResponse.json({ error: 'Type and message required' }, { status: 400 })
    }

    // Create activity log entry
    const activity = await prisma.activityLog.create({
      data: {
        type,
        payload: metadata ? JSON.stringify(metadata) : null,
      },
    })

    // Broadcast to SSE clients
    broadcastEvent('echo_activity', {
      id: activity.id,
      type,
      message,
      timestamp: Date.now(),
      metadata
    })

    return NextResponse.json({
      id: activity.id,
      type,
      message,
      timestamp: new Date(activity.createdAt).getTime()
    })
  } catch (error) {
    console.error('Failed to create activity:', error)
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 })
  }
}
