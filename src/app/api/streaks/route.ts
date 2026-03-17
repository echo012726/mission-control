import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET /api/streaks - Returns streak data
export async function GET(req: NextRequest) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get last 30 days of data
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const streaks = await prisma.dailyStreak.findMany({
    where: {
      date: {
        gte: thirtyDaysAgo.toISOString().split('T')[0]
      }
    },
    orderBy: { date: 'asc' }
  })

  // Calculate current streak
  let currentStreak = 0
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  
  // Check if today or yesterday has completions to start counting
  const todayData = streaks.find(s => s.date === today)
  const yesterdayData = streaks.find(s => s.date === yesterday)
  
  if (todayData && todayData.completedCount > 0) {
    currentStreak = 1
    // Count backwards from yesterday
    for (let i = 2; i <= 365; i++) {
      const checkDate = new Date(Date.now() - i * 86400000).toISOString().split('T')[0]
      const dayData = streaks.find(s => s.date === checkDate)
      if (dayData && dayData.completedCount > 0) {
        currentStreak++
      } else {
        break
      }
    }
  } else if (yesterdayData && yesterdayData.completedCount > 0) {
    // Yesterday started the streak, but nothing today yet
    currentStreak = 1
    for (let i = 2; i <= 365; i++) {
      const checkDate = new Date(Date.now() - i * 86400000).toISOString().split('T')[0]
      const dayData = streaks.find(s => s.date === checkDate)
      if (dayData && dayData.completedCount > 0) {
        currentStreak++
      } else {
        break
      }
    }
  }

  // Calculate longest streak from the data
  let longestStreak = 0
  let tempStreak = 0
  const sortedStreaks = [...streaks].sort((a, b) => a.date.localeCompare(b.date))
  
  for (const streak of sortedStreaks) {
    if (streak.completedCount > 0) {
      tempStreak++
      longestStreak = Math.max(longestStreak, tempStreak)
    } else {
      tempStreak = 0
    }
  }

  // Fill in missing dates with 0
  const result = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const dateStr = d.toISOString().split('T')[0]
    const dayData = streaks.find(s => s.date === dateStr)
    result.push({
      date: dateStr,
      count: dayData?.completedCount || 0,
      dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'short' })
    })
  }

  return NextResponse.json({
    currentStreak,
    longestStreak,
    todayCount: todayData?.completedCount || 0,
    last30Days: result
  })
}

// POST /api/streaks - Increment today's completion count
export async function POST(req: NextRequest) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]

  // Upsert today's streak record
  const streak = await prisma.dailyStreak.upsert({
    where: { date: today },
    update: {
      completedCount: { increment: 1 }
    },
    create: {
      date: today,
      completedCount: 1
    }
  })

  return NextResponse.json({
    date: streak.date,
    completedCount: streak.completedCount
  })
}
