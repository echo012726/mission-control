import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'weekly'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Calculate date range
    const now = new Date()
    let start: Date
    let end: Date = now

    if (startDate && endDate) {
      start = new Date(startDate)
      end = new Date(endDate)
    } else {
      // Default ranges
      switch (type) {
        case 'daily':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'weekly':
          const dayOfWeek = now.getDay()
          start = new Date(now)
          start.setDate(now.getDate() - dayOfWeek)
          start.setHours(0, 0, 0, 0)
          break
        case 'monthly':
          start = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        default:
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          start.setDate(start.getDate() - 30)
      }
    }

    // Fetch tasks with time tracking in date range
    const tasks = await prisma.task.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end
        },
        timeSpent: {
          gt: 0
        }
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        tags: true,
        timeSpent: true,
        estimatedTime: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    const totalTime = tasks.reduce((sum, t) => sum + t.timeSpent, 0)
    const tasksCount = tasks.length

    let breakdown: any[] = []
    let summary: any = {}

    switch (type) {
      case 'daily':
        // Group by day
        const byDay: Record<string, number> = {}
        tasks.forEach(task => {
          const day = task.updatedAt.toISOString().split('T')[0]
          byDay[day] = (byDay[day] || 0) + task.timeSpent
        })
        breakdown = Object.entries(byDay).map(([label, value]) => ({ label, value }))
        summary = {
          avgPerDay: breakdown.length > 0 ? Math.round(totalTime / breakdown.length) : 0,
          daysWithWork: breakdown.length
        }
        break

      case 'weekly':
        // Group by day of week
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const byDayOfWeek: Record<string, number> = { Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0 }
        tasks.forEach(task => {
          const dayName = days[task.updatedAt.getDay()]
          byDayOfWeek[dayName] += task.timeSpent
        })
        breakdown = Object.entries(byDayOfWeek).map(([label, value]) => ({ label, value }))
        
        // Find most productive day
        const mostProductive = Object.entries(byDayOfWeek).sort((a, b) => b[1] - a[1])[0]
        summary = {
          avgPerDay: Math.round(totalTime / 7),
          mostProductiveDay: mostProductive?.[0] || null,
          mostProductiveTime: mostProductive?.[1] || 0
        }
        break

      case 'monthly':
        // Group by week
        const byWeek: Record<string, number> = {}
        tasks.forEach(task => {
          const weekStart = new Date(task.updatedAt)
          weekStart.setDate(weekStart.getDate() - weekStart.getDay())
          const weekKey = weekStart.toISOString().split('T')[0]
          byWeek[weekKey] = (byWeek[weekKey] || 0) + task.timeSpent
        })
        breakdown = Object.entries(byWeek)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([label, value]) => ({ label: `Week of ${label}`, value }))
        summary = {
          avgPerWeek: breakdown.length > 0 ? Math.round(totalTime / breakdown.length) : 0,
          weeksWithWork: breakdown.length
        }
        break

      case 'byTag':
        // Group by tags
        const byTag: Record<string, number> = {}
        tasks.forEach(task => {
          const tags = JSON.parse(task.tags || '[]')
          if (tags.length === 0) {
            byTag['Untagged'] = (byTag['Untagged'] || 0) + task.timeSpent
          } else {
            tags.forEach((tag: string) => {
              byTag[tag] = (byTag[tag] || 0) + task.timeSpent
            })
          }
        })
        breakdown = Object.entries(byTag)
          .sort((a, b) => b[1] - a[1])
          .map(([label, value]) => ({ label, value }))
        
        // Top tag
        const topTag = breakdown[0]
        summary = {
          topTag: topTag?.label || null,
          topTagTime: topTag?.value || 0,
          totalTags: breakdown.length
        }
        break

      case 'byPriority':
        // Group by priority
        const byPriority: Record<string, number> = { high: 0, medium: 0, low: 0, urgent: 0 }
        tasks.forEach(task => {
          const p = task.priority || 'medium'
          byPriority[p] = (byPriority[p] || 0) + task.timeSpent
        })
        breakdown = Object.entries(byPriority).map(([label, value]) => ({ label, value }))
        
        const highPriority = byPriority.high + byPriority.urgent
        summary = {
          highPriorityTime: highPriority,
          mediumPriorityTime: byPriority.medium,
          lowPriorityTime: byPriority.low,
          highPriorityPercent: totalTime > 0 ? Math.round((highPriority / totalTime) * 100) : 0
        }
        break

      case 'byStatus':
        // Group by status
        const byStatus: Record<string, number> = {}
        tasks.forEach(task => {
          const status = task.status || 'inbox'
          byStatus[status] = (byStatus[status] || 0) + task.timeSpent
        })
        breakdown = Object.entries(byStatus).map(([label, value]) => ({ label, value }))
        
        const doneTime = byStatus.done || 0
        summary = {
          doneTime,
          inProgressTime: byStatus.inProgress || 0,
          donePercent: totalTime > 0 ? Math.round((doneTime / totalTime) * 100) : 0
        }
        break

      default:
        // Just return tasks
        breakdown = tasks.map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          timeSpent: t.timeSpent,
          estimatedTime: t.estimatedTime
        }))
    }

    return NextResponse.json({
      type,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      totalTime,
      tasksCount,
      breakdown,
      summary,
      tasks: type === 'daily' ? tasks.slice(0, 20).map(t => ({
        id: t.id,
        title: t.title,
        timeSpent: t.timeSpent,
        estimatedTime: t.estimatedTime,
        status: t.status
      })) : undefined
    })
  } catch (error) {
    console.error('Time reports error:', error)
    return NextResponse.json({ error: 'Failed to generate time report' }, { status: 500 })
  }
}
