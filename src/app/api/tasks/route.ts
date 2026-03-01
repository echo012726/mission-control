import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, logActivity } from '@/lib/auth'

// Simple broadcast helper - in production would use Redis or similar
// For now, we'll just log and the client will poll for changes
async function broadcastEvent(event: string, data: unknown) {
  // In a full implementation, this would push to Redis or use Server-Sent Events
  // For now, events are logged and clients can subscribe to SSE endpoint
  console.log(`[BROADCAST] ${event}:`, data)
}

export async function GET() {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(tasks)
}

export async function POST(req: NextRequest) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { title, description, status, priority, tags, agentId } = body

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
      agentId,
    },
  })

  await logActivity('task_created', { taskId: task.id, title: task.title })
  await broadcastEvent('task_created', task)

  return NextResponse.json(task)
}
