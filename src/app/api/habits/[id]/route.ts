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
  
  const habit = await prisma.habit.findUnique({
    where: { id },
    include: {
      completions: {
        orderBy: { completedAt: 'desc' },
      },
    },
  })

  if (!habit) {
    return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
  }

  return NextResponse.json(habit)
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
  const { name, icon, color, frequency, linkedTasks } = body

  const habit = await prisma.habit.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(icon && { icon }),
      ...(color && { color }),
      ...(frequency && { frequency }),
      ...(linkedTasks && { linkedTasks: JSON.stringify(linkedTasks) }),
    },
  })

  return NextResponse.json(habit)
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

  await prisma.habit.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}
