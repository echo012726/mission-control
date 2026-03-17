'use client'

import { useState, useEffect } from 'react'
import { Archive, RotateCcw, Search, Loader2, Trash2 } from 'lucide-react'
import { Task } from '@/types'
import { useToast } from '@/components/Toast'

interface ArchiveViewProps {
  token: string
}

export default function ArchiveView({ token }: ArchiveViewProps) {
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { showToast } = useToast()

  useEffect(() => {
    fetchArchivedTasks()
  }, [])

  const fetchArchivedTasks = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/tasks/archive?token=${token}`)
      const data = await res.json()
      setArchivedTasks(data)
    } catch (err) {
      console.error('Failed to fetch archived tasks:', err)
    }
    setLoading(false)
  }

  const handleRestore = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/archive?token=${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, action: 'unarchive' }),
      })
      if (res.ok) {
        setArchivedTasks(archivedTasks.filter(t => t.id !== taskId))
        showToast('Task restored to Done', 'success')
      }
    } catch (err) {
      console.error('Failed to restore task:', err)
      showToast('Failed to restore task', 'error')
    }
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm('Permanently delete this task? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/tasks/${taskId}?token=${token}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setArchivedTasks(archivedTasks.filter(t => t.id !== taskId))
        showToast('Task permanently deleted', 'success')
      }
    } catch (err) {
      console.error('Failed to delete task:', err)
      showToast('Failed to delete task', 'error')
    }
  }

  const filteredTasks = archivedTasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const priorityColors = {
    low: 'bg-slate-200 text-slate-600',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-red-100 text-red-700',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search archived tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800"
          />
        </div>
        <div className="text-sm text-slate-500">
          {filteredTasks.length} archived task{filteredTasks.length !== 1 ? 's' : ''}
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Archive className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No archived tasks</p>
          <p className="text-sm">Tasks you archive will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(task => (
            <div
              key={task.id}
              className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-md transition-shadow"
            >
              <Archive className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-slate-800 dark:text-white truncate">
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    {task.description}
                  </p>
                )}
                <div className="flex gap-2 mt-2">
                  <span className={`px-2 py-0.5 text-xs rounded ${priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.medium}`}>
                    {task.priority}
                  </span>
                  {task.dueDate && (
                    <span className="text-xs text-slate-400">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    Archived: {new Date(task.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRestore(task.id)}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                  title="Restore to Done"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  title="Permanently delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
