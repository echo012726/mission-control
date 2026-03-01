import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, logActivity } from '@/lib/auth'
import { broadcastEvent } from '@/lib/sse-server'

export async function GET() {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      subtasks: { orderBy: { order: 'asc' } },
    },
  })

  return NextResponse.json(tasks)
}

export async function POST(req: NextRequest) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { title, description, status, priority, tags, labels, agentId, dueDate, recurrence, subtasks } = body

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
      // Create subtasks if provided
      subtasks: subtasks && subtasks.length > 0 ? {
        create: subtasks.map((st: string, idx: number) => ({
          title: st,
          order: idx,
        }))
      } : undefined,
    },
    include: {
      subtasks: { orderBy: { order: 'asc' } },
    },
  })

  await logActivity('task_created', { taskId: task.id, title: task.title })
  
  // Broadcast to all connected SSE clients
  broadcastEvent('task_created', task)

  return NextResponse.json(task)
}
