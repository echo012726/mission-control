'use client'

import { useState, useEffect } from 'react'
import { ListChecks, CheckCircle, Circle, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { Task, SubTask } from '@/types'

interface SubtasksWidgetProps {
  tasks: Task[]
}

export default function SubtasksWidget({ tasks }: SubtasksWidgetProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks)

  useEffect(() => {
    setLocalTasks(tasks)
  }, [tasks])

  // Extract all subtasks from all tasks
  const allSubtasks: Array<{ subtask: SubTask; taskTitle: string; taskId: string }> = []
  
  localTasks.forEach(task => {
    const subtasks = task.subtasks || []
    subtasks.forEach(subtask => {
      allSubtasks.push({
        subtask,
        taskTitle: task.title,
        taskId: task.id
      })
    })
  })

  // Filter subtasks
  const filteredSubtasks = allSubtasks.filter(({ subtask }) => {
    if (filter === 'pending') return !subtask.completed
    if (filter === 'completed') return subtask.completed
    return true
  })

  // Group by task
  const groupedSubtasks = filteredSubtasks.reduce((acc, { subtask, taskTitle, taskId }) => {
    if (!acc[taskId]) {
      acc[taskId] = { title: taskTitle, subtasks: [] }
    }
    acc[taskId].subtasks.push(subtask)
    return acc
  }, {} as Record<string, { title: string; subtasks: SubTask[] }>)

  const toggleExpand = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }

  const pendingCount = allSubtasks.filter(s => !s.subtask.completed).length
  const completedCount = allSubtasks.filter(s => s.subtask.completed).length

  const toggleSubtask = async (subtaskId: string, completed: boolean, taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      })
      if (res.ok) {
        setLocalTasks(prev => prev.map(t => {
          if (t.id === taskId) {
            return {
              ...t,
              subtasks: (t.subtasks || []).map(s => 
                s.id === subtaskId ? { ...s, completed: !completed } : s
              )
            }
          }
          return t
        }))
      }
    } catch (e) {
      console.error('Failed to toggle subtask', e)
    }
  }

  if (allSubtasks.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <ListChecks className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No subtasks yet</p>
        <p className="text-xs text-gray-400 mt-1">Add subtasks to your tasks to see them here</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-1 rounded ${filter === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
          >
            All ({allSubtasks.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-2 py-1 rounded ${filter === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-2 py-1 rounded ${filter === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
          >
            Done ({completedCount})
          </button>
        </div>
      </div>

      {/* Subtasks list */}
      <div className="space-y-2 max-h-[300px] overflow-auto">
        {Object.entries(groupedSubtasks).map(([taskId, { title, subtasks }]) => (
          <div key={taskId} className="border border-gray-100 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleExpand(taskId)}
              className="w-full flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 text-left"
            >
              <span className="text-sm font-medium text-gray-700 truncate flex-1">{title}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {subtasks.filter(s => s.completed).length}/{subtasks.length}
                </span>
                {expandedTasks.has(taskId) ? (
                  <ChevronUp size={14} className="text-gray-400" />
                ) : (
                  <ChevronDown size={14} className="text-gray-400" />
                )}
              </div>
            </button>
            
            {expandedTasks.has(taskId) && (
              <div className="p-2 space-y-1">
                {subtasks.map(subtask => (
                  <div
                    key={subtask.id}
                    onClick={() => toggleSubtask(subtask.id, subtask.completed, taskId)}
                    className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer group"
                  >
                    {subtask.completed ? (
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                    ) : (
                      <Circle size={16} className="text-gray-300 group-hover:text-gray-400 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${subtask.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredSubtasks.length === 0 && (
        <p className="text-center text-gray-400 text-sm py-4">
          No {filter} subtasks
        </p>
      )}
    </div>
  )
}
