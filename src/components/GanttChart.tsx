'use client'

import { useState, useMemo, useEffect } from 'react'
import { Task } from '@/types'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Calendar } from 'lucide-react'

interface GanttChartProps {
  tasks?: Task[]
  onTaskClick?: (task: Task) => void
}

type ViewMode = 'day' | 'week' | 'month'

export default function GanttChart({ tasks: initialTasks, onTaskClick }: GanttChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [tasks, setTasks] = useState<Task[]>(initialTasks || [])
  const [loading, setLoading] = useState(!initialTasks)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - d.getDay()) // Start of current week
    return d
  })
  
  useEffect(() => {
    if (initialTasks) {
      setTasks(initialTasks)
      setLoading(false)
      return
    }
    
    const fetchTasks = async () => {
      try {
        const res = await fetch('/api/tasks?token=mc_dev_token_2024')
        if (res.ok) {
          const data = await res.json()
          setTasks(data.tasks || data || [])
        }
      } catch (e) {
        console.error('Failed to fetch tasks:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchTasks()
  }, [initialTasks])

  const daysToShow = viewMode === 'day' ? 7 : viewMode === 'week' ? 14 : 30
  
  const dates = useMemo(() => {
    const arr = []
    for (let i = 0; i < daysToShow; i++) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + i)
      arr.push(d)
    }
    return arr
  }, [startDate, daysToShow])

  const tasksWithDates = useMemo(() => {
    return tasks.filter(t => t.dueDate || t.createdAt).map(task => {
      const created = new Date(task.createdAt)
      const due = task.dueDate ? new Date(task.dueDate) : null
      
      // Calculate position
      const startOffset = Math.floor((created.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const duration = due 
        ? Math.ceil((due.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)) + 1
        : 1
        
      return { ...task, startOffset, duration, created, due }
    }).filter(t => t.startOffset < daysToShow && t.startOffset + t.duration > 0)
  }, [tasks, startDate, daysToShow])

  const getTaskPosition = (startOffset: number, duration: number) => {
    const left = Math.max(0, startOffset) * (100 / daysToShow)
    const width = Math.min(duration, daysToShow - Math.max(0, startOffset)) * (100 / daysToShow)
    return { left: `${left}%`, width: `${width}%` }
  }

  // Compute task dependencies for visualization
  const dependencies = useMemo(() => {
    const deps: { from: Task; to: Task; fromIdx: number; toIdx: number }[] = []
    const taskMap = new Map(tasksWithDates.map((t, i) => [t.id, { task: t, idx: i }]))
    
    tasksWithDates.forEach(task => {
      try {
        const dependsOn = task.dependsOn ? JSON.parse(task.dependsOn) : []
        if (Array.isArray(dependsOn)) {
          dependsOn.forEach(depId => {
            const dep = taskMap.get(depId)
            if (dep) {
              const toIdx = tasksWithDates.findIndex(t => t.id === task.id)
              if (toIdx !== -1) {
                deps.push({ from: dep.task, to: task, fromIdx: dep.idx, toIdx })
              }
            }
          })
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    })
    return deps
  }, [tasksWithDates])

  // Generate SVG path for dependency line
  const getDependencyPath = (fromIdx: number, toIdx: number) => {
    const cellHeight = 40 // Approximate row height
    const headerHeight = 60
    const fromY = headerHeight + fromIdx * cellHeight + cellHeight / 2
    const toY = headerHeight + toIdx * cellHeight + cellHeight / 2
    
    // Calculate X positions based on task bars
    const fromTask = tasksWithDates[fromIdx]
    const toTask = tasksWithDates[toIdx]
    
    const fromEnd = (fromTask.startOffset + fromTask.duration) * (100 / daysToShow)
    const toStart = toTask.startOffset * (100 / daysToShow)
    
    const fromX = fromEnd * 4 // Convert % to approximate pixels
    const toX = toStart * 4
    
    // Create curved path
    const midX = (fromX + toX) / 2
    return `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`
  }

  const navigate = (direction: number) => {
    const d = new Date(startDate)
    d.setDate(d.getDate() + (direction * (viewMode === 'month' ? 30 : 7)))
    setStartDate(d)
  }

  const goToToday = () => {
    const d = new Date()
    d.setDate(d.getDate() - d.getDay())
    setStartDate(d)
  }

  const todayIndex = Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

  const priorityColors: Record<string, string> = {
    low: 'bg-slate-400',
    medium: 'bg-blue-500', 
    high: 'bg-red-500',
  }

  const statusLabels: Record<string, string> = {
    inbox: 'Inbox',
    planned: 'Planned',
    in_progress: 'In Progress',
    agent_running: 'Agent',
    blocked: 'Blocked',
    done: 'Done',
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 hover:bg-slate-100 rounded"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToToday}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded"
          >
            <Calendar className="w-4 h-4" />
            Today
          </button>
          <button
            onClick={() => navigate(1)}
            className="p-1.5 hover:bg-slate-100 rounded"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <span className="ml-2 text-sm text-slate-600">
            {dates[0]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {dates[dates.length - 1]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {(['day', 'week', 'month'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-sm rounded-md capitalize ${
                viewMode === mode 
                  ? 'bg-white shadow-sm font-medium text-slate-800' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Gantt Grid */}
      <div className="flex-1 overflow-auto">
        {/* Header - Dates */}
        <div className="sticky top-0 z-10 flex border-b border-slate-200 bg-slate-50">
          <div className="w-64 flex-shrink-0 px-3 py-2 text-sm font-medium text-slate-600 border-r border-slate-200">
            Task
          </div>
          <div className="flex-1 flex">
            {dates.map((date, i) => {
              const isToday = i === todayIndex
              const isWeekend = date.getDay() === 0 || date.getDay() === 6
              return (
                <div 
                  key={i} 
                  className={`flex-1 text-center py-2 text-xs border-r border-slate-200 ${
                    isToday ? 'bg-blue-100' : isWeekend ? 'bg-slate-100' : ''
                  }`}
                >
                  <div className="font-medium text-slate-700">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={`${isToday ? 'text-blue-600 font-bold' : 'text-slate-500'}`}>
                    {date.getDate()}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tasks */}
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="py-12 text-center text-slate-500">
              Loading tasks...
            </div>
          ) : tasksWithDates.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              No tasks with dates to display. Add due dates to tasks to see them here.
            </div>
          ) : (
            tasksWithDates.map(task => {
              const pos = getTaskPosition(task.startOffset, task.duration)
              return (
                <div key={task.id} className="flex hover:bg-slate-50 group">
                  <div className="w-64 flex-shrink-0 px-3 py-2 border-r border-slate-200 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${priorityColors[task.priority] || 'bg-slate-400'}`} />
                    <span className="text-sm truncate flex-1" title={task.title}>
                      {task.title}
                    </span>
                    <span className="text-xs text-slate-400 capitalize">
                      {statusLabels[task.status] || task.status}
                    </span>
                  </div>
                  <div className="flex-1 relative h-10">
                    {/* Today marker */}
                    {todayIndex >= 0 && todayIndex < daysToShow && (
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10"
                        style={{ left: `${(todayIndex + 0.5) * (100 / daysToShow)}%` }}
                      />
                    )}
                    {/* Task bar */}
                    <button
                      onClick={() => onTaskClick?.(task)}
                      className={`absolute top-2 h-6 rounded-md ${priorityColors[task.priority] || 'bg-slate-400'} opacity-80 hover:opacity-100 transition-opacity cursor-pointer shadow-sm`}
                      style={{ left: pos.left, width: pos.width }}
                      title={`${task.title}${task.dueDate ? ` (Due: ${new Date(task.dueDate).toLocaleDateString()})` : ''}`}
                    >
                      <span className="text-xs text-white px-2 truncate block">
                        {task.title}
                      </span>
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Dependency Lines SVG Overlay */}
        {dependencies.length > 0 && (
          <svg 
            className="absolute top-0 left-64 right-0 bottom-0 pointer-events-none z-20"
            style={{ height: `${tasksWithDates.length * 40 + 60}px` }}
          >
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
              </marker>
            </defs>
            {dependencies.map((dep, i) => {
              const cellHeight = 40
              const headerHeight = 60
              const fromY = headerHeight + dep.fromIdx * cellHeight + cellHeight / 2
              const toY = headerHeight + dep.toIdx * cellHeight + cellHeight / 2
              const fromTask = tasksWithDates[dep.fromIdx]
              const toTask = tasksWithDates[dep.toIdx]
              const fromEnd = (fromTask.startOffset + fromTask.duration) * (100 / daysToShow)
              const toStart = toTask.startOffset * (100 / daysToShow)
              const fromX = fromEnd / 100 * (daysToShow * 40)
              const toX = toStart / 100 * (daysToShow * 40)
              const midX = (fromX + toX) / 2
              
              // Get status-based color
              const depColor = fromTask.status === 'done' ? '#4ade80' : 
                               fromTask.status === 'in_progress' ? '#fbbf24' : '#94a3b8'
              
              return (
                <path
                  key={i}
                  d={`M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`}
                  stroke={depColor}
                  strokeWidth="2"
                  fill="none"
                  opacity="0.8"
                  markerEnd="url(#arrowhead)"
                />
              )
            })}
          </svg>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-slate-200 text-xs text-slate-500">
        <span className="font-medium">Priority:</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400" /> Low</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Medium</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> High</span>
        <span className="ml-4 flex items-center gap-1"><span className="w-0.5 h-3 bg-blue-500" /> Today</span>
      </div>
    </div>
  )
}
