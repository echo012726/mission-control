import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  // Skip auth check in development
  const isDev = process.env.NODE_ENV !== 'production'
  
  if (!isDev) {
    const authenticated = await getSession()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const now = new Date()
  
  // Find overdue tasks (dueDate < now and not done)
  const overdueTasks = await prisma.task.findMany({
    where: {
      dueDate: {
        lt: now,
      },
      status: {
        notIn: ['done', 'completed'],
      },
    },
    orderBy: {
      dueDate: 'asc',
    },
    include: {
      subtasks: true,
    },
  })

  // Also get tasks due today (for advance warnings)
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  
  const dueToday = await prisma.task.findMany({
    where: {
      dueDate: {
        gte: startOfDay,
        lte: today,
      },
      status: {
        notIn: ['done', 'completed'],
      },
    },
    orderBy: {
      dueDate: 'asc',
    },
    include: {
      subtasks: true,
    },
  })

  return NextResponse.json({
    overdue: overdueTasks,
    dueToday,
    summary: {
      overdueCount: overdueTasks.length,
      dueTodayCount: dueToday.length,
    },
  })
}
