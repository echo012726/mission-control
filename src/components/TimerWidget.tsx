'use client'

import { useState, useEffect } from 'react'
import { Play, Pause, Clock, Timer, Zap } from 'lucide-react'
import { Task } from '@/types'

interface TimerWidgetProps {
  tasks: Task[]
}

interface ActiveTimer {
  taskId: string
  taskTitle: string
  startedAt: Date
  elapsed: number
}

export default function TimerWidget({ tasks }: TimerWidgetProps) {
  const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Find tasks with active timers
  useEffect(() => {
    const timers: ActiveTimer[] = []
    
    tasks.forEach(task => {
      if (task.timerStarted) {
        const startedAt = new Date(task.timerStarted)
        const elapsed = Math.floor((currentTime.getTime() - startedAt.getTime()) / 1000)
        
        timers.push({
          taskId: task.id,
          taskTitle: task.title,
          startedAt,
          elapsed
        })
      }
    })
    
    setActiveTimers(timers)
  }, [tasks, currentTime])

  const toggleTimer = async (taskId: string, isRunning: boolean) => {
    try {
      const action = isRunning ? 'stop' : 'start'
      await fetch('/api/...?token=marcus2026&&tasks/time', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, action }),
      })
    } catch (e) {
      console.error('Failed to toggle timer', e)
    }
  }

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatStartedAt = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Calculate total time across all active timers
  const totalActiveTime = activeTimers.reduce((acc, t) => acc + t.elapsed, 0)

  // Get tasks that have time spent (for showing recent time tracking)
  const tasksWithTime = tasks
    .filter(t => t.timeSpent > 0 && !t.timerStarted)
    .sort((a, b) => b.timeSpent - a.timeSpent)
    .slice(0, 5)

  if (activeTimers.length === 0 && tasksWithTime.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Timer className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No active timers</p>
        <p className="text-xs text-gray-400 mt-1">Start a timer on any task to track time</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Active Timers Section */}
      {activeTimers.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-semibold text-gray-700">Active Timers</span>
            <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
              {activeTimers.length}
            </span>
          </div>
          
          <div className="space-y-2">
            {activeTimers.map(timer => (
              <div
                key={timer.taskId}
                className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-100 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{timer.taskTitle}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <Clock size={12} />
                    <span>Started at {formatStartedAt(timer.startedAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-mono font-bold text-yellow-700">
                    {formatTime(timer.elapsed)}
                  </span>
                  <button
                    onClick={() => toggleTimer(timer.taskId, true)}
                    className="p-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                    title="Stop timer"
                  >
                    <Pause size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Total active time */}
          <div className="mt-3 p-2 bg-yellow-100 rounded-lg flex items-center justify-between">
            <span className="text-sm text-yellow-800">Total active time</span>
            <span className="font-mono font-bold text-yellow-900">{formatTime(totalActiveTime)}</span>
          </div>
        </div>
      )}

      {/* Recent Time Spent Section */}
      {tasksWithTime.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">Recently Tracked</span>
          </div>
          
          <div className="space-y-2">
            {tasksWithTime.map(task => (
              <div
                key={task.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{task.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-gray-600">
                    {formatTime(task.timeSpent)}
                  </span>
                  <button
                    onClick={() => toggleTimer(task.id, false)}
                    className="p-1.5 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded transition-colors"
                    title="Start timer"
                  >
                    <Play size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTimers.length === 0 && tasksWithTime.length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          No timers currently running. Click play to start tracking time.
        </p>
      )}
    </div>
  )
}
