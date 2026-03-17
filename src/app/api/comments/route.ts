import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET /api/comments?taskId=xxx - Get comments for a task
// GET /api/comments - Get all comments (for admin)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const taskId = searchParams.get('taskId')
  
  // Skip auth check in development
  const isDev = process.env.NODE_ENV !== 'production'
  
  if (!isDev) {
    const authenticated = await getSession()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const where = taskId ? { taskId } : {}
  
  const comments = await prisma.taskComment.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    include: {
      task: { select: { id: true, title: true } },
    },
  })

  return NextResponse.json(comments)
}

// POST /api/comments - Create a new comment
export async function POST(req: NextRequest) {
  // Skip auth check in development
  const isDev = process.env.NODE_ENV !== 'production'
  
  if (!isDev) {
    const authenticated = await getSession()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const body = await req.json()
  const { taskId, content, author } = body

  if (!taskId || !content) {
    return NextResponse.json({ error: 'taskId and content required' }, { status: 400 })
  }

  // Verify task exists
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  })

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  const comment = await prisma.taskComment.create({
    data: {
      taskId,
      content,
      author: author || 'System',
    },
  })

  return NextResponse.json(comment)
}

// DELETE /api/comments?id=xxx - Delete a comment
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  
  // Skip auth check in development
  const isDev = process.env.NODE_ENV !== 'production'
  
  if (!isDev) {
    const authenticated = await getSession()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (!id) {
    return NextResponse.json({ error: 'Comment ID required' }, { status: 400 })
  }

  await prisma.taskComment.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}
