import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  
  // Get the original task with all related data
  const originalTask = await prisma.task.findUnique({
    where: { id },
    include: {
      subtasks: true,
      comments: true,
    },
  })

  if (!originalTask) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  // Parse body for optional overrides
  const body = await req.json().catch(() => ({}))
  const { 
    title: overrideTitle, 
    status: overrideStatus,
    duplicateSubtasks = true,
    duplicateComments = false,
  } = body

  // Create the duplicated task
  const duplicatedTask = await prisma.task.create({
    data: {
      title: overrideTitle ? `${overrideTitle}` : `${originalTask.title} (Copy)`,
      description: originalTask.description,
      status: overrideStatus || 'inbox', // Always start in inbox unless overridden
      priority: originalTask.priority,
      tags: originalTask.tags,
      labels: originalTask.labels,
      agentId: null, // Don't duplicate agent assignment
      dependsOn: '[]', // Don't duplicate dependencies
      dueDate: null, // Don't duplicate due date
      recurrence: null, // Don't duplicate recurrence
      estimatedTime: originalTask.estimatedTime,
      customFields: originalTask.customFields,
      // Duplicate subtasks if requested
      ...(duplicateSubtasks && {
        subtasks: {
          create: originalTask.subtasks.map(st => ({
            title: st.title,
            completed: false, // Reset subtasks to incomplete
            order: st.order,
          })),
        },
      }),
    },
    include: {
      subtasks: { orderBy: { order: 'asc' } },
    },
  })

  // Optionally duplicate comments
  if (duplicateComments && originalTask.comments.length > 0) {
    await prisma.taskComment.createMany({
      data: originalTask.comments.map(c => ({
        taskId: duplicatedTask.id,
        content: c.content,
        author: c.author,
      })),
    })
  }

  return NextResponse.json(duplicatedTask)
}
