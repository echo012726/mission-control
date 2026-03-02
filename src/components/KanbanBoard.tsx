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
import { Plus, GripVertical, Search, X, Tag, Download, Loader2, ChevronLeft, ChevronRight, Calendar, MessageSquare, Paperclip, Clock, Trash2, Play, Pause, Repeat, Check, ListChecks, GripHorizontal } from 'lucide-react'
import { Task, TaskComment, TaskAttachment, SubTask, Label } from '@/types'
import { useToast } from '@/components/Toast'
import { useSSE } from '@/lib/useSSE'

const LANES: { id: string; label: string; color: string; icon: string }[] = [
  { id: 'inbox', label: 'Inbox', color: 'border-gray-500', icon: '📥' },
  { id: 'planned', label: 'Planned', color: 'border-blue-500', icon: '📋' },
  { id: 'in_progress', label: 'In Progress', color: 'border-yellow-500', icon: '🔄' },
  { id: 'blocked', label: 'Blocked', color: 'border-red-500', icon: '🚫' },
  { id: 'done', label: 'Done', color: 'border-green-500', icon: '✅' },
]

const PRIORITIES = ['low', 'medium', 'high']
const RECURRENCE_OPTIONS = [
  { value: '', label: 'No repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

// Format seconds to human readable time
function formatTime(seconds: number): string {
  if (seconds === 0) return '0m'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

function TaskCardSkeleton() {
  return (
    <div className="bg-gray-800/40 rounded-lg p-3 mb-2 border border-white/5">
      <div className="flex items-start gap-2">
        <div className="mt-1 w-4 h-4 rounded bg-gray-700/50" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-700/50 rounded w-3/4 skeleton" />
          <div className="h-3 bg-gray-700/30 rounded w-1/2 skeleton" />
          <div className="flex gap-2 mt-2">
            <div className="h-5 bg-gray-700/30 rounded w-12 skeleton" />
            <div className="h-5 bg-gray-700/30 rounded w-16 skeleton" />
          </div>
        </div>
      </div>
    </div>
  )
}

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
  const subtasks = task.subtasks || []

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

  // Check if timer is running
  const isTimerRunning = !!task.timerStarted
  const completedSubtasks = subtasks.filter((st: SubTask) => st.completed).length

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gray-800/40 backdrop-blur-sm rounded-lg p-3 mb-2 cursor-pointer hover:bg-gray-700/50 touch-manipulation transition-all duration-200 border border-transparent hover:border-white/5 task-card-glow ${
        isDragging ? 'opacity-50 z-50 scale-105 shadow-2xl ring-2 ring-blue-500/50' : ''
      } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={() => onEdit(task)}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 text-gray-500 hover:text-gray-300 cursor-grab active:cursor-grabbing transition-colors hover:bg-white/5 p-1 rounded"
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
            {/* Timer indicator */}
            {isTimerRunning && (
              <span className="text-xs px-2 py-0.5 rounded bg-green-600/50 text-green-200 flex items-center gap-1 animate-pulse">
                <Play size={10} /> Running
              </span>
            )}
            {/* Time spent */}
            {!isTimerRunning && task.timeSpent > 0 && (
              <span className="text-xs px-2 py-0.5 rounded bg-gray-600/50 text-gray-300 flex items-center gap-1">
                <Clock size={10} /> {formatTime(task.timeSpent)}
              </span>
            )}
            {/* Subtasks progress */}
            {subtasks.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded bg-blue-600/50 text-blue-200 flex items-center gap-1">
                <ListChecks size={10} /> {completedSubtasks}/{subtasks.length}
              </span>
            )}
            {/* Recurrence indicator */}
            {task.recurrence && (
              <span className="text-xs px-2 py-0.5 rounded bg-orange-600/50 text-orange-200 flex items-center gap-1">
                <Repeat size={10} /> {task.recurrence}
              </span>
            )}
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
      <div className={`border-t-2 ${lane.color} px-3 py-2.5 bg-gray-900/80 backdrop-blur-sm rounded-t-lg transition-all ${isActive ? 'bg-gray-800' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{lane.icon}</span>
            <h3 className="font-medium text-white text-sm sm:text-base">{lane.label}</h3>
          </div>
          <span className="text-gray-400 text-sm bg-gray-800/50 px-2 py-0.5 rounded-full">{tasks.length}</span>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={`bg-gray-900/40 backdrop-blur-sm p-2 rounded-b-lg min-h-[150px] sm:min-h-[200px] transition-all border border-t-0 border-white/5 ${isOver ? 'bg-gray-800/60 border-blue-500/30' : ''}`}
        onDragOver={() => onDragOver(lane.id)}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={onEditTask} />
          ))}
        </SortableContext>
        <button
          onClick={() => onAddTask(lane.id)}
          className="w-full flex items-center justify-center gap-1 text-gray-500 hover:text-gray-300 hover:bg-white/5 py-2.5 text-sm rounded-lg transition-all border border-dashed border-white/10 hover:border-white/20"
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
    tags: '',
    dueDate: '',
    recurrence: ''
  })
  
  // Comments and attachments state
  const [comments, setComments] = useState<TaskComment[]>([])
  const [attachments, setAttachments] = useState<TaskAttachment[]>([])
  const [subtasks, setSubtasks] = useState<SubTask[]>([])
  const [newComment, setNewComment] = useState('')
  const [newSubtask, setNewSubtask] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [loadingAttachments, setLoadingAttachments] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [activeTaskTab, setActiveTaskTab] = useState<'details' | 'subtasks' | 'comments' | 'attachments'>('details')
  
  // Labels state
  const [labels, setLabels] = useState<Label[]>([])
  const [showLabelManager, setShowLabelManager] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState('#6366f1')
  
  // Timer state
  const [timerRunning, setTimerRunning] = useState(false)
  
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
          dueDate: newTask.dueDate || null,
          recurrence: newTask.recurrence || null,
        }),
      })
      if (res.ok) {
        showToast('Task created successfully', 'success')
        setNewTask({ title: '', description: '', priority: 'medium', tags: '', dueDate: '', recurrence: '' })
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

      // Fetch subtasks
      const subtasksRes = await fetch(`/api/tasks/${taskId}/subtasks`)
      if (subtasksRes.ok) {
        const data = await subtasksRes.json()
        setSubtasks(data)
      }
    } catch (e) {
      console.error('Failed to fetch task details', e)
    } finally {
      setLoadingComments(false)
      setLoadingAttachments(false)
    }
  }

  // Fetch labels
  const fetchLabels = async () => {
    try {
      const res = await fetch('/api/labels')
      if (res.ok) {
        const data = await res.json()
        setLabels(data)
      }
    } catch (e) {
      console.error('Failed to fetch labels', e)
    }
  }

  useEffect(() => {
    fetchLabels()
  }, [])

  // Open task modal - fetch comments and attachments
  const openTaskModal = async (task: Task) => {
    setEditingTask(task)
    setActiveTaskTab('details')
    setTimerRunning(!!task.timerStarted)
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

  // Handle timer start/stop
  const handleTimerToggle = async () => {
    if (!editingTask) return
    
    try {
      if (timerRunning) {
        // Stop timer
        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stopTimer: true }),
        })
        if (res.ok) {
          const updatedTask = await res.json()
          setEditingTask(updatedTask)
          setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))
          setTimerRunning(false)
          showToast('Timer stopped', 'success')
        }
      } else {
        // Start timer
        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startTimer: true }),
        })
        if (res.ok) {
          const updatedTask = await res.json()
          setEditingTask(updatedTask)
          setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))
          setTimerRunning(true)
          showToast('Timer started', 'success')
        }
      }
    } catch (e) {
      console.error('Failed to toggle timer', e)
      showToast('Failed to toggle timer', 'error')
    }
  }

  // Handle recurrence - create next occurrence
  const handleCreateNextRecurrence = async () => {
    if (!editingTask) return
    
    try {
      const res = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ createNextRecurrence: true }),
      })
      if (res.ok) {
        const newTask = await res.json()
        setTasks(prev => [newTask, ...prev])
        showToast('Next recurrence created', 'success')
        // Close current task modal and open the new one
        setEditingTask(null)
        await fetchTaskDetails(newTask.id)
        setEditingTask(newTask)
      }
    } catch (e) {
      console.error('Failed to create recurrence', e)
      showToast('Failed to create recurrence', 'error')
    }
  }

  // Handle adding a subtask
  const handleAddSubtask = async () => {
    if (!editingTask || !newSubtask.trim()) return
    
    try {
      const res = await fetch(`/api/tasks/${editingTask.id}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newSubtask.trim() }),
      })
      if (res.ok) {
        const subtask = await res.json()
        setSubtasks(prev => [...prev, subtask])
        setNewSubtask('')
        // Update task in list to include the new subtask
        setTasks(prev => prev.map(t => {
          if (t.id === editingTask.id) {
            return { ...t, subtasks: [...(t.subtasks || []), subtask] }
          }
          return t
        }))
        showToast('Subtask added', 'success')
      }
    } catch (e) {
      console.error('Failed to add subtask', e)
      showToast('Failed to add subtask', 'error')
    }
  }

  // Handle subtask toggle
  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    if (!editingTask) return
    
    try {
      const res = await fetch(`/api/tasks/${editingTask.id}/subtasks/${subtaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      })
      if (res.ok) {
        const updatedSubtask = await res.json()
        setSubtasks(prev => prev.map(st => st.id === subtaskId ? updatedSubtask : st))
        // Update task in list
        setTasks(prev => prev.map(t => {
          if (t.id === editingTask.id) {
            return {
              ...t,
              subtasks: t.subtasks?.map(st => st.id === subtaskId ? updatedSubtask : st)
            }
          }
          return t
        }))
      }
    } catch (e) {
      console.error('Failed to toggle subtask', e)
    }
  }

  // Handle subtask delete
  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!editingTask) return
    
    try {
      const res = await fetch(`/api/tasks/${editingTask.id}/subtasks/${subtaskId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setSubtasks(prev => prev.filter(st => st.id !== subtaskId))
        setTasks(prev => prev.map(t => {
          if (t.id === editingTask.id) {
            return { ...t, subtasks: t.subtasks?.filter(st => st.id !== subtaskId) }
          }
          return t
        }))
        showToast('Subtask deleted', 'success')
      }
    } catch (e) {
      console.error('Failed to delete subtask', e)
    }
  }

  // Handle labels update
  const handleUpdateLabels = async (labelIds: string[]) => {
    if (!editingTask) return
    
    try {
      const res = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labels: JSON.stringify(labelIds) }),
      })
      if (res.ok) {
        const updatedTask = await res.json()
        setEditingTask(updatedTask)
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))
      }
    } catch (e) {
      console.error('Failed to update labels', e)
    }
  }

  // Handle add label
  const handleAddLabel = async () => {
    if (!newLabelName.trim()) return
    
    try {
      const res = await fetch('/api/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newLabelName.trim(), color: newLabelColor }),
      })
      if (res.ok) {
        const label = await res.json()
        setLabels(prev => [...prev, label])
        setNewLabelName('')
        showToast('Label created', 'success')
      }
    } catch (e) {
      console.error('Failed to create label', e)
      showToast('Failed to create label', 'error')
    }
  }

  // Handle delete label
  const handleDeleteLabel = async (labelId: string) => {
    try {
      const res = await fetch(`/api/labels/${labelId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setLabels(prev => prev.filter(l => l.id !== labelId))
        showToast('Label deleted', 'success')
      }
    } catch (e) {
      console.error('Failed to delete label', e)
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
      <div className="glass-card rounded-xl p-3 mb-4 border border-white/10">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search tasks... (press /)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900/60 backdrop-blur-sm border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all placeholder:text-gray-600"
            />
         :text-gray-600 </div>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-gray-900/60 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all"
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
            className="bg-gray-900/60 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm w-full sm:w-32 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all placeholder:text-gray-600"
          />
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 text-white px-3 py-2.5 rounded-lg text-sm transition-all"
            >
              <X size={14} />
              Clear
            </button>
          )}
          <button
            onClick={exportToCSV}
            className="flex items-center justify-center gap-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white px-3 py-2.5 rounded-lg text-sm transition-all shadow-lg shadow-green-500/20"
            title="Export to CSV"
          >
            <Download size={14} />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
        
        {/* Keyboard shortcuts hint */}
        <div className="mt-3 text-xs text-gray-500 flex flex-wrap gap-3">
          <span><kbd className="bg-white/10 px-1.5 py-0.5 rounded">n</kbd> new task</span>
          <span><kbd className="bg-white/10 px-1.5 py-0.5 rounded">/</kbd> search</span>
          <span><kbd className="bg-white/10 px-1.5 py-0.5 rounded">←→</kbd> lanes</span>
          <span><kbd className="bg-white/10 px-1.5 py-0.5 rounded">↑↓</kbd> navigate</span>
          <span><kbd className="bg-white/10 px-1.5 py-0.5 rounded">Enter</kbd> open</span>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4">
          {LANES.map((lane) => (
            <div key={lane.id} className="flex-shrink-0 w-[85vw] sm:w-[280px] md:min-w-[250px] md:max-w-[300px]">
              <div className={`border-t-2 ${lane.color} px-3 py-2.5 glass-card rounded-t-lg`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{lane.icon}</span>
                    <div className="skeleton skeleton-text w-20" />
                  </div>
                  <div className="skeleton skeleton-text w-8" />
                </div>
              </div>
              <div className="bg-gray-900/60 backdrop-blur-sm p-2 rounded-b-lg min-h-[150px] sm:min-h-[200px]">
                <div className="space-y-2">
                  <TaskCardSkeleton />
                  <TaskCardSkeleton />
                  <TaskCardSkeleton />
                </div>
              </div>
            </div>
          ))}
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
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={16} className="text-gray-500" />
              <label className="text-gray-400 text-sm">Due Date:</label>
              <input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
              />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <Repeat size={16} className="text-gray-500" />
              <label className="text-gray-400 text-sm">Repeat:</label>
              <select
                value={newTask.recurrence}
                onChange={(e) => setNewTask({ ...newTask, recurrence: e.target.value })}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
              >
                {RECURRENCE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
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
            <div className="flex border-b border-gray-700 mb-4 overflow-x-auto">
              <button
                onClick={() => setActiveTaskTab('details')}
                className={`px-4 py-2 text-sm transition-colors whitespace-nowrap ${
                  activeTaskTab === 'details' 
                    ? 'text-blue-400 border-b-2 border-blue-400' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTaskTab('subtasks')}
                className={`px-4 py-2 text-sm transition-colors flex items-center gap-1 whitespace-nowrap ${
                  activeTaskTab === 'subtasks' 
                    ? 'text-blue-400 border-b-2 border-blue-400' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <ListChecks size={14} />
                Subtasks {subtasks.length > 0 && `(${subtasks.filter(s => s.completed).length}/${subtasks.length})`}
              </button>
              <button
                onClick={() => setActiveTaskTab('comments')}
                className={`px-4 py-2 text-sm transition-colors flex items-center gap-1 whitespace-nowrap ${
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
                className={`px-4 py-2 text-sm transition-colors flex items-center gap-1 whitespace-nowrap ${
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

                  {/* Labels */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Tag size={16} className="text-gray-500" />
                      <label className="text-gray-400 text-sm">Labels:</label>
                      <button
                        onClick={() => setShowLabelManager(!showLabelManager)}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        {showLabelManager ? 'Hide' : 'Manage'}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {labels.map((label) => {
                        const taskLabels = editingTask.labels ? JSON.parse(editingTask.labels) : []
                        const isSelected = taskLabels.includes(label.id)
                        return (
                          <button
                            key={label.id}
                            onClick={() => {
                              const newLabels = isSelected
                                ? taskLabels.filter((l: string) => l !== label.id)
                                : [...taskLabels, label.id]
                              handleUpdateLabels(newLabels)
                            }}
                            className={`text-xs px-2 py-1 rounded transition-colors ${
                              isSelected 
                                ? 'text-white' 
                                : 'bg-gray-800 text-gray-400 hover:text-white'
                            }`}
                            style={isSelected ? { backgroundColor: label.color } : {}}
                          >
                            {label.name}
                          </button>
                        )
                      })}
                      {labels.length === 0 && (
                        <span className="text-gray-500 text-xs">No labels created yet</span>
                      )}
                    </div>
                    {/* Label manager */}
                    {showLabelManager && (
                      <div className="mt-3 p-3 bg-gray-800 rounded border border-gray-700">
                        <p className="text-xs text-gray-400 mb-2">Create new label:</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Label name"
                            value={newLabelName}
                            onChange={(e) => setNewLabelName(e.target.value)}
                            className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="color"
                            value={newLabelColor}
                            onChange={(e) => setNewLabelColor(e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer"
                          />
                          <button
                            onClick={handleAddLabel}
                            disabled={!newLabelName.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-sm disabled:opacity-50"
                          >
                            Add
                          </button>
                        </div>
                        {labels.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-700">
                            <p className="text-xs text-gray-400 mb-1">Existing labels:</p>
                            <div className="flex flex-wrap gap-1">
                              {labels.map((label) => (
                                <span
                                  key={label.id}
                                  className="text-xs px-2 py-0.5 rounded flex items-center gap-1"
                                  style={{ backgroundColor: label.color + '40', color: label.color }}
                                >
                                  {label.name}
                                  <button
                                    onClick={() => handleDeleteLabel(label.id)}
                                    className="hover:text-red-400"
                                  >
                                    <X size={10} />
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Time Tracking */}
                  <div className="bg-gray-800 rounded p-3 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-500" />
                        <span className="text-gray-400 text-sm">Time Tracking:</span>
                      </div>
                      <button
                        onClick={handleTimerToggle}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                          timerRunning 
                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {timerRunning ? <Pause size={12} /> : <Play size={12} />}
                        {timerRunning ? 'Stop' : 'Start'}
                      </button>
                    </div>
                    <div className="text-center">
                      <span className="text-2xl font-mono text-white">
                        {formatTime(editingTask.timeSpent || 0)}
                      </span>
                      {editingTask.timerStarted && (
                        <div className="text-xs text-green-400 mt-1 flex items-center justify-center gap-1">
                          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                          Timer running
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recurrence */}
                  <div className="flex items-center gap-2">
                    <Repeat size={16} className="text-gray-500" />
                    <label className="text-gray-400 text-sm">Repeat:</label>
                    <select
                      value={editingTask.recurrence || ''}
                      onChange={(e) => {
                        setEditingTask({ ...editingTask, recurrence: e.target.value || null })
                      }}
                      onBlur={async () => {
                        try {
                          const res = await fetch(`/api/tasks/${editingTask.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ recurrence: editingTask.recurrence }),
                          })
                          if (res.ok) {
                            const updatedTask = await res.json()
                            setEditingTask(updatedTask)
                            setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))
                          }
                        } catch (e) {
                          console.error('Failed to update recurrence', e)
                        }
                      }}
                      className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                    >
                      {RECURRENCE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {editingTask.recurrence && (
                      <button
                        onClick={handleCreateNextRecurrence}
                        className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-2 py-2 rounded"
                        title="Create next occurrence now"
                      >
                        +Next
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeTaskTab === 'subtasks' && (
                <div className="space-y-3">
                  {/* Add subtask */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                      placeholder="Add a subtask..."
                      className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleAddSubtask}
                      disabled={!newSubtask.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded disabled:opacity-50 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Subtasks list */}
                  {subtasks.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">No subtasks yet. Break down this task!</p>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-auto">
                      {subtasks.map((subtask) => (
                        <div key={subtask.id} className="bg-gray-800 rounded p-3 flex items-center gap-2">
                          <button
                            onClick={() => handleToggleSubtask(subtask.id, subtask.completed)}
                            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                              subtask.completed 
                                ? 'bg-green-600 border-green-600 text-white' 
                                : 'border-gray-600 hover:border-gray-500'
                            }`}
                          >
                            {subtask.completed && <Check size={14} />}
                          </button>
                          <span className={`flex-1 text-sm ${subtask.completed ? 'text-gray-500 line-through' : 'text-white'}`}>
                            {subtask.title}
                          </span>
                          <button
                            onClick={() => handleDeleteSubtask(subtask.id)}
                            className="text-gray-500 hover:text-red-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Progress bar */}
                  {subtasks.length > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{subtasks.filter(s => s.completed).length}/{subtasks.length}</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 transition-all"
                          style={{ width: `${(subtasks.filter(s => s.completed).length / subtasks.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
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
