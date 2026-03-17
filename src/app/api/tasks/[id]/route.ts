import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, logActivity } from '@/lib/auth'
import { broadcastEvent } from '@/lib/sse-server'
import { closeTodoistTask } from '@/lib/todoist'
import { triggerTaskUpdated, triggerTaskMoved } from '@/lib/webhooks'
import { triggerTaskEvent } from '@/lib/pusher'

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
      ...(body.estimatedTime !== undefined && { estimatedTime: body.estimatedTime }),
      ...(body.timerStarted !== undefined && { timerStarted: body.timerStarted ? new Date(body.timerStarted) : null }),
      ...(body.dependsOn !== undefined && { dependsOn: JSON.stringify(body.dependsOn) }),
      ...(body.customFields !== undefined && { customFields: JSON.stringify(body.customFields) }),
      ...(body.starred !== undefined && { starred: body.starred }),
      // Location-based reminder fields
      ...(body.locationName !== undefined && { locationName: body.locationName }),
      ...(body.locationAddress !== undefined && { locationAddress: body.locationAddress }),
      ...(body.locationLat !== undefined && { locationLat: body.locationLat }),
      ...(body.locationLng !== undefined && { locationLng: body.locationLng }),
      ...(body.locationRadius !== undefined && { locationRadius: body.locationRadius }),
      ...(body.locationTrigger !== undefined && { locationTrigger: body.locationTrigger }),
      ...(body.locationEnabled !== undefined && { locationEnabled: body.locationEnabled }),
      // Gmail integration
      ...(body.gmailThreadId !== undefined && { gmailThreadId: body.gmailThreadId }),
      // Team assignment
      ...(body.assigneeId !== undefined && { assigneeId: body.assigneeId }),
      ...(body.assigneeName !== undefined && { assigneeName: body.assigneeName }),
    },
    include: { subtasks: { orderBy: { order: 'asc' } } },
  })

  if (oldTask && oldTask.status !== body.status) {
    await logActivity('task_moved', { 
      taskId: task.id, 
      from: oldTask.status, 
      to: body.status 
    })
    
    // Increment streak when task is completed
    if (body.status === 'done' && oldTask.status !== 'done') {
      const today = new Date().toISOString().split('T')[0]
      await prisma.dailyStreak.upsert({
        where: { date: today },
        update: { completedCount: { increment: 1 } },
        create: { date: today, completedCount: 1 }
      })
    }
    
    // Two-way sync: If task has todoistId and is marked done, close it in Todoist
    if (body.status === 'done' && oldTask.status !== 'done' && task.todoistId) {
      await closeTodoistTask(task.todoistId)
    }

    // Auto-create next recurrence when recurring task is completed
    if (body.status === 'done' && oldTask.status !== 'done' && oldTask?.recurrence) {
      const nextDueDate = calculateNextDueDate(oldTask.dueDate, oldTask.recurrence)
      
      // Create new task for next recurrence in the inbox
      const newRecurringTask = await prisma.task.create({
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
      })

      // Increment recurrence count on the completed task
      await prisma.task.update({
        where: { id },
        data: { recurrenceCount: { increment: 1 } },
      })

      // Log the auto-recurrence
      await logActivity('task_auto_recurred', { 
        originalTaskId: id, 
        newTaskId: newRecurringTask.id 
      })

      // Broadcast the new recurring task creation
      broadcastEvent('task_created', newRecurringTask)
      triggerTaskEvent('task:created', newRecurringTask).catch(console.error)
    }
  }

  // Broadcast to all connected SSE clients
  broadcastEvent('task_updated', task)

  // Trigger webhooks
  if (oldTask) {
    triggerTaskUpdated(task, oldTask.status)
    if (oldTask.status !== task.status) {
      triggerTaskMoved(task, oldTask.status)
    }
  }

  // Trigger real-time via Pusher
  triggerTaskEvent('task:updated', task).catch(console.error)

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
  
  const task = await prisma.task.findUnique({ 
    where: { id },
    include: {
      subtasks: true,
      comments: true,
      attachments: true,
    },
  })
  
  // Store full snapshot for undo capability
  if (task) {
    await prisma.activityLog.create({
      data: {
        type: 'task_deleted',
        payload: JSON.stringify({
          taskId: id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          tags: task.tags,
          labels: task.labels,
          agentId: task.agentId,
          dependsOn: task.dependsOn,
          dueDate: task.dueDate?.toISOString() || null,
          recurrence: task.recurrence,
          timeSpent: task.timeSpent,
          customFields: task.customFields,
          subtasks: task.subtasks.map(st => ({ title: st.title, completed: st.completed, order: st.order })),
          deletedAt: new Date().toISOString(),
        }),
      },
    })
    await prisma.task.update({ where: { id }, data: { deletedAt: new Date() } })
    await logActivity('task_deleted', { taskId: id, title: task.title })
    // Broadcast to all connected SSE clients
    broadcastEvent('task_deleted', { id })
    
    // Trigger real-time via Pusher
    triggerTaskEvent('task:deleted', { id }).catch(console.error)
  }

  return NextResponse.json({ success: true })
}
