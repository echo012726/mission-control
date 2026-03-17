'use client'

import { useState, useEffect } from 'react'
import { Task } from '@/types'
import { Grid3X3, GripVertical, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

// Eisenhower Matrix quadrants
const QUADRANTS = [
  { 
    id: 'q1_do', 
    label: 'Do First', 
    description: 'Urgent & Important',
    color: 'bg-red-50 border-red-200',
    headerColor: 'bg-red-500',
    icon: AlertCircle
  },
  { 
    id: 'q2_schedule', 
    label: 'Schedule', 
    description: 'Not Urgent & Important',
    color: 'bg-blue-50 border-blue-200',
    headerColor: 'bg-blue-500',
    icon: Clock
  },
  { 
    id: 'q3_delegate', 
    label: 'Delegate', 
    description: 'Urgent & Not Important',
    color: 'bg-yellow-50 border-yellow-200',
    headerColor: 'bg-yellow-500',
    icon: GripVertical
  },
  { 
    id: 'q4_eliminate', 
    label: 'Eliminate', 
    description: 'Not Urgent & Not Important',
    color: 'bg-slate-50 border-slate-200',
    headerColor: 'bg-slate-500',
    icon: XCircle
  },
]

// Priority colors
const priorityColors: Record<string, string> = {
  low: 'border-l-4 border-l-slate-400',
  medium: 'border-l-4 border-l-blue-400', 
  high: 'border-l-4 border-l-red-400',
  urgent: 'border-l-4 border-l-red-600',
}

interface PriorityMatrixProps {
  tasks?: Task[]
  onTaskClick?: (task: Task) => void
  onTaskMove?: (taskId: string, fromQuadrant: string, toQuadrant: string) => void
}

// Default export with internal state for standalone use
export default function PriorityMatrix({ tasks: propTasks, onTaskClick, onTaskMove }: PriorityMatrixProps) {
  const [tasks, setTasks] = useState<Task[]>(propTasks || [])
  const [loading, setLoading] = useState(!propTasks)

  // Fetch tasks on mount if not provided via props
  useEffect(() => {
    if (propTasks) {
      setTasks(propTasks)
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
        console.error('Failed to fetch tasks for priority matrix', e)
      } finally {
        setLoading(false)
      }
    }
    fetchTasks()
  }, [])
  // Categorize tasks into quadrants based on priority and due date
  const getQuadrant = (task: Task): string => {
    const now = new Date()
    const isUrgent = task.priority === 'high' || task.priority === 'urgent' || 
      (task.dueDate && new Date(task.dueDate) <= new Date(now.getTime() + 24 * 60 * 60 * 1000)) // Due within 24h
    const isImportant = task.priority === 'high' || task.priority === 'urgent' || task.status !== 'done'
    
    // For done tasks, put them in Q4 (eliminate/complete)
    if (task.status === 'done') {
      return 'q4_eliminate'
    }
    
    if (isUrgent && isImportant) return 'q1_do'
    if (!isUrgent && isImportant) return 'q2_schedule'
    if (isUrgent && !isImportant) return 'q3_delegate'
    return 'q4_eliminate'
  }

  const tasksByQuadrant = QUADRANTS.reduce((acc, q) => {
    acc[q.id] = tasks.filter(t => getQuadrant(t) === q.id)
    return acc
  }, {} as Record<string, Task[]>)

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('taskId', task.id)
    e.dataTransfer.setData('fromQuadrant', getQuadrant(task))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, toQuadrant: string) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    const fromQuadrant = e.dataTransfer.getData('fromQuadrant')
    
    if (taskId && fromQuadrant && fromQuadrant !== toQuadrant) {
      onTaskMove?.(taskId, fromQuadrant, toQuadrant)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 h-[calc(100vh-180px)]">
      {QUADRANTS.map((quadrant) => (
        <div
          key={quadrant.id}
          className={`rounded-xl border-2 ${quadrant.color} flex flex-col overflow-hidden`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, quadrant.id)}
        >
          {/* Quadrant Header */}
          <div className={`${quadrant.headerColor} text-white px-4 py-3 flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <quadrant.icon size={18} />
              <span className="font-bold">{quadrant.label}</span>
            </div>
            <span className="text-sm opacity-90">{tasksByQuadrant[quadrant.id]?.length || 0} tasks</span>
          </div>
          
          {/* Quadrant Description */}
          <div className="px-4 py-2 text-xs font-medium text-slate-500 border-b border-slate-200">
            {quadrant.description}
          </div>

          {/* Tasks List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {tasksByQuadrant[quadrant.id]?.map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task)}
                onClick={() => onTaskClick?.(task)}
                className={`bg-white rounded-lg p-3 shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-all ${priorityColors[task.priority] || ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-slate-800 line-clamp-2">
                    {task.title}
                  </span>
                </div>
                
                {/* Task meta */}
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  {task.priority && task.priority !== 'medium' && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {task.priority}
                    </span>
                  )}
                  
                  {task.dueDate && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                  
                  {task.tags && JSON.parse(task.tags).length > 0 && (
                    <span className="text-xs text-slate-400">
                      {JSON.parse(task.tags).length} tags
                    </span>
                  )}
                </div>
              </div>
            ))}
            
            {tasksByQuadrant[quadrant.id]?.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm">
                No tasks in this quadrant
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
