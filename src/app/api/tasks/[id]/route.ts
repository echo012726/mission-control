import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, logActivity } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const task = await prisma.task.findUnique({ where: { id } })

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

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(body.title && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.status && { status: body.status }),
      ...(body.priority && { priority: body.priority }),
      ...(body.tags && { tags: JSON.stringify(body.tags) }),
      ...(body.agentId !== undefined && { agentId: body.agentId }),
    },
  })

  if (oldTask && oldTask.status !== body.status) {
    await logActivity('task_moved', { 
      taskId: task.id, 
      from: oldTask.status, 
      to: body.status 
    })
  }

  return NextResponse.json(task)
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
  await prisma.task.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
