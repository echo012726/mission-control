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

  const { id } = await params
  const subtasks = await prisma.subTask.findMany({
    where: { taskId: id },
    orderBy: { order: 'asc' },
  })

  return NextResponse.json(subtasks)
}

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
  const { title, order } = body

  if (!title) {
    return NextResponse.json({ error: 'Title required' }, { status: 400 })
  }

  // Get current max order
  const maxOrder = await prisma.subTask.aggregate({
    where: { taskId: id },
    _max: { order: true },
  })

  const subtask = await prisma.subTask.create({
    data: {
      taskId: id,
      title,
      order: order ?? ((maxOrder._max.order ?? -1) + 1),
    },
  })

  return NextResponse.json(subtask)
}
