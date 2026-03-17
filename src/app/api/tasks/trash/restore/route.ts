import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, logActivity } from '@/lib/auth'
import { broadcastEvent } from '@/lib/sse-server'

export async function POST(req: NextRequest) {
  // Skip auth in dev mode
  const isDev = process.env.NODE_ENV !== 'production'
  if (!isDev) {
    const authenticated = await getSession()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const body = await req.json()
  const { logId } = body

  if (!logId) {
    return NextResponse.json({ error: 'logId required' }, { status: 400 })
  }

  // Get the deletion log
  const deletionLog = await prisma.activityLog.findUnique({
    where: { id: logId },
  })

  if (!deletionLog || deletionLog.type !== 'task_deleted') {
    return NextResponse.json({ error: 'Deletion log not found' }, { status: 404 })
  }

  const payload = JSON.parse(deletionLog.payload || '{}')

  // Create the task from snapshot
  const restoredTask = await prisma.task.create({
    data: {
      id: payload.taskId, // Preserve original ID if possible
      title: payload.title,
      description: payload.description,
      status: payload.status || 'inbox',
      priority: payload.priority || 'medium',
      tags: payload.tags || '[]',
      labels: payload.labels || '[]',
      agentId: payload.agentId,
      dependsOn: payload.dependsOn || '[]',
      dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
      recurrence: payload.recurrence,
      timeSpent: payload.timeSpent || 0,
      customFields: payload.customFields || '[]',
    },
  })

  // Restore subtasks if any
  if (payload.subtasks && payload.subtasks.length > 0) {
    await prisma.subTask.createMany({
      data: payload.subtasks.map((st: { title: string; completed: boolean; order: number }) => ({
        taskId: restoredTask.id,
        title: st.title,
        completed: st.completed || false,
        order: st.order || 0,
      })),
    })
  }

  // Delete the activity log to prevent re-restoring
  await prisma.activityLog.delete({ where: { id: logId } })

  await logActivity('task_restored', { taskId: restoredTask.id, title: restoredTask.title })
  broadcastEvent('task_created', restoredTask)

  return NextResponse.json(restoredTask)
}
