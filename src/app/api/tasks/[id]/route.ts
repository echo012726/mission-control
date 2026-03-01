import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, logActivity } from '@/lib/auth'
import { broadcastEvent } from '@/lib/sse-server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const task = await prisma.task.findUnique({ 
    where: { id },
    include: {
      comments: { orderBy: { createdAt: 'asc' } },
      attachments: {
        select: {
          id: true,
          taskId: true,
          filename: true,
          contentType: true,
          size: true,
          uploadedBy: true,
          createdAt: true,
        },
      },
      subtasks: { orderBy: { order: 'asc' } },
    },
  })

  if (!task) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(task)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()

  const oldTask = await prisma.task.findUnique({ where: { id } })

  // Handle time tracking - start timer
  if (body.startTimer) {
    const task = await prisma.task.update({
      where: { id },
      data: { timerStarted: new Date().toISOString() },
      include: { subtasks: { orderBy: { order: 'asc' } } },
    })
    broadcastEvent('task_updated', task)
    return NextResponse.json(task)
  }

  // Handle time tracking - stop timer
  if (body.stopTimer && oldTask?.timerStarted) {
    const startTime = new Date(oldTask.timerStarted).getTime()
    const now = Date.now()
    const elapsedSeconds = Math.floor((now - startTime) / 1000)
    const newTimeSpent = (oldTask.timeSpent || 0) + elapsedSeconds
    
    const task = await prisma.task.update({
      where: { id },
      data: { 
        timerStarted: null,
        timeSpent: newTimeSpent,
      },
      include: { subtasks: { orderBy: { order: 'asc' } } },
    })
    await logActivity('task_timer_stopped', { taskId: task.id, timeAdded: elapsedSeconds })
    broadcastEvent('task_updated', task)
    return NextResponse.json(task)
  }

  // Handle recurring task - create next occurrence
  if (body.createNextRecurrence && oldTask?.recurrence) {
    const nextDueDate = calculateNextDueDate(oldTask.dueDate, oldTask.recurrence)
    
    // Create new task for next recurrence
    const newTask = await prisma.task.create({
      data: {
        title: oldTask.title,
        description: oldTask.description,
        status: 'inbox',
        priority: oldTask.priority,
        tags: oldTask.tags,
        labels: oldTask.labels,
        dueDate: nextDueDate,
        recurrence: oldTask.recurrence,
      },
      include: { subtasks: { orderBy: { order: 'asc' } } },
    })

    // Increment recurrence count on old task
    await prisma.task.update({
      where: { id },
      data: { recurrenceCount: { increment: 1 } },
    })

    await logActivity('task_recurred', { originalTaskId: id, newTaskId: newTask.id })
    broadcastEvent('task_created', newTask)
    return NextResponse.json(newTask)
  }

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(body.title && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.status && { status: body.status }),
      ...(body.priority && { priority: body.priority }),
      ...(body.tags && { tags: JSON.stringify(body.tags) }),
      ...(body.labels && { labels: JSON.stringify(body.labels) }),
      ...(body.agentId !== undefined && { agentId: body.agentId }),
      ...(body.dueDate !== undefined && { 
        dueDate: body.dueDate ? new Date(body.dueDate) : null 
      }),
      ...(body.recurrence !== undefined && { recurrence: body.recurrence }),
      ...(body.timeSpent !== undefined && { timeSpent: body.timeSpent }),
      ...(body.timerStarted !== undefined && { timerStarted: body.timerStarted ? new Date(body.timerStarted) : null }),
    },
    include: { subtasks: { orderBy: { order: 'asc' } } },
  })

  if (oldTask && oldTask.status !== body.status) {
    await logActivity('task_moved', { 
      taskId: task.id, 
      from: oldTask.status, 
      to: body.status 
    })
  }

  // Broadcast to all connected SSE clients
  broadcastEvent('task_updated', task)

  return NextResponse.json(task)
}

function calculateNextDueDate(currentDueDate: Date | null, recurrence: string): Date | null {
  const now = currentDueDate ? new Date(currentDueDate) : new Date()
  
  switch (recurrence) {
    case 'daily':
      now.setDate(now.getDate() + 1)
      break
    case 'weekly':
      now.setDate(now.getDate() + 7)
      break
    case 'monthly':
      now.setMonth(now.getMonth() + 1)
      break
    default:
      return null
  }
  
  return now
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  
  const task = await prisma.task.findUnique({ where: { id } })
  
  await prisma.task.delete({ where: { id } })

  if (task) {
    await logActivity('task_deleted', { taskId: id, title: task.title })
    // Broadcast to all connected SSE clients
    broadcastEvent('task_deleted', { id })
  }

  return NextResponse.json({ success: true })
}
