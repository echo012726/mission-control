'use client'

import { useState, useEffect } from 'react'
import { Bell, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react'

interface OverdueTask {
  id: string
  title: string
  description: string | null
  priority: string
  dueDate: string | null
  status: string
}

interface OverdueResponse {
  overdue: OverdueTask[]
  dueToday: OverdueTask[]
  summary: {
    overdueCount: number
    dueTodayCount: number
  }
}

export default function RemindersWidget() {
  const [data, setData] = useState<OverdueResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const fetchOverdue = () => {
    fetch('/api/...?token=marcus2026&&tasks/overdue')
      .then(res => res.json())
      .then(d => {
        setData(d)
        setLoading(false)
        setLastChecked(new Date())
      })
      .catch(() => setLoading(false))
  }

  // Fetch on mount and poll every 5 minutes
  useEffect(() => {
    fetchOverdue()
    const interval = setInterval(fetchOverdue, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const dismissTask = (taskId: string) => {
    setDismissed(prev => new Set(prev).add(taskId))
  }

  const visibleOverdue = data?.overdue.filter(t => !dismissed.has(t.id)) || []
  const visibleDueToday = data?.dueToday.filter(t => !dismissed.has(t.id)) || []

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50'
      case 'medium': return 'text-orange-600 bg-orange-50'
      default: return 'text-slate-600 bg-slate-50'
    }
  }

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="h-16 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  const totalCount = visibleOverdue.length + visibleDueToday.length

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Bell className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="font-semibold text-slate-800">Reminders</h3>
          {totalCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
              {totalCount}
            </span>
          )}
        </div>
        {lastChecked && (
          <span className="text-xs text-slate-400">
            Updated {lastChecked.toLocaleTimeString()}
          </span>
        )}
      </div>

      {totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-green-500 mb-2" />
          <p className="text-slate-600 font-medium">All caught up!</p>
          <p className="text-slate-400 text-sm">No overdue or due today tasks</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Overdue Section */}
          {visibleOverdue.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-600">
                  Overdue ({visibleOverdue.length})
                </span>
              </div>
              <div className="space-y-2">
                {visibleOverdue.map(task => (
                  <div
                    key={task.id}
                    className="flex items-start gap-2 p-2 rounded-lg bg-red-50 border border-red-100"
                  >
                    <button
                      onClick={() => dismissTask(task.id)}
                      className="text-slate-400 hover:text-slate-600 text-xs mt-0.5"
                      title="Dismiss"
                    >
                      ✕
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className="text-xs text-red-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDueDate(task.dueDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Due Today Section */}
          {visibleDueToday.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-600">
                  Due Today ({visibleDueToday.length})
                </span>
              </div>
              <div className="space-y-2">
                {visibleDueToday.map(task => (
                  <div
                    key={task.id}
                    className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-100"
                  >
                    <button
                      onClick={() => dismissTask(task.id)}
                      className="text-slate-400 hover:text-slate-600 text-xs mt-0.5"
                      title="Dismiss"
                    >
                      ✕
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
