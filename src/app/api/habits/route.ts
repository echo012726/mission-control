import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const habits = await prisma.habit.findMany({
    include: {
      completions: {
        orderBy: { completedAt: 'desc' },
        take: 30,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Calculate stats for each habit
  const habitsWithStats = habits.map(habit => {
    const now = new Date()
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    const completionsLast7 = habit.completions.filter(c => new Date(c.completedAt) >= last7Days).length
    const completionsLast30 = habit.completions.filter(c => new Date(c.completedAt) >= last30Days).length
    
    return {
      ...habit,
      completionsLast7,
      completionsLast30,
      completionRate7: Math.round((completionsLast7 / 7) * 100),
      completionRate30: Math.round((completionsLast30 / 30) * 100),
    }
  })

  return NextResponse.json(habitsWithStats)
}

export async function POST(req: NextRequest) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, icon, color, frequency, linkedTasks } = body

  if (!name) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 })
  }

  const habit = await prisma.habit.create({
    data: {
      name,
      icon: icon || '⭐',
      color: color || '#6366f1',
      frequency: frequency || 'daily',
      linkedTasks: JSON.stringify(linkedTasks || []),
    },
  })

  return NextResponse.json(habit)
}
