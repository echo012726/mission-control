import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, logActivity } from '@/lib/auth'
import { broadcastEvent } from '@/lib/sse-server'
import { triggerTaskEvent } from '@/lib/pusher'

// GET /api/trash - List deleted tasks
export async function GET(req: NextRequest) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  const tasks = await prisma.task.findMany({
    where: { deletedAt: { not: null } },
    orderBy: { deletedAt: 'desc' },
    take: limit,
    skip: offset,
    include: {
      subtasks: true,
      comments: true,
      attachments: true,
    },
  })

  const total = await prisma.task.count({
    where: { deletedAt: { not: null } },
  })

  return NextResponse.json({ tasks, total })
}

// POST /api/trash/restore - Restore a task from trash
export async function POST(req: NextRequest) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { taskId, action } = body

  if (action === 'restore') {
    const task = await prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: null },
      include: { subtasks: { orderBy: { order: 'asc' } } },
    })

    await logActivity('task_restored', { taskId, title: task.title })
    broadcastEvent('task_restored', task)
    triggerTaskEvent('task:restored', task).catch(console.error)

    return NextResponse.json({ success: true, task })
  }

  if (action === 'restoreAll') {
    const result = await prisma.task.updateMany({
      where: { deletedAt: { not: null } },
      data: { deletedAt: null },
    })

    await logActivity('all_tasks_restored', { count: result.count })
    broadcastEvent('tasks_restored', { count: result.count })

    return NextResponse.json({ success: true, restored: result.count })
  }

  if (action === 'empty') {
    const deletedTasks = await prisma.task.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true },
    })

    const deletedIds = deletedTasks.map(t => t.id)

    for (const taskId of deletedIds) {
      await prisma.subTask.deleteMany({ where: { taskId } })
      await prisma.taskComment.deleteMany({ where: { taskId } })
      await prisma.taskAttachment.deleteMany({ where: { taskId } })
    }

    await prisma.task.deleteMany({
      where: { deletedAt: { not: null } },
    })

    await logActivity('trash_emptied', { count: deletedIds.length })

    return NextResponse.json({ success: true, deleted: deletedIds.length })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

// DELETE /api/trash - Permanently delete a single task
export async function DELETE(req: NextRequest) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const taskId = searchParams.get('taskId')

  if (!taskId) {
    return NextResponse.json({ error: 'taskId required' }, { status: 400 })
  }

  const task = await prisma.task.findFirst({
    where: { id: taskId, deletedAt: { not: null } },
  })

  if (!task) {
    return NextResponse.json({ error: 'Task not found in trash' }, { status: 404 })
  }

  await prisma.subTask.deleteMany({ where: { taskId } })
  await prisma.taskComment.deleteMany({ where: { taskId } })
  await prisma.taskAttachment.deleteMany({ where: { taskId } })

  await prisma.task.delete({ where: { id: taskId } })

  await logActivity('task_permanently_deleted', { taskId, title: task.title })

  return NextResponse.json({ success: true })
}
