'use client'

import { useState, useEffect } from 'react'
import { Clock, TrendingUp, TrendingDown, Minus, Target } from 'lucide-react'

interface TaskTimeData {
  id: string
  title: string
  status: string
  estimatedTime: number | null
  timeSpent: number
  completedAt: string | null
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  const hours = Math.floor(seconds / 3600)
  const mins = Math.round((seconds % 3600) / 60)
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

function formatTimeShort(seconds: number): string {
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  return `${Math.round(seconds / 3600)}h`
}

export default function EstimatedVsActualWidget() {
  const [tasks, setTasks] = useState<TaskTimeData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/...?token=marcus2026&&tasks')
      .then(res => res.json())
      .then(data => {
        // Filter tasks that have either estimated or actual time
        const filtered = (data.tasks || data || []).filter((t: TaskTimeData) => 
          (t.estimatedTime && t.estimatedTime > 0) || (t.timeSpent && t.timeSpent > 0)
        )
        setTasks(filtered)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-slate-200 rounded w-1/2"></div>
          <div className="h-20 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  // Calculate totals
  const totalEstimated = tasks.reduce((sum, t) => sum + (t.estimatedTime || 0), 0)
  const totalActual = tasks.reduce((sum, t) => sum + t.timeSpent, 0)
  const difference = totalActual - totalEstimated
  const accuracy = totalEstimated > 0 ? Math.round((totalEstimated / totalActual) * 100) : 0

  // Completed tasks only for accuracy calculation
  const completedTasks = tasks.filter(t => t.status === 'done')
  const completedWithEstimate = completedTasks.filter(t => t.estimatedTime && t.estimatedTime > 0)
  
  let avgAccuracy = 0
  if (completedWithEstimate.length > 0) {
    const accuracies = completedWithEstimate.map(t => {
      if (t.timeSpent === 0) return 100
      const ratio = t.estimatedTime! / t.timeSpent
      return Math.min(100, Math.round(ratio * 100))
    })
    avgAccuracy = Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length)
  }

  const getTrendIcon = (estimate: number, actual: number) => {
    if (actual < estimate * 0.9) return <TrendingDown className="w-4 h-4 text-green-500" />
    if (actual > estimate * 1.1) return <TrendingUp className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-slate-400" />
  }

  const getAccuracyColor = (acc: number) => {
    if (acc >= 90) return 'text-green-600'
    if (acc >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-blue-500/10">
          <Clock className="w-5 h-5 text-blue-500" />
        </div>
        <h3 className="font-semibold text-slate-800">Estimated vs Actual</h3>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-6 text-slate-500">
          <Target className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-sm">No time tracking data yet</p>
          <p className="text-xs text-slate-400">Add estimated time to tasks and use the timer</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-slate-50 rounded-lg p-2 text-center">
              <div className="text-xs text-slate-500">Estimated</div>
              <div className="text-lg font-semibold text-slate-700">{formatTimeShort(totalEstimated)}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-2 text-center">
              <div className="text-xs text-slate-500">Actual</div>
              <div className="text-lg font-semibold text-slate-700">{formatTimeShort(totalActual)}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-2 text-center">
              <div className="text-xs text-slate-500">Accuracy</div>
              <div className={`text-lg font-semibold ${getAccuracyColor(avgAccuracy)}`}>
                {completedWithEstimate.length > 0 ? `${avgAccuracy}%` : '-'}
              </div>
            </div>
          </div>

          {/* Difference indicator */}
          {totalEstimated > 0 && (
            <div className={`flex items-center justify-center gap-2 mb-3 text-sm ${difference <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {difference <= 0 ? (
                <> <TrendingDown className="w-4 h-4" /> Under by {formatTime(Math.abs(difference))} </>
              ) : (
                <> <TrendingUp className="w-4 h-4" /> Over by {formatTime(difference)} </>
              )}
            </div>
          )}

          {/* Task list */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {tasks.slice(0, 10).map(task => {
              const hasEstimate = task.estimatedTime && task.estimatedTime > 0
              const hasActual = task.timeSpent > 0
              
              return (
                <div key={task.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-slate-50">
                  <div className="flex-1 min-w-0 mr-2">
                    <div className="text-slate-700 truncate">{task.title}</div>
                    <div className="text-xs text-slate-400 flex gap-2">
                      {hasEstimate && <span>Est: {formatTime(task.estimatedTime!)}</span>}
                      {hasActual && <span>Actual: {formatTime(task.timeSpent)}</span>}
                    </div>
                  </div>
                  {hasEstimate && hasActual && (
                    <div className="flex-shrink-0">
                      {getTrendIcon(task.estimatedTime!, task.timeSpent)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {tasks.length > 10 && (
            <div className="text-xs text-slate-400 text-center mt-2">
              +{tasks.length - 10} more tasks
            </div>
          )}
        </>
      )}
    </div>
  )
}
