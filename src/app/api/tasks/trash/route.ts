import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  // Skip auth in dev mode
  const isDev = process.env.NODE_ENV !== 'production'
  if (!isDev) {
    const authenticated = await getSession()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '20')

  // Get recent task deletions from activity log
  const deletions = await prisma.activityLog.findMany({
    where: { type: 'task_deleted' },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  const trashedTasks = deletions
    .map(log => {
      try {
        const payload = JSON.parse(log.payload || '{}')
        return {
          deletedAt: payload.deletedAt || log.createdAt.toISOString(),
          taskId: payload.taskId,
          title: payload.title,
          description: payload.description,
          status: payload.status,
          priority: payload.priority,
          tags: payload.tags,
          labels: payload.labels,
          agentId: payload.agentId,
          dependsOn: payload.dependsOn,
          dueDate: payload.dueDate,
          recurrence: payload.recurrence,
          timeSpent: payload.timeSpent,
          customFields: payload.customFields,
          subtasks: payload.subtasks,
          logId: log.id,
        }
      } catch {
        return null
      }
    })
    .filter(Boolean)

  return NextResponse.json(trashedTasks)
}
