import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: taskId, commentId } = await params

  // Check comment exists and belongs to the task
  const comment = await prisma.taskComment.findFirst({
    where: { id: commentId, taskId },
  })

  if (!comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
  }

  await prisma.taskComment.delete({
    where: { id: commentId },
  })

  return NextResponse.json({ success: true })
}
