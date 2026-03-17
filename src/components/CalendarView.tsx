'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List, Grid3X3 } from 'lucide-react'
import { Task, Label } from '@/types'

interface CalendarViewProps {
  tasks: Task[]
  labels: Label[]
  onTaskClick: (task: Task) => void
  onTaskDrop?: (taskId: string, newDate: Date) => void
  onQuickAdd?: (date: Date) => void
}

type CalendarView = 'month' | 'week'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function CalendarView({
  tasks,
  labels,
  onTaskClick,
  onTaskDrop,
  onQuickAdd
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>('month')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get priority color
  const getPriorityColor = (priority: string | undefined) => {
    switch (priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-slate-500'
    }
  }

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return tasks.filter(task => {
      if (!task.dueDate) return false
      const taskDate = new Date(task.dueDate).toISOString().split('T')[0]
      return taskDate === dateStr
    })
  }

  // Generate month calendar days
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days: Date[] = []
    const current = new Date(startDate)
    
    while (days.length < 42) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return days
  }, [currentDate])

  // Generate week calendar days
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    
    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      days.push(day)
    }
    return days
  }, [today])

  const navigate = (direction: number) => {
    const newDate = new Date(currentDate)
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + direction)
    } else {
      newDate.setDate(newDate.getDate() + (direction * 7))
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  const isSelected = (date: Date) => {
    if (!selectedDate) return false
    return date.toDateString() === selectedDate.toDateString()
  }

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
  }

  const handleDayDoubleClick = (date: Date) => {
    if (onQuickAdd) {
      onQuickAdd(date)
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent, date: Date) => {
    e.preventDefault()
    e.currentTarget.classList.add('bg-blue-500/20')
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-blue-500/20')
  }

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault()
    e.currentTarget.classList.remove('bg-blue-500/20')
    const taskId = e.dataTransfer.getData('taskId')
    if (taskId && onTaskDrop) {
      onTaskDrop(taskId, date)
    }
  }

  const getLabelColor = (labelId: string) => {
    const label = labels.find(l => l.id === labelId)
    return label?.color || '#666'
  }

  return (
    <div className="flex flex-col h-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => navigate(1)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
          <h2 className="text-xl font-semibold ml-4">
            {view === 'month' 
              ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : `Week of ${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
            }
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('month')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              view === 'month' ? 'bg-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            <Grid3X3 size={16} />
            Month
          </button>
          <button
            onClick={() => setView('week')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              view === 'week' ? 'bg-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            <List size={16} />
            Week
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto p-4">
        {view === 'month' ? (
          <div className="grid grid-cols-7 gap-1 h-full">
            {/* Day Headers */}
            {DAYS.map(day => (
              <div key={day} className="text-center text-sm font-medium text-slate-400 py-2">
                {day}
              </div>
            ))}
            
            {/* Calendar Days */}
            {monthDays.map((date, idx) => {
              const dayTasks = getTasksForDate(date)
              const isTodayDate = isToday(date)
              const isCurrentMonthDate = isCurrentMonth(date)
              const isSelectedDate = isSelected(date)
              
              return (
                <div
                  key={idx}
                  onClick={() => handleDayClick(date)}
                  onDoubleClick={() => handleDayDoubleClick(date)}
                  onDragOver={(e) => handleDragOver(e, date)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, date)}
                  className={`
                    min-h-[100px] p-2 border border-slate-700/50 rounded-lg cursor-pointer transition-all
                    ${!isCurrentMonthDate ? 'opacity-40' : ''}
                    ${isTodayDate ? 'border-blue-500 bg-blue-500/10' : ''}
                    ${isSelectedDate ? 'ring-2 ring-blue-500' : ''}
                    hover:bg-slate-700/30
                  `}
                >
                  <div className={`
                    text-sm font-medium mb-1
                    ${isTodayDate ? 'text-blue-400' : 'text-slate-300'}
                  `}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map(task => (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onTaskClick(task)
                        }}
                        className={`
                          text-xs p-1 rounded truncate cursor-pointer hover:opacity-80
                          ${task.priority === 'high' ? 'bg-red-500/20 text-red-300' : ''}
                          ${task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' : ''}
                          ${task.priority === 'low' || !task.priority ? 'bg-slate-600/50 text-slate-300' : ''}
                        `}
                      >
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-xs text-slate-400">
                        +{dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Week View */
          <div className="grid grid-cols-7 gap-2 h-full">
            {weekDays.map((date, idx) => {
              const dayTasks = getTasksForDate(date)
              const isTodayDate = isToday(date)
              
              return (
                <div
                  key={idx}
                  onClick={() => handleDayClick(date)}
                  onDoubleClick={() => handleDayDoubleClick(date)}
                  onDragOver={(e) => handleDragOver(e, date)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, date)}
                  className={`
                    flex flex-col border border-slate-700/50 rounded-lg overflow-hidden
                    ${isTodayDate ? 'border-blue-500' : ''}
                  `}
                >
                  <div className={`
                    text-center p-2
                    ${isTodayDate ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700/50'}
                  `}>
                    <div className="text-xs text-slate-400">{DAYS[date.getDay()]}</div>
                    <div className={`text-lg font-semibold ${isTodayDate ? 'text-blue-400' : ''}`}>
                      {date.getDate()}
                    </div>
                  </div>
                  <div className="flex-1 p-2 space-y-1 overflow-auto">
                    {dayTasks.map(task => (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onTaskClick(task)
                        }}
                        className={`
                          text-xs p-2 rounded cursor-pointer hover:opacity-80
                          ${task.priority === 'high' ? 'bg-red-500/20 text-red-300 border-l-2 border-red-500' : ''}
                          ${task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border-l-2 border-yellow-500' : ''}
                          ${task.priority === 'low' || !task.priority ? 'bg-slate-600/50 text-slate-300 border-l-2 border-slate-500' : ''}
                        `}
                      >
                        <div className="font-medium truncate">{task.title}</div>
                        {task.dueDate && (
                          <div className="text-xs opacity-60 mt-1">
                            {new Date(task.dueDate).toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit' 
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Selected Day Panel */}
      {selectedDate && (
        <div className="border-t border-slate-700 p-4 bg-slate-800/50">
          <h3 className="font-semibold mb-2">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          <div className="flex flex-wrap gap-2">
            {getTasksForDate(selectedDate).map(task => (
              <button
                key={task.id}
                onClick={() => onTaskClick(task)}
                className={`
                  px-3 py-1.5 rounded-lg text-sm text-left
                  ${task.priority === 'high' ? 'bg-red-500/20 text-red-300' : ''}
                  ${task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' : ''}
                  ${task.priority === 'low' || !task.priority ? 'bg-slate-600 text-slate-300' : ''}
                `}
              >
                {task.title}
              </button>
            ))}
            {getTasksForDate(selectedDate).length === 0 && (
              <span className="text-slate-500 text-sm">No tasks</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
