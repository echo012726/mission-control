'use client'
import { useState, useEffect } from 'react'
import { Play, Pause, Clock, X, Timer, Calendar } from 'lucide-react'

interface ActiveTimer {
  id: string
  taskId: string
  taskTitle: string
  startedAt: string
  elapsed: number
}

interface TimeTrackingPanelProps {
  onClose?: () => void
}

export default function TimeTrackingPanel({ onClose }: TimeTrackingPanelProps) {
  const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActiveTimers()
    const interval = setInterval(fetchActiveTimers, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [])

  const fetchActiveTimers = async () => {
    try {
      const res = await fetch('/api/tasks?timerRunning=true')
      if (res.ok) {
        const data = await res.json()
        const timers = (data.tasks || []).map((task: any) => ({
          id: task.id,
          taskId: task.id,
          taskTitle: task.title,
          startedAt: task.timerStarted,
          elapsed: Math.floor((Date.now() - new Date(task.timerStarted).getTime()) / 1000) + (task.timeSpent || 0)
        }))
        setActiveTimers(timers)
      }
    } catch (error) {
      console.error('Failed to fetch active timers:', error)
    } finally {
      setLoading(false)
    }
  }

  const stopTimer = async (taskId: string) => {
    try {
      await fetch('/api/tasks/time', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, action: 'stop' })
      })
      fetchActiveTimers()
    } catch (error) {
      console.error('Failed to stop timer:', error)
    }
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const sec = seconds % 60
    if (h > 0) return `${h}h ${m}m ${sec}s`
    if (m > 0) return `${m}m ${sec}s`
    return `${sec}s`
  }

  const formatStartTime = (startedAt: string) => {
    const date = new Date(startedAt)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Update elapsed time every second for active timers
  useEffect(() => {
    if (activeTimers.length === 0) return
    
    const interval = setInterval(() => {
      setActiveTimers(timers => 
        timers.map(timer => ({
          ...timer,
          elapsed: Math.floor((Date.now() - new Date(timer.startedAt).getTime()) / 1000)
        }))
      )
    }, 1000)
    
    return () => clearInterval(interval)
  }, [activeTimers.length])

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

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5" />
          <h3 className="font-semibold">Time Tracking</h3>
          {activeTimers.length > 0 && (
            <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
              {activeTimers.length} active
            </span>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTimers.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No active timers</p>
            <p className="text-xs text-slate-400 mt-1">
              Start a timer on any task to track time
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeTimers.map(timer => (
              <div 
                key={timer.id}
                className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <div className="text-sm font-medium text-slate-800 truncate">
                    {timer.taskTitle}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3 h-3" />
                    Started at {formatStartTime(timer.startedAt)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-mono font-bold text-red-600">
                    {formatTime(timer.elapsed)}
                  </span>
                  <button
                    onClick={() => stopTimer(timer.taskId)}
                    className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    title="Stop timer"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        {activeTimers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Total time tracked:</span>
              <span className="font-semibold text-slate-700">
                {formatTime(activeTimers.reduce((sum, t) => sum + t.elapsed, 0))}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
