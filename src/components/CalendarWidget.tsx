'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

interface Task {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string | null
  tags: string
}

interface CalendarWidgetProps {
  onTaskClick?: (task: Task) => void
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
}

const STATUS_LABELS: Record<string, string> = {
  inbox: '📥',
  planned: '📋',
  in_progress: '🔄',
  done: '✅',
}

export default function CalendarWidget({ onTaskClick }: CalendarWidgetProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTasks() {
      try {
        const res = await fetch('/api/...?token=marcus2026&&tasks')
        const data = await res.json()
        // Filter tasks that have due dates
        const tasksWithDueDates = data.filter((t: Task) => t.dueDate)
        setTasks(tasksWithDueDates)
      } catch (e) {
        console.error('Failed to fetch tasks:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchTasks()
  }, [])

  const { year, month } = useMemo(() => ({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth()
  }), [currentDate])

  const daysInMonth = useMemo(() => {
    return new Date(year, month + 1, 0).getDate()
  }, [year, month])

  const firstDayOfMonth = useMemo(() => {
    return new Date(year, month, 1).getDay()
  }, [year, month])

  const tasksByDay = useMemo(() => {
    const map: Record<number, Task[]> = {}
    tasks.forEach(task => {
      if (!task.dueDate) return
      const taskDate = new Date(task.dueDate)
      if (taskDate.getFullYear() === year && taskDate.getMonth() === month) {
        const day = taskDate.getDate()
        if (!map[day]) map[day] = []
        map[day].push(task)
      }
    })
    return map
  }, [tasks, year, month])

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const isToday = (day: number) => {
    const today = new Date()
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const days: (number | null)[] = []
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  return (
    <div className="p-3">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarIcon size={18} className="text-slate-500" />
          <h3 className="font-semibold text-slate-700">
            {monthNames[month]} {year}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={goToToday}
            className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition-colors"
          >
            Today
          </button>
          <button onClick={goToPrevMonth} className="p-1 hover:bg-slate-100 rounded transition-colors">
            <ChevronLeft size={18} className="text-slate-500" />
          </button>
          <button onClick={goToNextMonth} className="p-1 hover:bg-slate-100 rounded transition-colors">
            <ChevronRight size={18} className="text-slate-500" />
          </button>
        </div>
      </div>

      {/* Day Names Header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs font-medium text-slate-400 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const dayTasks = day ? tasksByDay[day] || [] : []
          const hasTasks = dayTasks.length > 0
          
          return (
            <div
              key={idx}
              className={`
                min-h-[60px] p-1 rounded border text-xs
                ${day ? 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer' : 'bg-transparent border-transparent'}
                ${isToday(day!) ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
              `}
              onClick={() => day && hasTasks && onTaskClick?.(dayTasks[0])}
            >
              {day && (
                <>
                  <div className={`font-medium mb-1 ${isToday(day) ? 'text-blue-600' : 'text-slate-600'}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, 2).map(task => (
                      <div
                        key={task.id}
                        className={`
                          px-1 py-0.5 rounded text-white text-[10px] truncate
                          ${PRIORITY_COLORS[task.priority] || 'bg-slate-400'}
                        `}
                        title={task.title}
                      >
                        {STATUS_LABELS[task.status] || ''} {task.title.slice(0, 10)}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <div className="text-[10px] text-slate-400 pl-1">
                        +{dayTasks.length - 2} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
        <span>{tasksByDay[Object.keys(tasksByDay).length > 0 ? Object.keys(tasksByDay).map(Number).sort((a,b) => a-b)[0] : 0]?.length || 0} tasks this month</span>
        <span>{Object.keys(tasksByDay).length} days with tasks</span>
      </div>
    </div>
  )
}
