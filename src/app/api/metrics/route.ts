import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
        totalCompletionTime += (updated - created)
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
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    })

    return NextResponse.json({
      totalTasks,
      completedTasks: completedCount,
      tasksByStatus,
      tasksByPriority,
      completionRate: Math.round(completionRate * 10) / 10,
      avgCompletionTime: avgCompletionTime ? Math.round(avgCompletionTime / (1000 * 60 * 60 * 24) * 10) / 10 : null, // Days
      recentActivity,
    })
  } catch (error) {
    console.error('Failed to fetch metrics', error)
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 })
  }
}
