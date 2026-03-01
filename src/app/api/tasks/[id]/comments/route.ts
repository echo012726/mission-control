import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: taskId } = await params

  const comments = await prisma.taskComment.findMany({
    where: { taskId },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(comments)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: taskId } = await params
  const body = await req.json()
  const { content } = body

  if (!content || !content.trim()) {
    return NextResponse.json({ error: 'Content required' }, { status: 400 })
  }

  // Check task exists
  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  const comment = await prisma.taskComment.create({
    data: {
      taskId,
      content: content.trim(),
      author: 'user',
    },
  })

  return NextResponse.json(comment)
}
