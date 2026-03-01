'use client'

/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, GripVertical, Search, X, Tag, Download, Loader2, ChevronLeft, ChevronRight, Calendar, MessageSquare, Paperclip, Clock, Trash2 } from 'lucide-react'
import { Task, TaskComment, TaskAttachment } from '@/types'
import { useToast } from '@/components/Toast'
import { useSSE } from '@/lib/useSSE'

const LANES = [
  { id: 'inbox', label: 'Inbox', color: 'border-gray-500' },
  { id: 'planned', label: 'Planned', color: 'border-blue-500' },
  { id: 'in_progress', label: 'In Progress', color: 'border-yellow-500' },
  { id: 'blocked', label: 'Blocked', color: 'border-red-500' },
  { id: 'done', label: 'Done', color: 'border-green-500' },
]

const PRIORITIES = ['low', 'medium', 'high']

function TaskCard({ task, onEdit, isSelected }: { task: Task; onEdit: (task: Task) => void; isSelected?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
  }

  const priorityColors = {
    low: 'bg-gray-600',
    medium: 'bg-blue-600',
    high: 'bg-red-600',
  }

  const tags = task.tags ? (typeof task.tags === 'string' ? JSON.parse(task.tags) : task.tags) : []

  // Check if due date is overdue
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date()

  // Format due date
  const formatDueDate = (dateStr?: string | null) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gray-800 rounded p-3 mb-2 cursor-pointer hover:bg-gray-750 touch-manipulation transition-all duration-200 ${
        isDragging ? 'opacity-50 z-50 scale-105 shadow-xl' : ''
      } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={() => onEdit(task)}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 text-gray-500 hover:text-gray-400 cursor-grab active:cursor-grabbing transition-colors"
        >
          <GripVertical size={14} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{task.title}</p>
          {task.description && (
            <p className="text-gray-400 text-xs mt-1 line-clamp-2">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className={`text-xs px-2 py-0.5 rounded ${priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.medium}`}
            >
              {task.priority}
            </span>
            {tags.length > 0 && tags.map((tag: string, idx: number) => (
              <span
                key={idx}
                className="text-xs px-2 py-0.5 rounded bg-purple-600/50 text-purple-200"
              >
                {tag}
              </span>
            ))}
          </div>
          {task.dueDate && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${isOverdue ? 'text-red-400' : 'text-gray-400'}`}>
              <Clock size={12} />
              <span>{formatDueDate(task.dueDate)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Lane({
  lane,
  tasks,
  onAddTask,
  onEditTask,
  isActive,
  onDragOver,
}: {
  lane: typeof LANES[0]
  tasks: Task[]
  onAddTask: (status: string) => void
  onEditTask: (task: Task) => void
  isActive: boolean
  onDragOver: (laneId: string) => void
}) {
  const { setNodeRef, isOver } = useSortable({ id: lane.id })

  return (
    <div className="flex-shrink-0 w-[85vw] sm:w-[280px] md:min-w-[250px] md:max-w-[300px]">
      <div className={`border-t-2 ${lane.color} px-3 py-2 bg-gray-900 rounded-t transition-colors ${isActive ? 'bg-gray-800' : ''}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-white text-sm sm:text-base">{lane.label}</h3>
          <span className="text-gray-400 text-sm">{tasks.length}</span>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={`bg-gray-900/50 p-2 rounded-b min-h-[150px] sm:min-h-[200px] transition-colors ${isOver ? 'bg-gray-800/70' : ''}`}
        onDragOver={() => onDragOver(lane.id)}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={onEditTask} />
          ))}
        </SortableContext>
        <button
          onClick={() => onAddTask(lane.id)}
          className="w-full flex items-center justify-center gap-1 text-gray-500 hover:text-gray-400 py-2 text-sm transition-colors"
        >
          <Plus size={14} /> Add task
        </button>
      </div>
    </div>
  )
}

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTaskStatus, setNewTaskStatus] = useState('inbox')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [newTask, setNewTask] = useState({ 
    title: '', 
    description: '', 
    priority: 'medium',
    tags: ''
  })
  
  // Comments and attachments state
  const [comments, setComments] = useState<TaskComment[]>([])
  const [attachments, setAttachments] = useState<TaskAttachment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [loadingAttachments, setLoadingAttachments] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [activeTaskTab, setActiveTaskTab] = useState<'details' | 'comments' | 'attachments'>('details')
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterTags, setFilterTags] = useState('')
  
  // Keyboard navigation
  const [selectedLane, setSelectedLane] = useState(0)
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(0)
  const [searchInputRef, setSearchInputRef] = useState<HTMLInputElement | null>(null)
  
  const { showToast } = useToast()
  const searchRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      // Build query params for filtering
      const params = new URLSearchParams()
      if (searchQuery) params.set('q', searchQuery)
      if (filterPriority) params.set('priority', filterPriority)
      if (filterTags) params.set('tags', filterTags)
      
      const url = params.toString() ? `/api/tasks/search?${params}` : '/api/tasks'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setTasks(data)
      }
    } catch (e) {
      console.error('Failed to fetch tasks', e)
      showToast('Failed to load tasks', 'error')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, filterPriority, filterTags, showToast])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Real-time updates via SSE
  useSSE({
    onTaskCreated: (data) => {
      const newTask = data as Task
      setTasks(prev => [newTask, ...prev])
      showToast(`New task: ${newTask.title}`, 'info')
    },
    onTaskUpdated: (data) => {
      const updatedTask = data as Task
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))
    },
    onTaskDeleted: (data) => {
      const { id } = data as { id: string }
      setTasks(prev => prev.filter(t => t.id !== id))
    },
  })

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Allow Escape to close modals
        if (e.key === 'Escape') {
          if (editingTask) setEditingTask(null)
          else if (showAddModal) setShowAddModal(false)
        }
        return
      }

      switch (e.key) {
        case 'n':
          // New task - open add modal for current lane
          setNewTaskStatus(LANES[selectedLane].id)
          setShowAddModal(true)
          break
        case '/':
          // Focus search
          e.preventDefault()
          searchRef.current?.focus()
          break
        case 'ArrowLeft':
          // Navigate lanes left
          e.preventDefault()
          setSelectedLane((prev) => Math.max(0, prev - 1))
          setSelectedTaskIndex(0)
          break
        case 'ArrowRight':
          // Navigate lanes right
          e.preventDefault()
          setSelectedLane((prev) => Math.min(LANES.length - 1, prev + 1))
          setSelectedTaskIndex(0)
          break
        case 'ArrowUp':
          // Navigate tasks up
          e.preventDefault()
          setSelectedTaskIndex((prev) => Math.max(0, prev - 1))
          break
        case 'ArrowDown':
          // Navigate tasks down
          e.preventDefault()
          const currentLaneTasks = getTasksByStatus(LANES[selectedLane].id)
          setSelectedTaskIndex((prev) => Math.min(currentLaneTasks.length - 1, prev + 1))
          break
        case 'Enter':
          // Open selected task
          const laneTasks = getTasksByStatus(LANES[selectedLane].id)
          if (laneTasks[selectedTaskIndex]) {
            setEditingTask(laneTasks[selectedTaskIndex])
          }
          break
        case 'Escape':
          // Close modals
          if (editingTask) setEditingTask(null)
          else if (showAddModal) setShowAddModal(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedLane, selectedTaskIndex, showAddModal, editingTask])

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    if (!over) return
    
    const overLane = LANES.find((l) => l.id === over.id)
    if (overLane) {
      setSelectedLane(LANES.findIndex((l) => l.id === overLane.id))
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = active.id as string
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    // Check if dropped on a lane
    const lane = LANES.find((l) => l.id === over.id)
    if (lane) {
      await updateTaskStatus(taskId, lane.id)
      return
    }

    // Check if dropped on another task
    const overTask = tasks.find((t) => t.id === over.id)
    if (overTask && overTask.status !== task.status) {
      await updateTaskStatus(taskId, overTask.status)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        showToast(`Task moved to ${LANES.find(l => l.id === newStatus)?.label}`, 'success')
        fetchTasks()
      } else {
        showToast('Failed to move task', 'error')
      }
    } catch (e) {
      console.error('Failed to update task', e)
      showToast('Failed to move task', 'error')
    }
  }

  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      showToast('Task title is required', 'error')
      return
    }

    const tagsArray = newTask.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          status: newTaskStatus,
          tags: JSON.stringify(tagsArray),
        }),
      })
      if (res.ok) {
        showToast('Task created successfully', 'success')
        setNewTask({ title: '', description: '', priority: 'medium', tags: '' })
        setShowAddModal(false)
        fetchTasks()
      } else {
        showToast('Failed to create task', 'error')
      }
    } catch (e) {
      console.error('Failed to create task', e)
      showToast('Failed to create task', 'error')
    }
  }

  const handleEditTask = async () => {
    if (!editingTask) return

    const tagsArray = Array.isArray(editingTask.tags) 
      ? editingTask.tags 
      : (editingTask.tags ? JSON.parse(editingTask.tags) : [])

    try {
      const res = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingTask.title,
          description: editingTask.description,
          priority: editingTask.priority,
          tags: JSON.stringify(tagsArray),
          dueDate: editingTask.dueDate,
        }),
      })
      if (res.ok) {
        showToast('Task updated successfully', 'success')
        setEditingTask(null)
        fetchTasks()
      } else {
        showToast('Failed to update task', 'error')
      }
    } catch (e) {
      console.error('Failed to update task', e)
      showToast('Failed to update task', 'error')
    }
  }

  const handleDeleteTask = async () => {
    if (!editingTask) return

    try {
      const res = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        showToast('Task deleted', 'success')
        setEditingTask(null)
        fetchTasks()
      } else {
        showToast('Failed to delete task', 'error')
      }
    } catch (e) {
      console.error('Failed to delete task', e)
      showToast('Failed to delete task', 'error')
    }
  }

  // Fetch comments and attachments when editing a task
  const fetchTaskDetails = async (taskId: string) => {
    setLoadingComments(true)
    setLoadingAttachments(true)
    try {
      // Fetch comments
      const commentsRes = await fetch(`/api/tasks/${taskId}/comments`)
      if (commentsRes.ok) {
        const data = await commentsRes.json()
        setComments(data)
      }
      
      // Fetch attachments
      const attachmentsRes = await fetch(`/api/tasks/${taskId}/attachments`)
      if (attachmentsRes.ok) {
        const data = await attachmentsRes.json()
        setAttachments(data)
      }
    } catch (e) {
      console.error('Failed to fetch task details', e)
    } finally {
      setLoadingComments(false)
      setLoadingAttachments(false)
    }
  }

  // Open task modal - fetch comments and attachments
  const openTaskModal = async (task: Task) => {
    setEditingTask(task)
    setActiveTaskTab('details')
    await fetchTaskDetails(task.id)
  }

  // Handle adding a comment
  const handleAddComment = async () => {
    if (!editingTask || !newComment.trim()) return
    
    try {
      const res = await fetch(`/api/tasks/${editingTask.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      })
      if (res.ok) {
        const comment = await res.json()
        setComments(prev => [...prev, comment])
        setNewComment('')
        showToast('Comment added', 'success')
      } else {
        showToast('Failed to add comment', 'error')
      }
    } catch (e) {
      console.error('Failed to add comment', e)
      showToast('Failed to add comment', 'error')
    }
  }

  // Handle deleting a comment
  const handleDeleteComment = async (commentId: string) => {
    if (!editingTask) return
    
    try {
      const res = await fetch(`/api/tasks/${editingTask.id}/comments/${commentId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId))
        showToast('Comment deleted', 'success')
      }
    } catch (e) {
      console.error('Failed to delete comment', e)
    }
  }

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editingTask) return
    
    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await fetch(`/api/tasks/${editingTask.id}/attachments`, {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        const attachment = await res.json()
        setAttachments(prev => [attachment, ...prev])
        showToast('File uploaded', 'success')
      } else {
        const err = await res.json()
        showToast(err.error || 'Failed to upload file', 'error')
      }
    } catch (e) {
      console.error('Failed to upload file', e)
      showToast('Failed to upload file', 'error')
    } finally {
      setUploadingFile(false)
      // Reset file input
      e.target.value = ''
    }
  }

  // Handle file download
  const handleFileDownload = async (attachment: TaskAttachment) => {
    if (!editingTask) return
    
    try {
      const res = await fetch(`/api/tasks/${editingTask.id}/attachments/${attachment.id}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = attachment.filename
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (e) {
      console.error('Failed to download file', e)
      showToast('Failed to download file', 'error')
    }
  }

  // Handle file delete
  const handleFileDelete = async (attachmentId: string) => {
    if (!editingTask) return
    
    try {
      const res = await fetch(`/api/tasks/${editingTask.id}/attachments/${attachmentId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setAttachments(prev => prev.filter(a => a.id !== attachmentId))
        showToast('File deleted', 'success')
      }
    } catch (e) {
      console.error('Failed to delete file', e)
    }
  }

  // Update task with due date
  const handleUpdateDueDate = async (dueDate: string | null) => {
    if (!editingTask) return
    
    try {
      const res = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate }),
      })
      if (res.ok) {
        const updatedTask = await res.json()
        setEditingTask(updatedTask)
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))
        showToast('Due date updated', 'success')
      }
    } catch (e) {
      console.error('Failed to update due date', e)
    }
  }

  const exportToCSV = () => {
    const headers = ['Title', 'Description', 'Status', 'Priority', 'Tags', 'Created At', 'Updated At']
    const rows = tasks.map(task => {
      const tags = task.tags ? (typeof task.tags === 'string' ? JSON.parse(task.tags) : task.tags) : []
      return [
        `"${(task.title || '').replace(/"/g, '""')}"`,
        `"${(task.description || '').replace(/"/g, '""')}"`,
        task.status,
        task.priority,
        `"${tags.join(', ')}"`,
        task.createdAt,
        task.updatedAt
      ].join(',')
    })
    
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tasks-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Tasks exported to CSV', 'success')
  }

  const clearFilters = () => {
    setSearchQuery('')
    setFilterPriority('')
    setFilterTags('')
  }

  const getTasksByStatus = (status: string) => tasks.filter((t) => t.status === status)

  const hasFilters = searchQuery || filterPriority || filterTags

  const currentLaneTasks = useMemo(() => 
    getTasksByStatus(LANES[selectedLane].id), 
    [tasks, selectedLane]
  )

  return (
    <div>
      {/* Search and Filter Bar */}
      <div className="bg-gray-800 rounded-lg p-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search tasks... (press /)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map(p => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Filter by tag..."
            value={filterTags}
            onChange={(e) => setFilterTags(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm w-full sm:w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center justify-center gap-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm transition-colors"
            >
              <X size={14} />
              Clear
            </button>
          )}
          <button
            onClick={exportToCSV}
            className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm transition-colors"
            title="Export to CSV"
          >
            <Download size={14} />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
        
        {/* Keyboard shortcuts hint */}
        <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-3">
          <span><kbd className="bg-gray-700 px-1 rounded">n</kbd> new task</span>
          <span><kbd className="bg-gray-700 px-1 rounded">/</kbd> search</span>
          <span><kbd className="bg-gray-700 px-1 rounded">←→</kbd> lanes</span>
          <span><kbd className="bg-gray-700 px-1 rounded">↑↓</kbd> navigate</span>
          <span><kbd className="bg-gray-700 px-1 rounded">Enter</kbd> open</span>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-blue-500" size={32} />
          <span className="ml-3 text-gray-400">Loading tasks...</span>
        </div>
      ) : (
        <>
          {/* Lane navigation for mobile */}
          <div className="flex items-center justify-between mb-3 sm:hidden">
            <button
              onClick={() => setSelectedLane(prev => Math.max(0, prev - 1))}
              disabled={selectedLane === 0}
              className="p-2 bg-gray-800 rounded disabled:opacity-50"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-white font-medium">{LANES[selectedLane].label}</span>
            <button
              onClick={() => setSelectedLane(prev => Math.min(LANES.length - 1, prev + 1))}
              disabled={selectedLane === LANES.length - 1}
              className="p-2 bg-gray-800 rounded disabled:opacity-50"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Kanban Board */}
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-2 px-2 sm:mx-0 sm:px-0">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
            >
              {LANES.map((lane, index) => (
                <Lane
                  key={lane.id}
                  lane={lane}
                  tasks={getTasksByStatus(lane.id)}
                  onAddTask={(status) => {
                    setNewTaskStatus(status)
                    setShowAddModal(true)
                  }}
                  onEditTask={(task) => openTaskModal(task)}
                  isActive={index === selectedLane}
                  onDragOver={() => {}}
                />
              ))}
              <DragOverlay>
                {activeTask && (
                  <div className="bg-gray-800 rounded p-3 shadow-xl w-[250px] sm:w-[280px] scale-105">
                    <p className="text-white text-sm">{activeTask.title}</p>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          </div>
        </>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 p-6 rounded-lg w-full max-w-md animate-fade-in">
            <h2 className="text-xl font-bold text-white mb-4">Add Task</h2>
            <input
              type="text"
              placeholder="Task title"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <textarea
              placeholder="Description (optional)"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white mb-3 h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <div className="relative mb-4">
              <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Tags (comma-separated)"
                value={newTask.tags}
                onChange={(e) => setNewTask({ ...newTask, tags: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded pl-9 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddTask}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 p-6 rounded-lg w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-fade-in">
            <h2 className="text-xl font-bold text-white mb-4">Edit Task</h2>
            
            {/* Tabs */}
            <div className="flex border-b border-gray-700 mb-4">
              <button
                onClick={() => setActiveTaskTab('details')}
                className={`px-4 py-2 text-sm transition-colors ${
                  activeTaskTab === 'details' 
                    ? 'text-blue-400 border-b-2 border-blue-400' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTaskTab('comments')}
                className={`px-4 py-2 text-sm transition-colors flex items-center gap-1 ${
                  activeTaskTab === 'comments' 
                    ? 'text-blue-400 border-b-2 border-blue-400' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <MessageSquare size={14} />
                Comments {comments.length > 0 && `(${comments.length})`}
              </button>
              <button
                onClick={() => setActiveTaskTab('attachments')}
                className={`px-4 py-2 text-sm transition-colors flex items-center gap-1 ${
                  activeTaskTab === 'attachments' 
                    ? 'text-blue-400 border-b-2 border-blue-400' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Paperclip size={14} />
                Files {attachments.length > 0 && `(${attachments.length})`}
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto">
              {activeTaskTab === 'details' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Task title"
                  />
                  <textarea
                    value={editingTask.description || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Description (optional)"
                  />
                  <select
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                  
                  {/* Due Date */}
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-500" />
                    <label className="text-gray-400 text-sm">Due Date:</label>
                    <input
                      type="date"
                      value={editingTask.dueDate ? editingTask.dueDate.split('T')[0] : ''}
                      onChange={(e) => handleUpdateDueDate(e.target.value || null)}
                      className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                    />
                    {editingTask.dueDate && (
                      <button
                        onClick={() => handleUpdateDueDate(null)}
                        className="text-gray-400 hover:text-white"
                        title="Clear due date"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="relative">
                    <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Tags (comma-separated)"
                      value={Array.isArray(editingTask.tags) ? editingTask.tags.join(', ') : (typeof editingTask.tags === 'string' ? JSON.parse(editingTask.tags).join(', ') : '')}
                      onChange={(e) => {
                        const tagArray = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                        setEditingTask({ 
                          ...editingTask, 
                          tags: tagArray as unknown as string
                        })
                      }}
                      className="w-full bg-gray-800 border border-gray-700 rounded pl-9 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {activeTaskTab === 'comments' && (
                <div className="space-y-3">
                  {/* Add comment */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                      placeholder="Add a comment..."
                      className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded disabled:opacity-50 transition-colors"
                    >
                      <MessageSquare size={16} />
                    </button>
                  </div>

                  {/* Comments list */}
                  {loadingComments ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="animate-spin text-blue-500" size={24} />
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">No comments yet</p>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-auto">
                      {comments.map((comment) => (
                        <div key={comment.id} className="bg-gray-800 rounded p-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-blue-400 text-sm font-medium">{comment.author}</span>
                              <span className="text-gray-500 text-xs ml-2">
                                {new Date(comment.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-gray-500 hover:text-red-400"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <p className="text-white text-sm mt-1">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTaskTab === 'attachments' && (
                <div className="space-y-3">
                  {/* Upload file */}
                  <div>
                    <input
                      type="file"
                      id="file-upload"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className={`flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded px-3 py-2 text-white text-sm cursor-pointer transition-colors ${
                        uploadingFile ? 'opacity-50' : ''
                      }`}
                    >
                      {uploadingFile ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Paperclip size={16} />
                      )}
                      {uploadingFile ? 'Uploading...' : 'Attach File'}
                    </label>
                  </div>

                  {/* Attachments list */}
                  {loadingAttachments ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="animate-spin text-blue-500" size={24} />
                    </div>
                  ) : attachments.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">No files attached</p>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-auto">
                      {attachments.map((attachment) => (
                        <div key={attachment.id} className="bg-gray-800 rounded p-3 flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm truncate">{attachment.filename}</p>
                            <p className="text-gray-500 text-xs">
                              {(attachment.size / 1024).toFixed(1)} KB • {attachment.uploadedBy} • {new Date(attachment.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <button
                              onClick={() => handleFileDownload(attachment)}
                              className="text-blue-400 hover:text-blue-300 p-1"
                              title="Download"
                            >
                              <Download size={14} />
                            </button>
                            <button
                              onClick={() => handleFileDelete(attachment.id)}
                              className="text-red-400 hover:text-red-300 p-1"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700">
              <button
                onClick={handleEditTask}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleDeleteTask}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setEditingTask(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
