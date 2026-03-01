'use client'

import { useState, useEffect, useCallback } from 'react'
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripHorizontal, X, Plus, Layout, ListChecks, Clock, Calendar, TrendingUp, Activity, Bot, CheckCircle } from 'lucide-react'
import { Task, Label } from '@/types'

interface Widget {
  id: string
  type: 'tasksummary' | 'recenttasks' | 'upcoming' | 'subtasks' | 'timer' | 'labels'
  title: string
}

const DEFAULT_WIDGETS: Widget[] = [
  { id: 'w1', type: 'tasksummary', title: 'Task Summary' },
  { id: 'w2', type: 'recenttasks', title: 'Recent Tasks' },
  { id: 'w3', type: 'upcoming', title: 'Upcoming Due' },
  { id: 'w4', type: 'labels', title: 'Labels' },
]

function SortableWidget({ widget, children }: { widget: Widget; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: widget.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-white text-sm">{widget.title}</h3>
        <button {...attributes} {...listeners} className="text-gray-500 hover:text-gray-400 cursor-grab">
          <GripHorizontal size={16} />
        </button>
      </div>
      {children}
    </div>
  )
}

function TaskSummaryWidget({ tasks }: { tasks: Task[] }) {
  const total = tasks.length
  const completed = tasks.filter(t => t.status === 'done').length
  const inProgress = tasks.filter(t => t.status === 'in_progress').length
  const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="bg-gray-700/50 rounded p-2 text-center">
        <div className="text-xl font-bold text-white">{total}</div>
        <div className="text-xs text-gray-400">Total</div>
      </div>
      <div className="bg-green-600/20 rounded p-2 text-center">
        <div className="text-xl font-bold text-green-400">{completed}</div>
        <div className="text-xs text-gray-400">Done</div>
      </div>
      <div className="bg-yellow-600/20 rounded p-2 text-center">
        <div className="text-xl font-bold text-yellow-400">{inProgress}</div>
        <div className="text-xs text-gray-400">In Progress</div>
      </div>
      <div className="bg-red-600/20 rounded p-2 text-center">
        <div className="text-xl font-bold text-red-400">{overdue}</div>
        <div className="text-xs text-gray-400">Overdue</div>
      </div>
    </div>
  )
}

function RecentTasksWidget({ tasks }: { tasks: Task[] }) {
  const recent = tasks.slice(0, 5)
  
  return (
    <div className="space-y-2 max-h-[200px] overflow-auto">
      {recent.map(task => (
        <div key={task.id} className="flex items-center gap-2 text-sm">
          <span className={`w-2 h-2 rounded-full ${
            task.status === 'done' ? 'bg-green-500' :
            task.status === 'in_progress' ? 'bg-yellow-500' :
            task.status === 'blocked' ? 'bg-red-500' : 'bg-gray-500'
          }`} />
          <span className="text-gray-300 truncate flex-1">{task.title}</span>
        </div>
      ))}
      {recent.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-4">No tasks yet</p>
      )}
    </div>
  )
}

function UpcomingWidget({ tasks }: { tasks: Task[] }) {
  const upcoming = tasks
    .filter(t => t.dueDate && t.status !== 'done')
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5)

  const formatDue = (date: string) => {
    const d = new Date(date)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const isOverdue = (date: string) => new Date(date) < new Date()

  return (
    <div className="space-y-2 max-h-[200px] overflow-auto">
      {upcoming.map(task => (
        <div key={task.id} className="flex items-center justify-between text-sm">
          <span className="text-gray-300 truncate flex-1">{task.title}</span>
          <span className={`text-xs ${isOverdue(task.dueDate!) ? 'text-red-400' : 'text-gray-400'}`}>
            {formatDue(task.dueDate!)}
          </span>
        </div>
      ))}
      {upcoming.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-4">No upcoming tasks</p>
      )}
    </div>
  )
}

function LabelsWidget({ labels, tasks }: { labels: Label[]; tasks: Task[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {labels.map(label => {
        const count = tasks.filter(t => {
          const taskLabels = t.labels ? JSON.parse(t.labels) : []
          return taskLabels.includes(label.id)
        }).length
        
        return (
          <span
            key={label.id}
            className="text-xs px-2 py-1 rounded flex items-center gap-1"
            style={{ backgroundColor: label.color + '40', color: label.color }}
          >
            {label.name}
            <span className="opacity-70">({count})</span>
          </span>
        )
      })}
      {labels.length === 0 && (
        <p className="text-gray-500 text-sm">No labels created</p>
      )}
    </div>
  )
}

export default function DashboardWidgets() {
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_WIDGETS)
  const [tasks, setTasks] = useState<Task[]>([])
  const [labels, setLabels] = useState<Label[]>([])
  const [showAddWidget, setShowAddWidget] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const fetchData = useCallback(async () => {
    try {
      const [tasksRes, labelsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/labels')
      ])
      
      if (tasksRes.ok) setTasks(await tasksRes.json())
      if (labelsRes.ok) setLabels(await labelsRes.json())
    } catch (e) {
      console.error('Failed to fetch data', e)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setWidgets(items => {
      const oldIndex = items.findIndex(i => i.id === active.id)
      const newIndex = items.findIndex(i => i.id === over.id)
      
      const newItems = [...items]
      const [moved] = newItems.splice(oldIndex, 1)
      newItems.splice(newIndex, 0, moved)
      
      return newItems
    })
  }

  const addWidget = (type: Widget['type']) => {
    const titles: Record<Widget['type'], string> = {
      tasksummary: 'Task Summary',
      recenttasks: 'Recent Tasks',
      upcoming: 'Upcoming Due',
      subtasks: 'My Subtasks',
      timer: 'Active Timers',
      labels: 'Labels',
    }
    
    const newWidget: Widget = {
      id: `w${Date.now()}`,
      type,
      title: titles[type],
    }
    
    setWidgets(prev => [...prev, newWidget])
    setShowAddWidget(false)
  }

  const removeWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id))
  }

  const renderWidgetContent = (type: Widget['type']) => {
    switch (type) {
      case 'tasksummary':
        return <TaskSummaryWidget tasks={tasks} />
      case 'recenttasks':
        return <RecentTasksWidget tasks={tasks} />
      case 'upcoming':
        return <UpcomingWidget tasks={tasks} />
      case 'labels':
        return <LabelsWidget labels={labels} tasks={tasks} />
      default:
        return <p className="text-gray-500 text-sm">Widget content</p>
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Layout size={20} className="text-blue-400" />
          Dashboard
        </h2>
        <div className="relative">
          <button
            onClick={() => setShowAddWidget(!showAddWidget)}
            className="flex items-center gap-1 text-gray-400 hover:text-white text-sm bg-gray-800 px-2 py-1 rounded"
          >
            <Plus size={14} /> Add Widget
          </button>
          {showAddWidget && (
            <div className="absolute right-0 top-full mt-1 bg-gray-800 rounded-lg border border-gray-700 p-2 min-w-[150px] z-10">
              {(['tasksummary', 'recenttasks', 'upcoming', 'labels'] as Widget['type'][]).map(type => (
                <button
                  key={type}
                  onClick={() => addWidget(type)}
                  className="w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700 rounded"
                >
                  {type === 'tasksummary' && 'Task Summary'}
                  {type === 'recenttasks' && 'Recent Tasks'}
                  {type === 'upcoming' && 'Upcoming Due'}
                  {type === 'labels' && 'Labels'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Widgets Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgets.map(w => w.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {widgets.map(widget => (
              <SortableWidget key={widget.id} widget={widget}>
                <button
                  onClick={() => removeWidget(widget.id)}
                  className="absolute top-2 right-2 text-gray-500 hover:text-red-400"
                >
                  <X size={14} />
                </button>
                {renderWidgetContent(widget.type)}
              </SortableWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {widgets.length === 0 && (
        <div className="text-center py-8">
          <Layout size={48} className="mx-auto text-gray-600 mb-2" />
          <p className="text-gray-500">No widgets. Click "Add Widget" to get started.</p>
        </div>
      )}
    </div>
  )
}
