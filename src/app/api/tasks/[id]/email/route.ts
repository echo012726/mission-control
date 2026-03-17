import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, logActivity } from '@/lib/auth'
import { broadcastEvent } from '@/lib/sse-server'
import { triggerTaskEvent } from '@/lib/pusher'

// Link an email to a task
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { gmailThreadId, subject, from, snippet } = body

  // Verify task exists
  const task = await prisma.task.findUnique({ where: { id } })
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  // Update task with email link
  const updatedTask = await prisma.task.update({
    where: { id },
    data: {
      gmailThreadId,
    },
    include: { subtasks: { orderBy: { order: 'asc' } } },
  })

  await logActivity('email_linked', { 
    taskId: id, 
    gmailThreadId,
    subject,
    from 
  })

  broadcastEvent('task_updated', updatedTask)
  triggerTaskEvent('task:updated', updatedTask).catch(console.error)

  return NextResponse.json({ 
    success: true, 
    task: updatedTask,
    linkedEmail: { gmailThreadId, subject, from, snippet }
  })
}

// Unlink an email from a task
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Verify task exists
  const task = await prisma.task.findUnique({ where: { id } })
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  const gmailThreadId = task.gmailThreadId

  // Remove email link
  const updatedTask = await prisma.task.update({
    where: { id },
    data: {
      gmailThreadId: null,
    },
    include: { subtasks: { orderBy: { order: 'asc' } } },
  })

  await logActivity('email_unlinked', { taskId: id, gmailThreadId })

  broadcastEvent('task_updated', updatedTask)
  triggerTaskEvent('task:updated', updatedTask).catch(console.error)

  return NextResponse.json({ success: true, task: updatedTask })
}
