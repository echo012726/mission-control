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
      completions: true,
    },
  })

  const now = new Date()
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Calculate overall stats
  const totalHabits = habits.length
  let totalCompletions7 = 0
  let totalCompletions30 = 0
  let avgStreak = 0

  const habitStats = habits.map(habit => {
    const c7 = habit.completions.filter(c => new Date(c.completedAt) >= last7Days).length
    const c30 = habit.completions.filter(c => new Date(c.completedAt) >= last30Days).length
    totalCompletions7 += c7
    totalCompletions30 += c30
    avgStreak += habit.streak

    return {
      id: habit.id,
      name: habit.name,
      streak: habit.streak,
      bestStreak: habit.bestStreak,
      rate7: Math.round((c7 / 7) * 100),
      rate30: Math.round((c30 / 30) * 100),
    }
  })

  avgStreak = totalHabits > 0 ? Math.round(avgStreak / totalHabits) : 0

  // Find best and worst habits
  const sortedByRate = [...habitStats].sort((a, b) => b.rate7 - a.rate7)
  const bestHabit = sortedByRate[0] || null
  const worstHabit = sortedByRate[sortedByRate.length - 1] || null

  // Weekly summary - completions per day
  const weeklyData = []
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now)
    day.setDate(day.getDate() - i)
    day.setHours(0, 0, 0, 0)
    const dayEnd = new Date(day)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const dayCompletions = habits.reduce((sum, habit) => {
      return sum + habit.completions.filter(c => {
        const d = new Date(c.completedAt)
        return d >= day && d < dayEnd
      }).length
    }, 0)

    weeklyData.push({
      date: day.toISOString().split('T')[0],
      dayName: day.toLocaleDateString('en-US', { weekday: 'short' }),
      completions: dayCompletions,
    })
  }

  return NextResponse.json({
    totalHabits,
    avgStreak,
    totalCompletionsLast7: totalCompletions7,
    totalCompletionsLast30: totalCompletions30,
    avgCompletionRate7: totalHabits > 0 ? Math.round((totalCompletions7 / (totalHabits * 7)) * 100) : 0,
    bestHabit,
    worstHabit,
    habitStats,
    weeklyData,
  })
}
