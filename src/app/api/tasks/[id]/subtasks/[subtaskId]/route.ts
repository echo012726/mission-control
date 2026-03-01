import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: _taskId, subtaskId } = await params
  const body = await req.json()

  const subtask = await prisma.subTask.update({
    where: { id: subtaskId },
    data: {
      ...(body.title && { title: body.title }),
      ...(body.completed !== undefined && { 
        completed: body.completed,
        completedAt: body.completed ? new Date() : null
      }),
      ...(body.order !== undefined && { order: body.order }),
    },
  })

  return NextResponse.json(subtask)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { subtaskId } = await params
  
  await prisma.subTask.delete({ where: { id: subtaskId } })

  return NextResponse.json({ success: true })
}
