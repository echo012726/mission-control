import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, logActivity } from '@/lib/auth'
import { broadcastEvent } from '@/lib/sse-server'

export async function GET(req: NextRequest) {
  const isDev = process.env.NODE_ENV !== 'production'
  if (!isDev) {
    const authenticated = await getSession()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'archived'

  // Get archived tasks
  const tasks = await prisma.task.findMany({
    where: { status },
    orderBy: { updatedAt: 'desc' },
    include: {
      subtasks: { orderBy: { order: 'asc' } },
      _count: { select: { attachments: true } },
    },
  })

  const tasksWithAttachments = tasks.map(task => ({
    ...task,
    attachmentCount: task._count.attachments,
  }))

  return NextResponse.json(tasksWithAttachments)
}

export async function PATCH(req: NextRequest) {
  const isDev = process.env.NODE_ENV !== 'production'
  if (!isDev) {
    const authenticated = await getSession()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const body = await req.json()
  const { taskId, action } = body

  if (!taskId || !action) {
    return NextResponse.json({ error: 'taskId and action required' }, { status: 400 })
  }

  let task
  if (action === 'archive') {
    // Archive the task
    task = await prisma.task.update({
      where: { id: taskId },
      data: { status: 'archived' },
      include: {
        subtasks: { orderBy: { order: 'asc' } },
      },
    })
    await logActivity('task_archived', { taskId: task.id, title: task.title })
    broadcastEvent('task_archived', task)
  } else if (action === 'unarchive') {
    // Restore archived task to 'done' status
    task = await prisma.task.update({
      where: { id: taskId },
      data: { status: 'done' },
      include: {
        subtasks: { orderBy: { order: 'asc' } },
      },
    })
    await logActivity('task_unarchived', { taskId: task.id, title: task.title })
    broadcastEvent('task_unarchived', task)
  } else {
    return NextResponse.json({ error: 'Invalid action. Use "archive" or "unarchive"' }, { status: 400 })
  }

  return NextResponse.json(task)
}
