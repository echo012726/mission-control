import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DAY_IN_MS = 24 * 60 * 60 * 1000

const formatDayKey = (date: Date) => date.toISOString().slice(0, 10)
const formatDayLabel = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export async function GET() {
  try {
    const allTasks = await prisma.task.findMany()

    const tasksByStatus: Record<string, number> = {}
    const tasksByPriority: Record<string, number> = {}

    let completedCount = 0
    let totalCompletionTime = 0
    let completedWithTime = 0

    for (const task of allTasks) {
      // Count by status
      tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1

      // Count by priority
      tasksByPriority[task.priority] = (tasksByPriority[task.priority] || 0) + 1

      // Calculate completion metrics
      if (task.status === 'done') {
        completedCount++
        const created = new Date(task.createdAt).getTime()
        const updated = new Date(task.updatedAt).getTime()
        totalCompletionTime += updated - created
        completedWithTime++
      }
    }

    const totalTasks = allTasks.length
    const completionRate = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0
    const avgCompletionTime = completedWithTime > 0 ? totalCompletionTime / completedWithTime : null

    // Get recent activity count
    const recentActivity = await prisma.activityLog.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - DAY_IN_MS), // Last 24 hours
        },
      },
    })

    // Build 7-day trend data for charts
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const trendStart = new Date(today.getTime() - 6 * DAY_IN_MS)

    const [createdTasks, completedTasks, recentActivityLogs] = await Promise.all([
      prisma.task.findMany({
        where: { createdAt: { gte: trendStart } },
        select: { createdAt: true },
      }),
      prisma.task.findMany({
        where: {
          status: 'done',
          updatedAt: { gte: trendStart },
        },
        select: { updatedAt: true },
      }),
      prisma.activityLog.findMany({
        where: { createdAt: { gte: trendStart } },
        select: { createdAt: true },
      }),
    ])

    const dailyTrend = Array.from({ length: 7 }, (_, idx) => {
      const date = new Date(trendStart.getTime() + idx * DAY_IN_MS)
      return {
        date: formatDayKey(date),
        label: formatDayLabel(date),
        created: 0,
        completed: 0,
        activity: 0,
      }
    })

    const trendMap = Object.fromEntries(dailyTrend.map((d) => [d.date, d]))

    for (const task of createdTasks) {
      const key = formatDayKey(new Date(task.createdAt))
      if (trendMap[key]) trendMap[key].created += 1
    }

    for (const task of completedTasks) {
      const key = formatDayKey(new Date(task.updatedAt))
      if (trendMap[key]) trendMap[key].completed += 1
    }

    for (const activity of recentActivityLogs) {
      const key = formatDayKey(new Date(activity.createdAt))
      if (trendMap[key]) trendMap[key].activity += 1
    }

    return NextResponse.json({
      totalTasks,
      completedTasks: completedCount,
      tasksByStatus,
      tasksByPriority,
      completionRate: Math.round(completionRate * 10) / 10,
      avgCompletionTime: avgCompletionTime
        ? Math.round((avgCompletionTime / (1000 * 60 * 60 * 24)) * 10) / 10
        : null, // Days
      recentActivity,
      dailyTrend,
    })
  } catch (error) {
    console.error('Failed to fetch metrics', error)
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 })
  }
}
