import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { broadcastEvent } from '@/lib/sse-server'

// PATCH /api/tasks/time - Start/stop timer on a task
// Body: { taskId, action: 'start' | 'stop' }
export async function PATCH(req: NextRequest) {
  // Skip auth check in development
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

  const task = await prisma.task.findUnique({
    where: { id: taskId },
  })

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  if (action === 'start') {
    // Start timer - set timerStarted to now if not already running
    if (task.timerStarted) {
      return NextResponse.json({ error: 'Timer already running', timerStarted: task.timerStarted })
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { timerStarted: new Date().toISOString() },
    })

    broadcastEvent('task_updated', updated)
    return NextResponse.json({ 
      success: true, 
      timerStarted: updated.timerStarted,
      timeSpent: updated.timeSpent 
    })
  }

  if (action === 'stop') {
    // Stop timer - calculate elapsed time and add to timeSpent
    if (!task.timerStarted) {
      return NextResponse.json({ error: 'No timer running' })
    }

    const startTime = new Date(task.timerStarted)
    const now = new Date()
    const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000)

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        timerStarted: null,
        timeSpent: task.timeSpent + elapsedSeconds,
      },
    })

    broadcastEvent('task_updated', updated)
    return NextResponse.json({ 
      success: true, 
      timerStarted: null,
      timeSpent: updated.timeSpent 
    })
  }

  if (action === 'add') {
    // Add manual time - add seconds to timeSpent
    const { seconds } = body
    if (!seconds || seconds <= 0) {
      return NextResponse.json({ error: 'Valid seconds required' }, { status: 400 })
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        timeSpent: task.timeSpent + seconds,
      },
    })

    broadcastEvent('task_updated', updated)
    return NextResponse.json({ 
      success: true, 
      timerStarted: updated.timerStarted,
      timeSpent: updated.timeSpent 
    })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
