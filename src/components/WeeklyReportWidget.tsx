'use client'

import { useState, useEffect } from 'react'
import { BarChart3, CheckCircle, Plus, Calendar, ArrowLeft, ArrowRight } from 'lucide-react'

interface WeeklyReportData {
  weekStart: string
  weekEnd: string
  weekLabel: string
  summary: {
    completedCount: number
    createdCount: number
    completionRate: number
    totalActive: number
  }
  tasksByStatus: {
    done: number
    in_progress: number
    planned: number
    inbox: number
  }
  tasksByPriority: {
    high: number
    medium: number
    low: number
  }
  topTags: { tag: string; count: number }[]
  dailyBreakdown: {
    date: string
    label: string
    created: number
    completed: number
  }[]
}

export default function WeeklyReportWidget() {
  const [data, setData] = useState<WeeklyReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/weekly-report?offset=${weekOffset}`)
      .then(res => res.json())
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [weekOffset])

  const goToPreviousWeek = () => setWeekOffset(prev => prev - 1)
  const goToNextWeek = () => setWeekOffset(prev => Math.min(prev + 1, 0))

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-slate-200 rounded w-1/2"></div>
          <div className="h-20 bg-slate-200 rounded"></div>
          <div className="h-16 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <p className="text-slate-500 text-sm">Failed to load weekly report</p>
      </div>
    )
  }

  const maxDailyCount = Math.max(
    ...data.dailyBreakdown.map(d => Math.max(d.created, d.completed)),
    1
  )

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <BarChart3 className="w-5 h-5 text-blue-500" />
          </div>
          <h3 className="font-semibold text-slate-800">Weekly Report</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={goToPreviousWeek}
            className="p-1 hover:bg-slate-100 rounded text-slate-500"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="text-xs text-slate-600 px-2">{data.weekLabel}</span>
          <button
            onClick={goToNextWeek}
            disabled={weekOffset === 0}
            className="p-1 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs text-green-600">Completed</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{data.summary.completedCount}</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Plus className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-blue-600">Created</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{data.summary.createdCount}</div>
        </div>
      </div>

      {/* Completion Rate */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-slate-500">Completion Rate</span>
          <span className="text-slate-700 font-medium">{data.summary.completionRate}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-green-500 rounded-full"
            style={{ width: `${data.summary.completionRate}%` }}
          />
        </div>
      </div>

      {/* Daily Breakdown */}
      <div className="mb-4">
        <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
          <Calendar className="w-3 h-3" /> Daily Activity
        </div>
        <div className="flex justify-between items-end gap-1 h-16">
          {data.dailyBreakdown.map((day) => {
            const createdHeight = (day.created / maxDailyCount) * 100
            const completedHeight = (day.completed / maxDailyCount) * 100
            return (
              <div key={day.date} className="flex flex-col items-center flex-1">
                <div className="flex gap-0.5 items-end h-12 w-full justify-center">
                  <div
                    className="w-2 bg-blue-400 rounded-t"
                    style={{ height: `${createdHeight}%` }}
                    title={`Created: ${day.created}`}
                  />
                  <div
                    className="w-2 bg-green-500 rounded-t"
                    style={{ height: `${completedHeight}%` }}
                    title={`Completed: ${day.completed}`}
                  />
                </div>
                <div className="text-[8px] text-slate-400 mt-1">
                  {day.label.split(',')[0]}
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex justify-center gap-4 mt-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full" />
            <span className="text-[10px] text-slate-500">Created</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-[10px] text-slate-500">Done</span>
          </div>
        </div>
      </div>

      {/* Tasks by Status */}
      <div className="text-xs">
        <div className="text-slate-500 mb-1">By Status</div>
        <div className="flex gap-2">
          {Object.entries(data.tasksByStatus).map(([status, count]) => (
            <div
              key={status}
              className="flex-1 bg-slate-50 rounded p-2 text-center"
            >
              <div className="font-medium text-slate-700">{count}</div>
              <div className="text-[10px] text-slate-400 capitalize">{status.replace('_', ' ')}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
