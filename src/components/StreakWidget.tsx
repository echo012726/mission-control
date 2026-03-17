'use client'

import { useState, useEffect } from 'react'
import { Flame, Trophy, Target, Calendar } from 'lucide-react'

interface StreakData {
  currentStreak: number
  longestStreak: number
  todayCount: number
  last30Days: {
    date: string
    count: number
    dayOfWeek: string
  }[]
}

export default function StreakWidget() {
  const [data, setData] = useState<StreakData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/streaks')
      .then(res => res.json())
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-slate-200 rounded w-1/2"></div>
          <div className="h-16 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  const currentStreak = data?.currentStreak || 0
  const longestStreak = data?.longestStreak || 0
  const todayCount = data?.todayCount || 0

  // Get last 7 days for the mini calendar
  const last7Days = data?.last30Days?.slice(-7) || []

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-2 rounded-lg ${currentStreak > 0 ? 'bg-orange-500/10' : 'bg-slate-100'}`}>
          <Flame className={`w-5 h-5 ${currentStreak > 0 ? 'text-orange-500' : 'text-slate-400'}`} />
        </div>
        <h3 className="font-semibold text-slate-800">Streaks</h3>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={`rounded-lg p-3 text-center ${currentStreak > 0 ? 'bg-orange-50' : 'bg-slate-50'}`}>
          <div className="flex items-center justify-center gap-1 mb-1">
            <Flame className={`w-4 h-4 ${currentStreak > 0 ? 'text-orange-500' : 'text-slate-400'}`} />
            <span className="text-xs text-slate-500">Current</span>
          </div>
          <div className={`text-2xl font-bold ${currentStreak > 0 ? 'text-orange-600' : 'text-slate-600'}`}>
            {currentStreak}
          </div>
          <div className="text-xs text-slate-400">day{currentStreak !== 1 ? 's' : ''}</div>
        </div>
        
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-slate-500">Best</span>
          </div>
          <div className="text-2xl font-bold text-slate-700">{longestStreak}</div>
          <div className="text-xs text-slate-400">day{longestStreak !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Today Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-slate-500 flex items-center gap-1">
            <Target className="w-3 h-3" /> Today
          </span>
          <span className="text-slate-700 font-medium">{todayCount} task{todayCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(todayCount * 20, 100)}%` }}
          />
        </div>
      </div>

      {/* Last 7 Days Mini Calendar */}
      <div>
        <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
          <Calendar className="w-3 h-3" /> Last 7 days
        </div>
        <div className="flex justify-between gap-1">
          {last7Days.map((day, idx) => {
            const isToday = idx === last7Days.length - 1
            const hasActivity = day.count > 0
            return (
              <div key={day.date} className="flex flex-col items-center gap-1">
                <div className="text-[10px] text-slate-400">{day.dayOfWeek}</div>
                <div 
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium
                    ${hasActivity ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'}
                    ${isToday && hasActivity ? 'ring-2 ring-orange-300' : ''}
                  `}
                  title={`${day.date}: ${day.count} completed`}
                >
                  {day.count > 0 ? day.count : '·'}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
