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
  const body = await req.json()
  const source = body.source || 'manual'

  // Check if already completed today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const existingCompletion = await prisma.habitCompletion.findFirst({
    where: {
      habitId: id,
      completedAt: {
        gte: today,
        lt: tomorrow,
      },
    },
  })

  if (existingCompletion) {
    return NextResponse.json({ error: 'Already completed today', code: 'ALREADY_COMPLETED' })
  }

  // Create completion
  const completion = await prisma.habitCompletion.create({
    data: {
      habitId: id,
      source,
    },
  })

  // Update streak
  const habit = await prisma.habit.findUnique({ where: { id } })
  if (habit) {
    const lastCompletion = await prisma.habitCompletion.findFirst({
      where: { habitId: id },
      orderBy: { completedAt: 'desc' },
      skip: 1,
    })

    let newStreak = habit.streak
    if (lastCompletion) {
      const lastDate = new Date(lastCompletion.completedAt)
      const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays === 1) {
        newStreak = habit.streak + 1
      } else if (diffDays > 1) {
        newStreak = 1
      }
    } else {
      newStreak = 1
    }

    await prisma.habit.update({
      where: { id },
      data: {
        streak: newStreak,
        bestStreak: Math.max(habit.bestStreak, newStreak),
      },
    })
  }

  return NextResponse.json(completion)
}
