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
import { Plus, GripVertical, Search, X, Tag, Download, Upload, Loader2, ChevronLeft, ChevronRight, ChevronDown, Calendar, File, FileCode, FileType, MessageSquare, Paperclip, Clock, Trash2, Play, Pause, Repeat, RefreshCcw, Check, ListChecks, GripHorizontal, Bot, LinkIcon, Square, CheckSquare, LayoutGrid, Copy, Bell, BellOff, Mail, MapPin, Navigation, Star, Calendar as CalendarIcon } from 'lucide-react'
import { Task, TaskComment, TaskAttachment, SubTask, Label } from '@/types'
import { useToast } from '@/components/Toast'
import { useSSE } from '@/lib/useSSE'
import { parseNaturalDate, getDateSuggestions, formatNaturalDate } from '@/lib/naturalDate'
import PriorityMatrix from './PriorityMatrix'
import GanttView from './GanttView'
import CalendarView from './CalendarView'
import SavedFilters from './SavedFilters'
import QuickFilters from './QuickFilters'
import RichTextEditor from './RichTextEditor'
import KeyboardShortcutsModal from './KeyboardShortcutsModal'
import AdvancedSearchModal from './AdvancedSearchModal'

// Default lanes that cannot be deleted
const DEFAULT_LANES: { id: string; label: string; color: string; icon: string; deletable: boolean }[] = [
  { id: 'inbox', label: 'Inbox', color: 'border-slate-400', icon: '📥', deletable: false },
  { id: 'planned', label: 'Planned', color: 'border-blue-500', icon: '📋', deletable: false },
  { id: 'in_progress', label: 'In Progress', color: 'border-yellow-500', icon: '🔄', deletable: false },
  { id: 'agent_running', label: 'Agent Running', color: 'border-purple-500', icon: '🤖', deletable: false },
  { id: 'blocked', label: 'Blocked', color: 'border-red-500', icon: '🚫', deletable: false },
  { id: 'done', label: 'Done', color: 'border-green-500', icon: '✅', deletable: false },
]

// Custom lane colors
const LANE_COLORS = [
  { value: 'border-slate-400', label: 'Gray' },
  { value: 'border-blue-500', label: 'Blue' },
  { value: 'border-yellow-500', label: 'Yellow' },
  { value: 'border-green-500', label: 'Green' },
  { value: 'border-red-500', label: 'Red' },
  { value: 'border-purple-500', label: 'Purple' },
  { value: 'border-pink-500', label: 'Pink' },
  { value: 'border-orange-500', label: 'Orange' },
  { value: 'border-cyan-500', label: 'Cyan' },
  { value: 'border-indigo-500', label: 'Indigo' },
]

const LANES: { id: string; label: string; color: string; icon: string }[] = DEFAULT_LANES.map(({ deletable, ...lane }) => lane)

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
    <div className="bg-white dark:bg-slate-800 rounded-lg p-3 mb-2 border border-slate-200 dark:border-slate-700">
      <div className="flex items-start gap-2">
        <div className="mt-1 w-4 h-4 rounded bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-3/4 skeleton" />
          <div className="h-3 bg-slate-100 rounded w-1/2 skeleton" />
          <div className="flex gap-2 mt-2">
            <div className="h-5 bg-slate-100 rounded w-12 skeleton" />
            <div className="h-5 bg-slate-100 rounded w-16 skeleton" />
          </div>
        </div>
      </div>
    </div>
  )
}

function TaskCard({ task, onEdit, onRunAsAgent, isSelected, bulkMode, onSelect, onToggleStar }: { 
  task: Task; 
  onEdit: (task: Task) => void; 
  onRunAsAgent?: (task: Task) => void; 
  isSelected?: boolean;
  bulkMode?: boolean;
  onSelect?: (taskId: string) => void;
  onToggleStar?: (taskId: string, currentStarred: boolean) => void;
}) {
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
    low: 'bg-slate-200 text-slate-600',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-red-100 text-red-700',
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
    
    // Check if there's a time component (not midnight)
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const hasTime = hours !== 0 || minutes !== 0
    const timeStr = hasTime ? ` ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}` : ''
    
    if (date.toDateString() === today.toDateString()) return 'Today' + timeStr
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow' + timeStr
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + timeStr
  }

  // Check if timer is running
  const isTimerRunning = !!task.timerStarted
  const completedSubtasks = subtasks.filter((st: SubTask) => st.completed).length

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-slate-800 rounded-lg p-3 mb-2 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 touch-manipulation transition-all duration-150 border border-slate-200 dark:border-slate-700 hover:shadow-sm ${
        isDragging ? 'opacity-50 z-50 scale-105 shadow-lg ring-2 ring-blue-500/30' : ''
      } ${isSelected ? 'ring-2 ring-blue-500' : ''} ${task.starred ? 'border-l-4 border-l-yellow-400' : ''}`}
      onClick={() => onEdit(task)}
    >
      <div className="flex items-start gap-2">
        {bulkMode && onSelect ? (
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(task.id) }}
            className="mt-1 text-slate-400 hover:text-blue-600 transition-colors"
          >
            {isSelected ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
          </button>
        ) : (
          <button
            {...attributes}
            {...listeners}
            className="mt-1 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing transition-colors hover:bg-slate-100 p-1 rounded"
          >
            <GripVertical size={14} />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-slate-800 text-sm font-medium truncate flex-1">{task.title}</p>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleStar?.(task.id, !!task.starred) }}
              className={`flex-shrink-0 p-1 rounded transition-colors hover:bg-slate-100 ${task.starred ? 'text-yellow-500' : 'text-slate-300 hover:text-yellow-500'}`}
              title={task.starred ? 'Unstar task' : 'Star task'}
            >
              <Star size={14} fill={task.starred ? 'currentColor' : 'none'} />
            </button>
          </div>
          {task.description && (
            <p className="text-slate-500 text-xs mt-1 line-clamp-2">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className={`text-xs px-2 py-0.5 rounded font-medium ${
                task.priority === 'high' ? 'bg-red-100 text-red-700' :
                task.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                'bg-slate-100 text-slate-600'
              }`}
            >
              {task.priority}
            </span>
            {tags.length > 0 && tags.map((tag: string, idx: number) => (
              <span
                key={idx}
                className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-medium"
              >
                {tag}
              </span>
            ))}
            {/* Dependency indicator */}
            {task.dependsOn && (() => {
              const deps = typeof task.dependsOn === 'string' ? JSON.parse(task.dependsOn) : task.dependsOn
              return deps && deps.length > 0 ? (
                <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-700 flex items-center gap-1">
                  <LinkIcon size={10} /> {deps.length} dep{deps.length > 1 ? 's' : ''}
                </span>
              ) : null
            })()}
            {/* Attachment indicator */}
            {task.attachmentCount && task.attachmentCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 flex items-center gap-1" title={`${task.attachmentCount} attachment${task.attachmentCount > 1 ? 's' : ''}`}>
                📎 {task.attachmentCount}
              </span>
            )}
            {/* Custom fields indicator */}
            {task.customFields && (() => {
              try {
                const fields = typeof task.customFields === 'string' ? JSON.parse(task.customFields) : task.customFields
                return fields && fields.length > 0 ? (
                  <span className="text-xs px-2 py-0.5 rounded bg-cyan-100 text-cyan-700 flex items-center gap-1" title={fields.map((f: any) => `${f.key}: ${f.value}`).join(', ')}>
                    ✎ {fields.length} field{fields.length > 1 ? 's' : ''}
                  </span>
                ) : null
              } catch { return null }
            })()}
            {/* Location indicator */}
            {task.locationEnabled && task.locationLat && task.locationLng && (
              <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 flex items-center gap-1" title={`${task.locationTrigger === 'leave' ? 'Leave' : 'Arrive at'}: ${task.locationName || task.locationAddress || 'location'}`}>
                <MapPin size={10} /> {task.locationTrigger === 'leave' ? 'Leave' : 'Arrive'}
              </span>
            )}
            {/* Timer indicator */}
            {isTimerRunning && (
              <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 flex items-center gap-1">
                <Play size={10} /> Running
              </span>
            )}
            {/* Time spent */}
            {!isTimerRunning && task.timeSpent > 0 && (
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 flex items-center gap-1">
                <Clock size={10} /> {formatTime(task.timeSpent)}
              </span>
            )}
            {/* Subtasks progress */}
            {subtasks.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 flex items-center gap-1">
                <ListChecks size={10} /> {completedSubtasks}/{subtasks.length}
              </span>
            )}
            {/* Recurrence indicator */}
            {task.recurrence && (
              <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-700 flex items-center gap-1">
                <Repeat size={10} /> {task.recurrence}
              </span>
            )}
            {/* Agent Running indicator */}
            {task.status === 'agent_running' && (
              <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 flex items-center gap-1">
                <Bot size={10} /> Agent Running
              </span>
            )}
            {/* Run as Agent button - only show for non-agent_running tasks */}
            {task.status !== 'agent_running' && onRunAsAgent && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRunAsAgent(task)
                }}
                className="text-xs px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1 transition-colors"
                title="Run this task as an agent"
              >
                <Bot size={10} /> Run as Agent
              </button>
            )}
          </div>
          {task.dueDate && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
              <Clock size={12} />
              <span>{formatDueDate(task.dueDate)}</span>
            </div>
          )}
          {/* Reminder indicator */}
          {task.reminder && (
            <div className={`flex items-center gap-1 mt-1 text-xs ${new Date(task.reminder) < new Date() ? 'text-red-500 font-medium' : 'text-blue-500'}`}>
              <Bell size={12} />
              <span>Remind: {formatDueDate(task.reminder)}</span>
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
  onRunAsAgent,
  isActive,
  onDragOver,
  selectedTasks,
  bulkMode,
  toggleTaskSelection,
  onToggleStar,
}: {
  lane: typeof LANES[0]
  tasks: Task[]
  onAddTask: (status: string) => void
  onEditTask: (task: Task) => void
  onRunAsAgent?: (task: Task) => void
  isActive: boolean
  onDragOver: (laneId: string) => void
  selectedTasks: Set<string>
  bulkMode: boolean
  toggleTaskSelection: (taskId: string) => void
  onToggleStar?: (taskId: string, currentStarred: boolean) => void
}) {
  const [quickAddTitle, setQuickAddTitle] = useState('')
  const [quickAddLoading, setQuickAddLoading] = useState(false)
  const quickAddInputRef = useRef<HTMLInputElement>(null)

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickAddTitle.trim() || quickAddLoading) return

    setQuickAddLoading(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quickAddTitle.trim(),
          status: lane.id,
          priority: 'medium'
        })
      })
      if (res.ok) {
        const newTask = await res.json()
        onAddTask(lane.id) // Refresh the task list
        setQuickAddTitle('')
        quickAddInputRef.current?.focus()
      }
    } catch (err) {
      console.error('Quick add failed:', err)
    } finally {
      setQuickAddLoading(false)
    }
  }

  const { setNodeRef, isOver } = useSortable({ id: lane.id })

  return (
    <div className="flex-shrink-0 w-[85vw] sm:w-[280px] md:min-w-[250px] md:max-w-[300px]">
      <div className={`border-t-4 ${lane.color} px-3 py-3 bg-white dark:bg-slate-800 rounded-t-lg transition-all ${isActive ? 'bg-slate-50 dark:bg-slate-700' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{lane.icon}</span>
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm sm:text-base">{lane.label}</h3>
          </div>
          <span className="text-slate-500 dark:text-slate-400 text-sm bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full font-medium">{tasks.length}</span>
        </div>
      </div>
      {/* Quick Add Input */}
      <form onSubmit={handleQuickAdd} className="px-2 pt-2">
        <input
          ref={quickAddInputRef}
          type="text"
          placeholder={`Add to ${lane.label}...`}
          value={quickAddTitle}
          onChange={(e) => setQuickAddTitle(e.target.value)}
          disabled={quickAddLoading}
          className="w-full text-xs sm:text-sm px-2 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all"
        />
      </form>
      <div
        ref={setNodeRef}
        className={`bg-slate-50 dark:bg-slate-800/50 p-2 rounded-b-lg min-h-[150px] sm:min-h-[200px] transition-all border border-t-0 border-slate-200 dark:border-slate-700 ${isOver ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-500' : ''}`}
        onDragOver={() => onDragOver(lane.id)}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onEdit={onEditTask} 
              onRunAsAgent={onRunAsAgent}
              isSelected={selectedTasks.has(task.id)}
              bulkMode={bulkMode}
              onSelect={bulkMode ? toggleTaskSelection : undefined}
              onToggleStar={onToggleStar}
            />
          ))}
        </SortableContext>
        <button
          onClick={() => onAddTask(lane.id)}
          className="w-full flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 py-2.5 text-sm rounded-lg transition-all border border-dashed border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500"
        >
          <Plus size={14} /> Add task
        </button>
      </div>
    </div>
  )
}

export default function KanbanBoard({ portfolioId = null, portfolios = [] }: { portfolioId?: string | null, portfolios?: any[] }) {
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
    dueTime: '',
    reminder: '',
    recurrence: '',
    estimatedTime: 0,
    portfolioId: portfolioId || '',
    locationName: '',
    locationAddress: '',
    locationLat: null as number | null,
    locationLng: null as number | null,
    locationRadius: 500,
    locationTrigger: 'arrive',
    locationEnabled: false,
  })
  
  // Natural language date input
  const [naturalDateInput, setNaturalDateInput] = useState('')
  const [showDateSuggestions, setShowDateSuggestions] = useState(false)
  
  // Comments and attachments state
  const [comments, setComments] = useState<TaskComment[]>([])
  const [attachments, setAttachments] = useState<TaskAttachment[]>([])
  const [subtasks, setSubtasks] = useState<SubTask[]>([])
  const [newComment, setNewComment] = useState('')
  const [newSubtask, setNewSubtask] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [loadingAttachments, setLoadingAttachments] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [locationSearchResults, setLocationSearchResults] = useState<any[]>([])
  const [activeTaskTab, setActiveTaskTab] = useState<'details' | 'subtasks' | 'comments' | 'attachments'>('details')
  
  // Labels state
  const [labels, setLabels] = useState<Label[]>([])
  const [showLabelManager, setShowLabelManager] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState('#6366f1')
  
  // Timer state
  const [timerRunning, setTimerRunning] = useState(false)
  
  // Custom fields state
  interface CustomField {
    key: string
    value: string
    type: 'text' | 'number' | 'date' | 'select'
  }
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [newCustomField, setNewCustomField] = useState<CustomField>({ key: '', value: '', type: 'text' })
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterTags, setFilterTags] = useState('')
  const [filterDueToday, setFilterDueToday] = useState(false)
  const [quickFilter, setQuickFilter] = useState<string | null>(null)
  
  // Bulk operations state
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [showBatchEdit, setShowBatchEdit] = useState(false)
  
  // View mode: 'kanban', 'matrix', 'gantt', or 'calendar'
  const [viewMode, setViewMode] = useState<'kanban' | 'matrix' | 'gantt' | 'calendar'>('kanban')
  
  // Quick add state for calendar view
  const [quickAddDate, setQuickAddDate] = useState<Date | null>(null)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  
  // Keyboard shortcuts modal
  const [showShortcutsModal, setShowShortcutsModal] = useState(false)
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  
  // Custom lanes/columns state
  const [customLanes, setCustomLanes] = useState<{ id: string; label: string; color: string; icon: string }[]>([])
  const [showColumnManager, setShowColumnManager] = useState(false)
  const [editingLane, setEditingLane] = useState<{ id: string; label: string; color: string; icon: string } | null>(null)
  const [newLaneName, setNewLaneName] = useState('')
  const [newLaneColor, setNewLaneColor] = useState('border-slate-400')
  const [newLaneIcon, setNewLaneIcon] = useState('📋')
  
  // Load custom lanes from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('customLanes')
    if (saved) {
      try {
        setCustomLanes(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse custom lanes', e)
      }
    }
  }, [])
  
  // Save custom lanes to localStorage when changed
  useEffect(() => {
    localStorage.setItem('customLanes', JSON.stringify(customLanes))
  }, [customLanes])
  
  // Get all lanes (default + custom)
  const allLanes = useMemo(() => [...LANES, ...customLanes], [customLanes])
  
  // Add new custom lane
  const addCustomLane = () => {
    if (!newLaneName.trim()) return
    const newLane = {
      id: `custom_${Date.now()}`,
      label: newLaneName.trim(),
      color: newLaneColor,
      icon: newLaneIcon,
    }
    setCustomLanes([...customLanes, newLane])
    setNewLaneName('')
    setNewLaneColor('border-slate-400')
    setNewLaneIcon('📋')
  }
  
  // Update existing custom lane
  const updateCustomLane = () => {
    if (!editingLane || !editingLane.label.trim()) return
    setCustomLanes(customLanes.map(l => l.id === editingLane.id ? editingLane : l))
    setEditingLane(null)
  }
  
  // Delete custom lane
  const deleteCustomLane = (laneId: string) => {
    setCustomLanes(customLanes.filter(l => l.id !== laneId))
  }
  
  // Trash/Undo state
  const [showTrash, setShowTrash] = useState(false)
  const [trashedItems, setTrashedItems] = useState<any[]>([])
  const [restoring, setRestoring] = useState(false)
  const [exportingCsv, setExportingCsv] = useState(false)
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [exportingIcs, setExportingIcs] = useState(false)
  const [importingCsv, setImportingCsv] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Undo delete state
  const [lastDeletedLogId, setLastDeletedLogId] = useState<string | null>(null)
  const [lastDeletedTitle, setLastDeletedTitle] = useState<string | null>(null)
  
  // Toggle task selection in bulk mode
  const toggleTaskSelection = (taskId: string) => {
    const newSelection = new Set(selectedTasks)
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId)
    } else {
      newSelection.add(taskId)
    }
    setSelectedTasks(newSelection)
  }
  
  // Clear all selections
  const clearSelection = () => {
    setSelectedTasks(new Set())
  }
  
  // Exit bulk mode
  const exitBulkMode = () => {
    setBulkMode(false)
    setSelectedTasks(new Set())
  }
  
  // Handle bulk action
  const handleBulkAction = async (action: string, value?: string | string[]) => {
    if (selectedTasks.size === 0) return
    setBulkActionLoading(true)
    try {
      const res = await fetch('/api/...?token=marcus2026&&tasks/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskIds: Array.from(selectedTasks),
          action,
          value,
        }),
      })
      if (res.ok) {
        showToast(`Action completed on ${selectedTasks.size} tasks`, 'success')
        clearSelection()
        fetchTasks()
      } else {
        showToast('Bulk action failed', 'error')
      }
    } catch (err) {
      console.error('Bulk action error:', err)
      showToast('Bulk action failed', 'error')
    }
    setBulkActionLoading(false)
  }
  
  // Handle task move in Priority Matrix view
  const handleMatrixTaskMove = async (taskId: string, fromQuadrant: string, toQuadrant: string) => {
    try {
      // Map quadrants to priority values
      const quadrantToPriority: Record<string, string> = {
        q1_do: 'high',
        q2_schedule: 'medium',
        q3_delegate: 'low',
        q4_eliminate: 'low',
      }
      
      const newPriority = quadrantToPriority[toQuadrant]
      
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority }),
      })
      
      if (res.ok) {
        showToast(`Task moved to ${toQuadrant.replace('q1_', '').replace('q2_', '').replace('q3_', '').replace('q4_', '')}`, 'success')
        fetchTasks()
      } else {
        showToast('Failed to move task', 'error')
      }
    } catch (err) {
      console.error('Matrix move error:', err)
      showToast('Failed to move task', 'error')
    }
  }
  
  // Fetch trashed tasks
  const fetchTrash = async () => {
    try {
      const res = await fetch('/api/trash')
      if (res.ok) {
        const data = await res.json()
        setTrashedItems(data.tasks || data)
      }
    } catch (e) {
      console.error('Failed to fetch trash', e)
    }
  }
  
  // Restore a trashed task
  const restoreTask = async (logId: string) => {
    setRestoring(true)
    try {
      const res = await fetch('/api/trash/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: logId, action: 'restore' }),
      })
      if (res.ok) {
        showToast('Task restored!', 'success')
        fetchTrash()
        fetchTasks()
      } else {
        showToast('Failed to restore task', 'error')
      }
    } catch (e) {
      console.error('Restore error', e)
      showToast('Failed to restore task', 'error')
    }
    setRestoring(false)
  }
  
  // Permanently delete a trashed task
  const deletePermanently = async (taskId: string) => {
    if (!confirm('Permanently delete this task? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/trash?taskId=${taskId}`, { method: 'DELETE' })
      if (res.ok) {
        showToast('Task permanently deleted', 'success')
        fetchTrash()
      } else {
        showToast('Failed to delete', 'error')
      }
    } catch (e) {
      console.error('Delete error', e)
    }
  }
  
  // Empty all trash
  const emptyTrash = async () => {
    if (!confirm('Permanently delete ALL items in trash? This cannot be undone.')) return
    try {
      const res = await fetch('/api/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'empty' })
      })
      if (res.ok) {
        const data = await res.json()
        showToast(`Deleted ${data.deleted} items`, 'success')
        fetchTrash()
      } else {
        showToast('Failed to empty trash', 'error')
      }
    } catch (e) {
      console.error('Empty trash error', e)
    }
  }
  
  // Restore all tasks
  const restoreAllTasks = async () => {
    try {
      const res = await fetch('/api/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restoreAll' })
      })
      if (res.ok) {
        const data = await res.json()
        showToast(`Restored ${data.restored} tasks`, 'success')
        fetchTrash()
        fetchTasks()
      } else {
        showToast('Failed to restore all', 'error')
      }
    } catch (e) {
      console.error('Restore all error', e)
    }
  }
  
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
      const res = await fetch(url, { credentials: 'include' })
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
    const handleKeyDown = async (e: KeyboardEvent) => {
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

      // Ctrl+D or Cmd+D: Duplicate selected task
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault()
        const dupTasks = getTasksByStatus(allLanes[selectedLane].id)
        const taskToDup = dupTasks[selectedTaskIndex]
        if (taskToDup) {
          try {
            const res = await fetch(`/api/tasks/${taskToDup.id}/duplicate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ duplicateSubtasks: true }),
            })
            if (res.ok) {
              const duplicatedTask = await res.json()
              showToast('Task duplicated (Ctrl+D)', 'success')
              fetchTasks()
              setTimeout(() => setEditingTask(duplicatedTask), 300)
            } else {
              showToast('Failed to duplicate task', 'error')
            }
          } catch (err) {
            showToast('Failed to duplicate task', 'error')
          }
        }
        return
      }

      switch (e.key) {
        case 'n':
          // New task - open add modal for current lane
          setNewTaskStatus(allLanes[selectedLane].id)
          setShowAddModal(true)
          break
        case 'd':
          // Delete selected task
          {
            const deleteTasks = getTasksByStatus(allLanes[selectedLane].id)
            const taskToDelete = deleteTasks[selectedTaskIndex]
            if (taskToDelete && confirm('Delete this task?')) {
              try {
                const res = await fetch(`/api/tasks/${taskToDelete.id}`, { method: 'DELETE', credentials: 'include' })
                if (res.ok) {
                  // Fetch trash for undo
                  const trashRes = await fetch('/api/tasks/trash?limit=1')
                  const trashData = await trashRes.json()
                  const latestTrash = trashData[0]
                  const taskTitle = taskToDelete.title
                  
                  if (latestTrash && latestTrash.taskId === taskToDelete.id) {
                    setLastDeletedLogId(latestTrash.logId)
                    setLastDeletedTitle(taskTitle)
                    
                    showToast(`Task "${taskTitle}" deleted`, 'success', 10000, {
                      label: 'Undo',
                      onClick: () => handleUndoDelete(latestTrash.logId)
                    })
                  } else {
                    showToast('Task deleted', 'success')
                  }
                  fetchTasks()
                } else {
                  showToast('Failed to delete task', 'error')
                }
              } catch (e) {
                showToast('Failed to delete task', 'error')
              }
            }
          }
          break
        case 'e':
          // Quick edit - move selected task to in_progress
          {
            const editTasks = getTasksByStatus(allLanes[selectedLane].id)
            const taskToEdit = editTasks[selectedTaskIndex]
            if (taskToEdit) {
              try {
                const res = await fetch(`/api/tasks/${taskToEdit.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: 'in_progress' }),
                  credentials: 'include',
                })
                if (res.ok) {
                  showToast('Task moved to In Progress', 'success')
                  fetchTasks()
                }
              } catch (e) {
                showToast('Failed to update task', 'error')
              }
            }
          }
          break
        case '/':
          // Open advanced search modal
          e.preventDefault()
          setShowAdvancedSearch(true)
          break
        case '?':
          // Open keyboard shortcuts help
          e.preventDefault()
          setShowShortcutsModal(true)
          break
        case 'f':
          // Toggle focus mode
          e.preventDefault()
          setFocusMode(prev => !prev)
          break
        case 'Escape':
          // Exit focus mode if active
          if (focusMode) {
            e.preventDefault()
            setFocusMode(false)
          }
          break
        // Number keys 1-5 to jump to lanes
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
          // Jump to lane by number (1-6 for different lanes)
          e.preventDefault()
          const laneIndex = parseInt(e.key) - 1
          if (laneIndex < allLanes.length) {
            setSelectedLane(laneIndex)
            setSelectedTaskIndex(0)
          }
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
          setSelectedLane((prev) => Math.min(allLanes.length - 1, prev + 1))
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
          const currentLaneTasks = getTasksByStatus(allLanes[selectedLane].id)
          setSelectedTaskIndex((prev) => Math.min(currentLaneTasks.length - 1, prev + 1))
          break
        case 'Enter':
          // Open selected task
          const laneTasks = getTasksByStatus(allLanes[selectedLane].id)
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

  // Load custom fields when editingTask changes
  useEffect(() => {
    if (editingTask) {
      try {
        const fields = editingTask.customFields ? JSON.parse(editingTask.customFields) : []
        setCustomFields(fields)
      } catch (e) {
        console.error('Failed to parse custom fields', e)
        setCustomFields([])
      }
    } else {
      setCustomFields([])
    }
  }, [editingTask])

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    if (!over) return
    
    const overLane = allLanes.find((l) => l.id === over.id)
    if (overLane) {
      setSelectedLane(allLanes.findIndex((l) => l.id === overLane.id))
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
    const lane = allLanes.find((l) => l.id === over.id)
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

  // Check if all dependencies are completed before allowing move to done
  const canMoveToDone = (task: Task): boolean => {
    const deps = typeof task.dependsOn === 'string' ? JSON.parse(task.dependsOn) : task.dependsOn || []
    if (!deps || deps.length === 0) return true
    
    for (const depId of deps) {
      const depTask = tasks.find(t => t.id === depId)
      if (!depTask || depTask.status !== 'done') {
        return false
      }
    }
    return true
  }

  // Detect circular dependencies when adding/modifying dependencies
  const hasCircularDependency = (taskId: string, newDeps: string[]): boolean => {
    const visited = new Set<string>()
    const stack = [...newDeps]
    
    while (stack.length > 0) {
      const current = stack.pop()!
      if (current === taskId) return true
      if (visited.has(current)) continue
      visited.add(current)
      
      const task = tasks.find(t => t.id === current)
      if (task) {
        const taskDeps = typeof task.dependsOn === 'string' ? JSON.parse(task.dependsOn) : task.dependsOn || []
        stack.push(...taskDeps)
      }
    }
    return false
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    const task = tasks.find(t => t.id === taskId)
    
    // Check dependencies when moving to done
    if (newStatus === 'done' && task && !canMoveToDone(task)) {
      showToast('Cannot complete: complete dependent tasks first', 'error')
      return
    }
    
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include',
      })
      if (res.ok) {
        showToast(`Task moved to ${allLanes.find(l => l.id === newStatus)?.label}`, 'success')
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
      const res = await fetch('/api/...?token=marcus2026&&tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          status: newTaskStatus,
          tags: JSON.stringify(tagsArray),
          portfolioId: newTask.portfolioId || null,
          dueDate: newTask.dueDate ? (newTask.dueTime ? `${newTask.dueDate}T${newTask.dueTime}:00` : `${newTask.dueDate}T00:00:00`) : null,
          reminder: newTask.reminder ? new Date(newTask.reminder).toISOString() : null,
          recurrence: newTask.recurrence || null,
          estimatedTime: newTask.estimatedTime || null,
          locationName: newTask.locationName || null,
          locationAddress: newTask.locationAddress || null,
          locationLat: newTask.locationLat,
          locationLng: newTask.locationLng,
          locationRadius: newTask.locationRadius,
          locationTrigger: newTask.locationTrigger,
          locationEnabled: newTask.locationEnabled,
        }),
        credentials: 'include',
      })
      if (res.ok) {
        showToast('Task created successfully', 'success')
        setNewTask({ title: '', description: '', priority: 'medium', tags: '', dueDate: '', dueTime: '', reminder: '', recurrence: '', estimatedTime: 0, portfolioId: portfolioId || '', locationName: '', locationAddress: '', locationLat: null, locationLng: null, locationRadius: 500, locationTrigger: 'arrive', locationEnabled: false })
        setNaturalDateInput('')
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

    // Check for circular dependencies
    const currentDeps = typeof editingTask.dependsOn === 'string' 
      ? JSON.parse(editingTask.dependsOn) 
      : editingTask.dependsOn || []
    
    if (hasCircularDependency(editingTask.id, currentDeps)) {
      showToast('Cannot create circular dependency', 'error')
      return
    }

    try {
      const res = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingTask.title,
          description: editingTask.description,
          priority: editingTask.priority,
          portfolioId: editingTask.portfolioId || null,
          tags: JSON.stringify(tagsArray),
          dueDate: editingTask.dueDate,
          reminder: editingTask.reminder,
          reminderSent: editingTask.reminderSent,
          dependsOn: editingTask.dependsOn,
          customFields: customFields,
          estimatedTime: editingTask.estimatedTime,
          starred: editingTask.starred,
          // Location-based reminder fields
          locationName: editingTask.locationName,
          locationAddress: editingTask.locationAddress,
          locationLat: editingTask.locationLat,
          locationLng: editingTask.locationLng,
          locationRadius: editingTask.locationRadius,
          locationTrigger: editingTask.locationTrigger,
          locationEnabled: editingTask.locationEnabled,
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

    // Store task info for undo before deleting
    const taskTitle = editingTask.title
    const taskId = editingTask.id

    try {
      const res = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        // Fetch the trash to get the logId for undo
        const trashRes = await fetch('/api/tasks/trash?limit=1')
        const trashData = await trashRes.json()
        const latestTrash = trashData[0]
        
        if (latestTrash && latestTrash.taskId === taskId) {
          setLastDeletedLogId(latestTrash.logId)
          setLastDeletedTitle(taskTitle)
          
          showToast(`Task "${taskTitle}" deleted`, 'success', 10000, {
            label: 'Undo',
            onClick: () => handleUndoDelete(latestTrash.logId)
          })
        } else {
          showToast(`Task "${taskTitle}" deleted`, 'success')
        }
        
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

  const handleUndoDelete = async (logId: string) => {
    if (!logId) return
    
    try {
      const res = await fetch('/api/tasks/trash/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: logId, action: 'restore' }),
      })
      
      if (res.ok) {
        const restored = await res.json()
        showToast(`Task "${restored.title}" restored`, 'success')
        setLastDeletedLogId(null)
        setLastDeletedTitle(null)
        fetchTasks()
      } else {
        showToast('Failed to restore task', 'error')
      }
    } catch (e) {
      console.error('Failed to undo delete', e)
      showToast('Failed to restore task', 'error')
    }
  }

  const handleDuplicateTask = async () => {
    if (!editingTask) return

    try {
      const res = await fetch(`/api/tasks/${editingTask.id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duplicateSubtasks: true }),
      })
      if (res.ok) {
        const duplicatedTask = await res.json()
        showToast('Task duplicated', 'success')
        setEditingTask(null)
        fetchTasks()
        // Optionally open the new task
        setTimeout(() => {
          setEditingTask(duplicatedTask)
        }, 300)
      } else {
        showToast('Failed to duplicate task', 'error')
      }
    } catch (e) {
      console.error('Failed to duplicate task', e)
      showToast('Failed to duplicate task', 'error')
    }
  }

  // Toggle starred status for a task
  const handleToggleStar = async (taskId: string, currentStarred: boolean) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: !currentStarred }),
      })
      if (res.ok) {
        // Update local state
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, starred: !currentStarred } : t
        ))
        showToast(!currentStarred ? 'Task starred' : 'Task unstarred', 'success')
      } else {
        showToast('Failed to update starred status', 'error')
      }
    } catch (e) {
      console.error('Failed to toggle star', e)
      showToast('Failed to update starred status', 'error')
    }
  }

  const handleArchiveTask = async () => {
    if (!editingTask) return

    try {
      const res = await fetch(`/api/tasks/archive?token=mc_dev_token_2024`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: editingTask.id, action: 'archive' }),
      })
      if (res.ok) {
        showToast('Task archived', 'success')
        setEditingTask(null)
        fetchTasks()
      } else {
        showToast('Failed to archive task', 'error')
      }
    } catch (e) {
      console.error('Failed to archive task', e)
      showToast('Failed to archive task', 'error')
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
      const res = await fetch('/api/labels', { credentials: 'include' })
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
      const res = await fetch(`/api/tasks/${editingTask.id}/attachments/${attachment.id}?download=true`)
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = attachment.filename
        a.click()
        URL.revokeObjectURL(url)
      } else {
        showToast('Failed to download file', 'error')
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

  // Handle Run as Agent - spawn a subagent to work on this task
  const handleRunAsAgent = async (task: Task) => {
    try {
      // First, update task status to agent_running
      const updateRes = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'agent_running' }),
      })

      if (!updateRes.ok) {
        showToast('Failed to update task status', 'error')
        return
      }

      // Then spawn a subagent via OpenClaw
      const agentTask = `Complete task: ${task.title}. ${task.description || 'No description provided.'}`
      
      const spawnRes = await fetch('/api/...?token=marcus2026&&openclaw/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          task: agentTask,
          runtime: 'subagent',
          agentType: 'coder'
        }),
        credentials: 'include',
      })

      if (spawnRes.ok) {
        const result = await spawnRes.json()
        showToast(`Agent spawned: ${result.message}`, 'success')
        // Refresh tasks to show the updated status
        fetchTasks()
      } else {
        showToast('Failed to spawn agent', 'error')
        // Revert task status if agent spawn failed
        await fetch(`/api/tasks/${task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'inbox' }),
        })
      }
    } catch (e) {
      console.error('Failed to run as agent', e)
      showToast('Failed to run as agent', 'error')
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
        credentials: 'include',
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

    const exportTasks = async (format?: 'csv' | 'json' | 'pdf') => {
    const fmt = format || exportFormat
    if (exportingCsv) return

    setExportingCsv(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('q', searchQuery)
      if (filterPriority) params.set('priority', filterPriority)
      if (filterTags) params.set('tags', filterTags)
      params.set('format', fmt)

      const url = params.toString() ? `/api/tasks/export?${params.toString()}` : '/api/tasks/export'
      const res = await fetch(url, { credentials: 'include' })

      if (!res.ok) {
        showToast('Failed to export tasks', 'error')
        return
      }

      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const disposition = res.headers.get('content-disposition') || ''
      const filenameMatch = disposition.match(/filename="?([^\"]+)"?/i)
      const ext = fmt === 'json' ? 'json' : fmt === 'pdf' ? 'pdf' : 'csv'
      const filename = filenameMatch?.[1] || `tasks-export-${new Date().toISOString().split('T')[0]}.${ext}`

      const a = document.createElement('a')
      a.href = objectUrl
      a.download = filename
      a.click()
      URL.revokeObjectURL(objectUrl)

      showToast(`Tasks exported to ${fmt.toUpperCase()}`, 'success')
    } catch (e) {
      console.error('Export failed', e)
      showToast('Failed to export tasks', 'error')
    } finally {
      setExportingCsv(false)
      setShowExportMenu(false)
    }
  }

  // Keep legacy function for compatibility
  const exportToCSV = async () => {
    if (exportingCsv) return

    setExportingCsv(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('q', searchQuery)
      if (filterPriority) params.set('priority', filterPriority)
      if (filterTags) params.set('tags', filterTags)

      const url = params.toString() ? `/api/tasks/export?${params.toString()}` : '/api/tasks/export'
      const res = await fetch(url, { credentials: 'include' })

      if (!res.ok) {
        showToast('Failed to export tasks', 'error')
        return
      }

      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const disposition = res.headers.get('content-disposition') || ''
      const filenameMatch = disposition.match(/filename="?([^\"]+)"?/i)
      const filename = filenameMatch?.[1] || `tasks-export-${new Date().toISOString().split('T')[0]}.csv`

      const a = document.createElement('a')
      a.href = objectUrl
      a.download = filename
      a.click()
      URL.revokeObjectURL(objectUrl)

      showToast('Tasks exported to CSV', 'success')
    } catch (e) {
      console.error('CSV export failed', e)
      showToast('Failed to export tasks', 'error')
    } finally {
      setExportingCsv(false)
    }
  }

  const exportToICS = async () => {
    if (exportingIcs) return
    setExportingIcs(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (filterPriority) params.set('priority', filterPriority)
      if (filterTags) params.set('tags', filterTags)
      
      const url = params.toString() ? `/api/tasks/calendar?${params.toString()}` : '/api/tasks/calendar'
      const res = await fetch(url, { credentials: 'include' })
      
      if (!res.ok) {
        showToast('Failed to export calendar', 'error')
        return
      }
      
      const blob = await res.blob()
      const filename = `mission-control-tasks-${new Date().toISOString().split('T')[0]}.ics`
      
      // Download the file
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      showToast('Tasks exported to Calendar (.ics)', 'success')
    } catch (e) {
      console.error('ICS export failed', e)
      showToast('Failed to export calendar', 'error')
    } finally {
      setExportingIcs(false)
    }
  }

  const importFromCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportingCsv(true)
    try {
      const text = await file.text()
      const res = await fetch('/api/...?token=marcus2026&&tasks/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: text }),
        credentials: 'include'
      })

      if (!res.ok) {
        const err = await res.json()
        showToast(err.error || 'Failed to import tasks', 'error')
        return
      }

      const result = await res.json()
      showToast(result.message || `Imported ${result.imported} tasks`, 'success')
      
      // Refresh tasks
      fetchTasks()
    } catch (err) {
      console.error('CSV import failed', err)
      showToast('Failed to import tasks', 'error')
    } finally {
      setImportingCsv(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const triggerImport = () => {
    fileInputRef.current?.click()
  }

  const clearFilters = () => {
    setSearchQuery('')
    setFilterPriority('')
    setFilterTags('')
    setFilterDueToday(false)
    setQuickFilter(null)
  }

  const getTasksByStatus = (status: string) => {
    let filtered = tasks.filter((t) => t.status === status)
    
    // Filter by portfolio
    if (portfolioId) {
      filtered = filtered.filter(t => t.portfolioId === portfolioId)
    }
    
    // Filter by due today
    if (filterDueToday) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      filtered = filtered.filter((t) => {
        if (!t.dueDate) return false
        const dueDate = new Date(t.dueDate)
        dueDate.setHours(0, 0, 0, 0)
        return dueDate.getTime() === today.getTime()
      })
    }
    
    // Apply quick filter
    if (quickFilter) {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const weekEnd = new Date(today)
      weekEnd.setDate(weekEnd.getDate() + 7)
      const dayAgo = new Date(now)
      dayAgo.setDate(dayAgo.getDate() - 1)

      filtered = filtered.filter((t) => {
        switch (quickFilter) {
          case "dueToday":
            if (!t.dueDate) return false
            const due = new Date(t.dueDate)
            return due >= today && due < tomorrow
          case "overdue":
            if (!t.dueDate) return false
            return new Date(t.dueDate) < now
          case "dueThisWeek":
            if (!t.dueDate) return false
            const dw = new Date(t.dueDate)
            return dw >= today && dw < weekEnd
          case "highPriority":
            return t.priority === "high"
          case "starred":
            return t.starred === true
          case "hasDependencies":
            return t.dependsOn && t.dependsOn !== "[]" && JSON.parse(t.dependsOn).length > 0
          case "inProgress":
            return t.status === "in_progress"
          case "noDueDate":
            return !t.dueDate
          case "recent":
            const created = new Date(t.createdAt)
            return created >= dayAgo
          case "assignedToAgent":
            return !!t.agentId
          default:
            return true
        }
      })
    }
    
    return filtered
  }

  const hasFilters = searchQuery || filterPriority || filterTags || filterDueToday || quickFilter

  const currentLaneTasks = useMemo(() => 
    getTasksByStatus(allLanes[selectedLane].id), 
    [tasks, selectedLane]
  )

  return (
    <div>
      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl p-3 mb-4 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search tasks... (press /)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all placeholder:text-slate-400"
            />
          </div>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
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
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-700 text-sm w-full sm:w-32 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all placeholder:text-slate-400"
          />
          <button
            onClick={() => setFilterDueToday(!filterDueToday)}
            className={`flex items-center justify-center gap-1 px-3 py-2.5 rounded-lg text-sm transition-all ${
              filterDueToday 
                ? 'bg-orange-500 text-white hover:bg-orange-600' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
            title="Show only tasks due today"
          >
            <Calendar size={14} />
            Today
          </button>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2.5 rounded-lg text-sm transition-all"
            >
              <X size={14} />
              Clear
            </button>
          )}
          <SavedFilters
            currentFilters={{
              searchQuery,
              filterPriority,
              filterTags,
            }}
            onApplyFilter={(filters) => {
              setSearchQuery(filters.searchQuery || '')
              setFilterPriority(filters.filterPriority || '')
              setFilterTags(filters.filterTags || '')
            }}
          />
          <QuickFilters
            tasks={tasks}
            onFilterChange={(filterId) => setQuickFilter(filterId)}
            activeFilter={quickFilter}
            onClearFilters={() => setQuickFilter(null)}
          />
{/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exportingCsv}
              className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white px-3 py-2.5 rounded-lg text-sm transition-all shadow-sm"
              title="Export tasks"
            >
              {exportingCsv ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span className="hidden sm:inline">{exportingCsv ? 'Exporting...' : exportFormat.toUpperCase()}</span>
              <ChevronDown size={14} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>
            {showExportMenu && (
              <div className="absolute top-full mt-1 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 z-50 min-w-[120px]">
                <button
                  onClick={() => { setExportFormat('csv'); exportTasks('csv') }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                >
                  <File size={14} /> CSV
                </button>
                <button
                  onClick={() => { setExportFormat('json'); exportTasks('json') }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                >
                  <FileCode size={14} /> JSON
                </button>
                <button
                  onClick={() => { setExportFormat('pdf'); exportTasks('pdf') }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                >
                  <FileType size={14} /> PDF
                </button>
              </div>
            )}
          </div>
          <button
            onClick={exportToICS}
            disabled={exportingIcs}
            className="flex items-center justify-center gap-1 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed text-white px-3 py-2.5 rounded-lg text-sm transition-all shadow-sm"
            title="Export to Calendar (.ics)"
          >
            {exportingIcs ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
            <span className="hidden sm:inline">{exportingIcs ? 'Exporting...' : 'ICS'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={importFromCSV}
            className="hidden"
          />
          <button
            onClick={triggerImport}
            disabled={importingCsv}
            className="flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-3 py-2.5 rounded-lg text-sm transition-all shadow-sm"
            title="Import from CSV"
          >
            {importingCsv ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            <span className="hidden sm:inline">{importingCsv ? 'Importing...' : 'Import'}</span>
          </button>
          <button
            onClick={() => { setShowTrash(true); fetchTrash() }}
            className="flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2.5 rounded-lg text-sm transition-all"
            title="Trash - View deleted tasks"
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">Trash</span>
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'kanban' ? 'matrix' : 'kanban')}
            className={`flex items-center justify-center gap-1 px-3 py-2.5 rounded-lg text-sm transition-all ${
              viewMode === 'matrix'
                ? 'bg-purple-600 text-white shadow-sm' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
            title="Toggle Priority Matrix view"
          >
            <LayoutGrid size={14} />
            <span className="hidden sm:inline">{viewMode === 'matrix' ? 'Kanban' : 'Matrix'}</span>
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'gantt' ? 'kanban' : 'gantt')}
            className={`flex items-center justify-center gap-1 px-3 py-2.5 rounded-lg text-sm transition-all ${
              viewMode === 'gantt'
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
            title="Toggle Gantt Timeline view"
          >
            <Calendar size={14} />
            <span className="hidden sm:inline">{viewMode === 'gantt' ? 'Kanban' : 'Gantt'}</span>
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'calendar' ? 'kanban' : 'calendar')}
            className={`flex items-center justify-center gap-1 px-3 py-2.5 rounded-lg text-sm transition-all ${
              viewMode === 'calendar'
                ? 'bg-green-600 text-white shadow-sm' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
            title="Toggle Calendar view"
          >
            <CalendarIcon size={14} />
            <span className="hidden sm:inline">{viewMode === 'calendar' ? 'Kanban' : 'Calendar'}</span>
          </button>
          <button
            onClick={() => { setBulkMode(!bulkMode); if (bulkMode) clearSelection() }}
            className={`flex items-center justify-center gap-1 px-3 py-2.5 rounded-lg text-sm transition-all ${
              bulkMode 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
            title="Multi-select mode"
          >
            {bulkMode ? <CheckSquare size={14} /> : <Square size={14} />}
            <span className="hidden sm:inline">{bulkMode ? 'Done' : 'Select'}</span>
          </button>
          <button
            onClick={() => setShowColumnManager(true)}
            className="flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2.5 rounded-lg text-sm transition-all"
            title="Manage columns"
          >
            <LayoutGrid size={14} />
            <span className="hidden sm:inline">Columns</span>
          </button>
        </div>
        
        {/* Keyboard shortcuts hint */}
        <div className="mt-3 text-xs text-slate-400 flex flex-wrap gap-3">
          <span><kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">n</kbd> new task</span>
          <span><kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">Ctrl+D</kbd> duplicate</span>
          <span><kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">d</kbd> delete</span>
          <span><kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">/</kbd> search</span>
          <span><kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">←→</kbd> lanes</span>
          <span><kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">↑↓</kbd> navigate</span>
          <span><kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">Enter</kbd> open</span>
          <button 
            onClick={() => setShowShortcutsModal(true)}
            className="hover:text-blue-500 transition-colors"
            title="Show all shortcuts"
          >
            <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">?</kbd> help
          </button>
        </div>
      </div>

      {/* Priority Matrix View */}
      {viewMode === 'matrix' && (
        <PriorityMatrix
          tasks={tasks}
          onTaskClick={(task) => setEditingTask(task)}
          onTaskMove={handleMatrixTaskMove}
        />
      )}

      {/* Gantt Timeline View */}
      {viewMode === 'gantt' && (
        <GanttView
          tasks={tasks}
          onTaskClick={(taskId) => {
            const task = tasks.find(t => t.id === taskId)
            if (task) setEditingTask(task)
          }}
        />
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <CalendarView
          tasks={tasks}
          labels={labels}
          onTaskClick={(task) => setEditingTask(task)}
          onTaskDrop={async (taskId, newDate) => {
            try {
              const task = tasks.find(t => t.id === taskId)
              if (task) {
                const updatedTask = { ...task, dueDate: newDate.toISOString() }
                await fetch(`/api/tasks/${taskId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ dueDate: newDate.toISOString() })
                })
                setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t))
                showToast('Task moved to ' + newDate.toLocaleDateString(), 'success')
              }
            } catch (e) {
              console.error('Failed to move task', e)
              showToast('Failed to move task', 'error')
            }
          }}
          onQuickAdd={(date) => {
            // Open quick add with pre-filled date
            setQuickAddDate(date)
            setShowQuickAdd(true)
          }}
        />
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {allLanes.map((lane) => (
            <div key={lane.id} className="flex-shrink-0 w-[85vw] sm:w-[280px] md:min-w-[250px] md:max-w-[300px]">
              <div className={`border-t-4 ${lane.color} px-3 py-3 bg-white rounded-t-lg border border-b-0 border-slate-200`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{lane.icon}</span>
                    <div className="skeleton skeleton-text w-20" />
                  </div>
                  <div className="skeleton skeleton-text w-8" />
                </div>
              </div>
              <div className="bg-slate-50 p-2 rounded-b-lg min-h-[150px] sm:min-h-[200px] border border-t-0 border-slate-200">
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
              className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-slate-700 font-semibold">{allLanes[selectedLane].label}</span>
            <button
              onClick={() => setSelectedLane(prev => Math.min(allLanes.length - 1, prev + 1))}
              disabled={selectedLane === allLanes.length - 1}
              className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50"
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
              {allLanes.map((lane, index) => (
                <Lane
                  key={lane.id}
                  lane={lane}
                  tasks={getTasksByStatus(lane.id)}
                  onAddTask={(status) => {
                    setNewTaskStatus(status)
                    setShowAddModal(true)
                  }}
                  onEditTask={(task) => openTaskModal(task)}
                  onRunAsAgent={(task) => handleRunAsAgent(task)}
                  isActive={index === selectedLane}
                  onDragOver={() => {}}
                  selectedTasks={selectedTasks}
                  bulkMode={bulkMode}
                  toggleTaskSelection={toggleTaskSelection}
                  onToggleStar={handleToggleStar}
                />
              ))}
              <DragOverlay>
                {activeTask && (
                  <div className="drag-overlay-card rounded-lg p-3 w-[250px] sm:w-[280px]">
                    <div className="flex items-start gap-2">
                      <div className="mt-1 text-gray-500">
                        <GripVertical size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{activeTask.title}</p>
                        {activeTask.description && (
                          <p className="text-gray-400 text-xs mt-1 line-clamp-2">{activeTask.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          </div>
        </>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-md animate-fade-in shadow-xl">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Add Task</h2>
            <input
              type="text"
              placeholder="Task title"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              autoFocus
            />
            <RichTextEditor
              content={newTask.description}
              onChange={(content) => setNewTask({ ...newTask, description: content })}
              placeholder="Description (optional)"
              minHeight="80px"
            />
            <div className="flex gap-3 mb-3">
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              
              <select
                value={newTask.portfolioId || ''}
                onChange={(e) => setNewTask({ ...newTask, portfolioId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              >
                <option value="">No Portfolio</option>
                {portfolios.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="relative mb-4">
              <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tags (comma-separated)"
                value={newTask.tags}
                onChange={(e) => setNewTask({ ...newTask, tags: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
            </div>
            {/* Due Date with Natural Language Support */}
            <div className="relative mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={16} className="text-slate-400" />
                <label className="text-slate-600 text-sm">Due:</label>
                <input
                  type="text"
                  placeholder="e.g., tomorrow, next friday, in 3 days"
                  value={naturalDateInput}
                  onChange={(e) => {
                    setNaturalDateInput(e.target.value)
                    const parsed = parseNaturalDate(e.target.value)
                    if (parsed.isValid) {
                      setNewTask({ 
                        ...newTask, 
                        dueDate: parsed.date.toISOString().split('T')[0],
                        dueTime: parsed.date.getHours() > 0 ? `${String(parsed.date.getHours()).padStart(2, '0')}:${String(parsed.date.getMinutes()).padStart(2, '0')}` : ''
                      })
                    }
                  }}
                  onFocus={() => setShowDateSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowDateSuggestions(false), 200)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                />
              </div>
              {/* Quick date suggestions */}
              {showDateSuggestions && (
                <div className="absolute z-20 top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-2 flex flex-wrap gap-1 w-64">
                  {getDateSuggestions().map((sug) => (
                    <button
                      key={sug.value}
                      onClick={() => {
                        setNaturalDateInput(sug.label)
                        const parsed = parseNaturalDate(sug.value)
                        if (parsed.isValid) {
                          setNewTask({ 
                            ...newTask, 
                            dueDate: parsed.date.toISOString().split('T')[0],
                            dueTime: parsed.date.getHours() > 0 ? `${String(parsed.date.getHours()).padStart(2, '0')}:${String(parsed.date.getMinutes()).padStart(2, '0')}` : ''
                          })
                        }
                        setShowDateSuggestions(false)
                      }}
                      className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900 text-slate-700 dark:text-slate-300"
                    >
                      {sug.label}
                    </button>
                  ))}
                </div>
              )}
              {/* Standard date/time picker still available */}
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 flex-1"
                />
                <input
                  type="time"
                  value={newTask.dueTime}
                  onChange={(e) => setNewTask({ ...newTask, dueTime: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 w-28"
                  placeholder="Time"
                />
              </div>
            </div>
            {/* Reminder in Add Task */}
            <div className="flex items-center gap-2 mb-4">
              <Bell size={16} className="text-slate-400" />
              <label className="text-slate-600 text-sm">Remind:</label>
              <input
                type="datetime-local"
                value={newTask.reminder}
                onChange={(e) => setNewTask({ ...newTask, reminder: e.target.value })}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 flex-1"
              />
              {newTask.reminder && (
                <button
                  onClick={() => setNewTask({ ...newTask, reminder: '' })}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 mb-4">
              <Repeat size={16} className="text-slate-400" />
              <label className="text-slate-600 text-sm">Repeat:</label>
              <select
                value={newTask.recurrence}
                onChange={(e) => setNewTask({ ...newTask, recurrence: e.target.value })}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 flex-1"
              >
                {RECURRENCE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddTask}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg transition-colors font-medium"
              >
                Add Task
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-fade-in shadow-xl">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Edit Task</h2>
            
            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-4 overflow-x-auto">
              <button
                onClick={() => setActiveTaskTab('details')}
                className={`px-4 py-2 text-sm transition-colors whitespace-nowrap ${
                  activeTaskTab === 'details' 
                    ? 'text-blue-600 border-b-2 border-blue-600 font-medium' 
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
                    ? 'text-blue-600 border-b-2 border-blue-600 font-medium' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <MessageSquare size={14} />
                Comments {comments.length > 0 && `(${comments.length})`}
              </button>
              <button
                onClick={() => setActiveTaskTab('attachments')}
                className={`px-4 py-2 text-sm transition-colors flex items-center gap-1 whitespace-nowrap ${
                  activeTaskTab === 'attachments' 
                    ? 'text-blue-600 border-b-2 border-blue-600 font-medium' 
                    : 'text-slate-400 hover:text-slate-600'
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
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingTask.title}
                      onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      placeholder="Task title"
                    />
                    <button
                      onClick={() => setEditingTask({ ...editingTask, starred: !editingTask.starred })}
                      className={`p-2.5 rounded-lg transition-colors ${
                        editingTask.starred 
                          ? 'bg-yellow-100 text-yellow-600' 
                          : 'bg-slate-100 text-slate-400 hover:bg-yellow-100 hover:text-yellow-500'
                      }`}
                      title={editingTask.starred ? 'Unstar task' : 'Star task'}
                    >
                      <Star size={20} fill={editingTask.starred ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  <RichTextEditor
                    content={editingTask.description || ''}
                    onChange={(content) => setEditingTask({ ...editingTask, description: content })}
                    placeholder="Description (optional)"
                    minHeight="100px"
                  />
                  <div className="flex gap-3">
                    <select
                      value={editingTask.priority}
                      onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>

                    <select
                      value={editingTask.portfolioId || ''}
                      onChange={(e) => setEditingTask({ ...editingTask, portfolioId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                      <option value="">No Portfolio</option>
                      {portfolios.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Due Date */}
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    <label className="text-slate-600 text-sm">Due Date:</label>
                    <input
                      type="date"
                      value={editingTask.dueDate ? editingTask.dueDate.split('T')[0] : ''}
                      onChange={(e) => handleUpdateDueDate(e.target.value || null)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 flex-1"
                    />
                    {editingTask.dueDate && (
                      <button
                        onClick={() => handleUpdateDueDate(null)}
                        className="text-slate-400 hover:text-slate-600"
                        title="Clear due date"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Reminder */}
                  <div className="flex items-center gap-2">
                    {editingTask.reminder ? <Bell size={16} className="text-blue-500" /> : <BellOff size={16} className="text-slate-400" />}
                    <label className="text-slate-600 text-sm">Reminder:</label>
                    <input
                      type="datetime-local"
                      value={editingTask.reminder ? editingTask.reminder.slice(0, 16) : ''}
                      onChange={(e) => {
                        const reminderValue = e.target.value ? new Date(e.target.value).toISOString() : null
                        setEditingTask({ ...editingTask, reminder: reminderValue, reminderSent: false })
                      }}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 flex-1"
                    />
                    {editingTask.reminder && (
                      <button
                        onClick={() => setEditingTask({ ...editingTask, reminder: null, reminderSent: false })}
                        className="text-slate-400 hover:text-slate-600"
                        title="Clear reminder"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Quick Reminder Buttons */}
                  {editingTask.dueDate && !editingTask.reminder && (
                    <div className="flex items-center gap-2 ml-6">
                      <span className="text-xs text-slate-500">Quick set:</span>
                      <button
                        onClick={() => {
                          const due = new Date(editingTask.dueDate!)
                          const reminderTime = new Date(due.getTime() - 24 * 60 * 60 * 1000) // 24 hours before
                          if (reminderTime > new Date()) {
                            setEditingTask({ ...editingTask, reminder: reminderTime.toISOString() })
                          }
                        }}
                        className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded hover:bg-slate-200"
                      >
                        1 day before
                      </button>
                      <button
                        onClick={() => {
                          const due = new Date(editingTask.dueDate!)
                          const reminderTime = new Date(due.getTime() - 60 * 60 * 1000) // 1 hour before
                          if (reminderTime > new Date()) {
                            setEditingTask({ ...editingTask, reminder: reminderTime.toISOString() })
                          }
                        }}
                        className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded hover:bg-slate-200"
                      >
                        1 hour before
                      </button>
                      <button
                        onClick={() => {
                          const reminderTime = new Date(Date.now() + 15 * 60 * 1000) // 15 min from now
                          setEditingTask({ ...editingTask, reminder: reminderTime.toISOString() })
                        }}
                        className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded hover:bg-slate-200"
                      >
                        In 15 min
                      </button>
                    </div>
                  )}

                  {/* Estimated Time */}
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-slate-400" />
                    <label className="text-slate-600 text-sm">Estimated Time:</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Minutes"
                      value={editingTask.estimatedTime ? Math.round(editingTask.estimatedTime / 60) : ''}
                      onChange={(e) => {
                        const minutes = parseInt(e.target.value) || 0
                        setEditingTask({ ...editingTask, estimatedTime: minutes * 60 })
                      }}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 flex-1"
                    />
                    <span className="text-slate-500 text-xs">min</span>
                    {(editingTask.estimatedTime ?? 0) > 0 && (
                      <button
                        onClick={() => setEditingTask({ ...editingTask, estimatedTime: null })}
                        className="text-slate-400 hover:text-slate-600"
                        title="Clear estimated time"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Location-based Reminder */}
                  <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      {editingTask.locationEnabled ? <MapPin size={16} className="text-green-500" /> : <MapPin size={16} className="text-slate-400" />}
                      <label className="text-slate-600 text-sm font-medium">Location Reminder:</label>
                      <label className="relative inline-flex items-center cursor-pointer ml-auto">
                        <input
                          type="checkbox"
                          checked={editingTask.locationEnabled || false}
                          onChange={(e) => setEditingTask({ ...editingTask, locationEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>

                    {editingTask.locationEnabled && (
                      <>
                        {/* Location Search */}
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search for a location..."
                            value={editingTask.locationName || ''}
                            onChange={async (e) => {
                              const query = e.target.value
                              setEditingTask({ ...editingTask, locationName: query })
                              if (query.length >= 3) {
                                try {
                                  const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`)
                                  const results = await res.json()
                                  if (results.length > 0) {
                                    setLocationSearchResults(results)
                                  }
                                } catch (err) {
                                  console.error('Geocoding error:', err)
                                }
                              } else {
                                setLocationSearchResults([])
                              }
                            }}
                            onFocus={async () => {
                              if ((editingTask.locationName || '').length >= 3 && locationSearchResults.length === 0) {
                                try {
                                  const res = await fetch(`/api/geocode?q=${encodeURIComponent(editingTask.locationName || '')}`)
                                  const results = await res.json()
                                  setLocationSearchResults(results)
                                } catch (err) {
                                  console.error('Geocoding error:', err)
                                }
                              }
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition(
                                  async (position) => {
                                    const { latitude, longitude } = position.coords
                                    try {
                                      const res = await fetch('/api/geocode', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ lat: latitude, lon: longitude })
                                      })
                                      const data = await res.json()
                                      setEditingTask({
                                        ...editingTask,
                                        locationName: data.name || data.displayName?.split(',')[0],
                                        locationAddress: data.displayName,
                                        locationLat: latitude,
                                        locationLng: longitude,
                                      })
                                      setLocationSearchResults([])
                                    } catch (err) {
                                      console.error('Reverse geocoding error:', err)
                                    }
                                  },
                                  (err) => console.error('Geolocation error:', err)
                                )
                              }
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500"
                            title="Use current location"
                          >
                            <Navigation size={16} />
                          </button>
                          {locationSearchResults.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                              {locationSearchResults.map((result: any, idx: number) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    setEditingTask({
                                      ...editingTask,
                                      locationName: result.name || result.displayName?.split(',')[0],
                                      locationAddress: result.displayName,
                                      locationLat: result.lat,
                                      locationLng: result.lon,
                                    })
                                    setLocationSearchResults([])
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm border-b border-slate-100 last:border-0"
                                >
                                  <div className="font-medium text-slate-700">{result.name}</div>
                                  <div className="text-xs text-slate-500 truncate">{result.displayName}</div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Trigger Type */}
                        <div className="flex items-center gap-2">
                          <label className="text-slate-600 text-sm">When:</label>
                          <select
                            value={editingTask.locationTrigger || 'arrive'}
                            onChange={(e) => setEditingTask({ ...editingTask, locationTrigger: e.target.value })}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 flex-1"
                          >
                            <option value="arrive">Arriving at location</option>
                            <option value="leave">Leaving location</option>
                          </select>
                        </div>

                        {/* Radius */}
                        <div className="flex items-center gap-2">
                          <label className="text-slate-600 text-sm">Radius:</label>
                          <input
                            type="range"
                            min="100"
                            max="1000"
                            step="100"
                            value={editingTask.locationRadius || 500}
                            onChange={(e) => setEditingTask({ ...editingTask, locationRadius: parseInt(e.target.value) })}
                            className="flex-1"
                          />
                          <span className="text-slate-600 text-sm w-16 text-right">{editingTask.locationRadius || 500}m</span>
                        </div>

                        {/* Clear Location */}
                        {(editingTask.locationLat || editingTask.locationLng) && (
                          <button
                            onClick={() => setEditingTask({ 
                              ...editingTask, 
                              locationName: null, 
                              locationAddress: null, 
                              locationLat: null, 
                              locationLng: null,
                              locationRadius: null,
                              locationEnabled: false,
                            })}
                            className="text-xs text-red-500 hover:text-red-600"
                          >
                            Clear location
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="relative">
                    <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>

                  {/* Dependencies */}
                  <div className="relative">
                    <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      multiple
                      value={editingTask.dependsOn ? JSON.parse(editingTask.dependsOn) : []}
                      onChange={(e) => {
                        const selectedDeps = Array.from(e.target.selectedOptions, option => option.value)
                        setEditingTask({
                          ...editingTask,
                          dependsOn: JSON.stringify(selectedDeps)
                        })
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 min-h-[80px]"
                    >
                      {tasks.filter(t => t.id !== editingTask.id).map(task => (
                        <option key={task.id} value={task.id}>
                          {task.title.substring(0, 40)}{task.title.length > 40 ? '...' : ''}
                        </option>
                      ))}
                    </select>
                    <span className="absolute left-9 top-[-8px] bg-white px-1 text-xs text-slate-500">Depends on (Ctrl+click)</span>
                  </div>

                  {/* Labels */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Tag size={16} className="text-slate-400" />
                      <label className="text-slate-600 text-sm">Labels:</label>
                      <button
                        onClick={() => setShowLabelManager(!showLabelManager)}
                        className="text-xs text-blue-600 hover:text-blue-700"
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

                  {/* Gmail Link */}
                  <div className="bg-gray-800 rounded p-3 border border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail size={16} className="text-gray-500" />
                      <span className="text-gray-400 text-sm">Linked Email:</span>
                    </div>
                    {editingTask?.gmailThreadId ? (
                      <div className="flex items-center gap-2 bg-gray-900 rounded p-2">
                        <span className="text-gray-400 text-xs flex-1 truncate">
                          {(() => {
                            const fields = JSON.parse(editingTask.customFields || '[]')
                            const email = fields.find((f: any) => f.type === 'gmailLink')
                            return email?.subject || editingTask.gmailThreadId
                          })()}
                        </span>
                        <button
                          onClick={async () => {
                            try {
                              await fetch(`/api/tasks/${editingTask.id}/email`, {
                                method: 'DELETE'
                              })
                              setEditingTask({ ...editingTask, gmailThreadId: null })
                              showToast('Email unlinked', 'success')
                            } catch (e) {
                              showToast('Failed to unlink email', 'error')
                            }
                          }}
                          className="text-gray-500 hover:text-red-400"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          id="gmailLinkInput"
                          placeholder="Paste Gmail link..."
                          className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={async () => {
                            const input = document.getElementById('gmailLinkInput') as HTMLInputElement
                            const gmailUrl = input?.value.trim()
                            if (gmailUrl && gmailUrl.includes('mail.google.com')) {
                              const match = gmailUrl.match(/[a-zA-Z0-9]{20,}/)
                              if (match) {
                                try {
                                  const res = await fetch(`/api/tasks/${editingTask.id}/email`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ 
                                      gmailThreadId: match[0],
                                      subject: 'Linked Email',
                                      from: 'Gmail'
                                    })
                                  })
                                  if (res.ok) {
                                    const data = await res.json()
                                    setEditingTask({ ...editingTask, gmailThreadId: data.gmailThreadId })
                                    showToast('Email linked!', 'success')
                                    input.value = ''
                                  }
                                } catch (e) {
                                  showToast('Failed to link email', 'error')
                                }
                              }
                            }
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                        >
                          Link
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Custom Fields */}
                  <div className="bg-gray-800 rounded p-3 border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm font-medium">Custom Fields</span>
                      </div>
                    </div>
                    
                    {/* Existing custom fields */}
                    {customFields.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {customFields.map((field, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-gray-400 text-xs min-w-[80px]">{field.key}:</span>
                            {field.type === 'select' ? (
                              <input
                                type="text"
                                value={field.value}
                                onChange={(e) => {
                                  const updated = [...customFields]
                                  updated[idx].value = e.target.value
                                  setCustomFields(updated)
                                }}
                                className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-sm"
                                placeholder="Value"
                              />
                            ) : field.type === 'number' ? (
                              <input
                                type="number"
                                value={field.value}
                                onChange={(e) => {
                                  const updated = [...customFields]
                                  updated[idx].value = e.target.value
                                  setCustomFields(updated)
                                }}
                                className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-sm"
                              />
                            ) : field.type === 'date' ? (
                              <input
                                type="date"
                                value={field.value}
                                onChange={(e) => {
                                  const updated = [...customFields]
                                  updated[idx].value = e.target.value
                                  setCustomFields(updated)
                                }}
                                className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-sm"
                              />
                            ) : (
                              <input
                                type="text"
                                value={field.value}
                                onChange={(e) => {
                                  const updated = [...customFields]
                                  updated[idx].value = e.target.value
                                  setCustomFields(updated)
                                }}
                                className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-sm"
                              />
                            )}
                            <button
                              onClick={() => {
                                const updated = customFields.filter((_, i) => i !== idx)
                                setCustomFields(updated)
                              }}
                              className="text-gray-500 hover:text-red-400"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add new custom field */}
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={newCustomField.key}
                        onChange={(e) => setNewCustomField({ ...newCustomField, key: e.target.value })}
                        placeholder="Field name"
                        className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-sm"
                      />
                      <select
                        value={newCustomField.type}
                        onChange={(e) => setNewCustomField({ ...newCustomField, type: e.target.value as CustomField['type'] })}
                        className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-sm"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="select">Select</option>
                      </select>
                      <button
                        onClick={() => {
                          if (newCustomField.key.trim()) {
                            setCustomFields([...customFields, { ...newCustomField, key: newCustomField.key.trim() }])
                            setNewCustomField({ key: '', value: '', type: 'text' })
                          }
                        }}
                        disabled={!newCustomField.key.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-sm disabled:opacity-50"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
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
                              {(attachment.fileSize / 1024).toFixed(1)} KB • {attachment.uploadedBy} • {new Date(attachment.createdAt).toLocaleDateString()}
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
                onClick={handleDuplicateTask}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded transition-colors flex items-center justify-center gap-1"
              >
                <Copy size={16} /> Duplicate
              </button>
              <button
                onClick={handleArchiveTask}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded transition-colors"
              >
                Archive
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
      
      {/* Bulk Action Bar */}
      {bulkMode && selectedTasks.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-4 z-50 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2">
            <CheckSquare size={18} className="text-blue-400" />
            <span className="font-medium">{selectedTasks.size} selected</span>
          </div>
          
          <div className="h-6 w-px bg-slate-600" />
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Move to:</span>
            <select
              onChange={(e) => e.target.value && handleBulkAction('move', e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value=""
            >
              <option value="">Select status...</option>
              {allLanes.map(lane => (
                <option key={lane.id} value={lane.id}>{lane.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Priority:</span>
            <select
              onChange={(e) => e.target.value && handleBulkAction('priority', e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value=""
            >
              <option value="">Set priority...</option>
              {PRIORITIES.map(p => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
          </div>
          
          <div className="h-6 w-px bg-slate-600" />
          
          <button
            onClick={() => setShowBatchEdit(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-sm transition-colors"
          >
            <ListChecks size={14} />
            Batch Edit
          </button>
          
          <button
            onClick={() => handleBulkAction('delete')}
            disabled={bulkActionLoading}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 px-3 py-1.5 rounded-lg text-sm transition-colors"
          >
            <Trash2 size={14} />
            Delete
          </button>
          
          <button
            onClick={clearSelection}
            className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-sm transition-colors"
          >
            <X size={14} />
            Clear
          </button>
        </div>
      )}
      
      {/* Trash Modal */}
      {showTrash && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Trash2 size={18} className="text-red-500" />
                Trash {trashedItems.length > 0 && <span className="text-sm font-normal text-slate-500">({trashedItems.length})</span>}
              </h2>
              <div className="flex items-center gap-2">
                {trashedItems.length > 0 && (
                  <>
                    <button
                      onClick={restoreAllTasks}
                      className="text-xs text-blue-500 hover:text-blue-700"
                    >
                      Restore All
                    </button>
                    <button
                      onClick={emptyTrash}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Empty Trash
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowTrash(false)}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {trashedItems.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No deleted tasks</p>
              ) : (
                <div className="space-y-3">
                  {trashedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 dark:text-white truncate">{item.title}</p>
                        <p className="text-xs text-slate-500">
                          Deleted {item.deletedAt ? new Date(item.deletedAt).toLocaleString() : 'recently'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <button
                          onClick={() => restoreTask(item.id)}
                          disabled={restoring}
                          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                        >
                          <RefreshCcw size={14} />
                          Restore
                        </button>
                        <button
                          onClick={() => deletePermanently(item.id)}
                          className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1.5 rounded-lg text-sm transition-colors"
                          title="Permanently delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Batch Edit Modal */}
      {showBatchEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <ListChecks size={18} className="text-blue-500" />
                Batch Edit ({selectedTasks.size} tasks)
              </h2>
              <button
                onClick={() => setShowBatchEdit(false)}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[65vh] space-y-4">
              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Due Date
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    id="batch-due-date"
                    className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => {
                      const val = e.target.value
                      if (val) handleBulkAction('dueDate', val)
                    }}
                  />
                  <button
                    onClick={() => handleBulkAction('clearDueDate')}
                    className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg text-sm transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
              
              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Priority
                </label>
                <select
                  id="batch-priority"
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => e.target.value && handleBulkAction('priority', e.target.value)}
                >
                  <option value="">No change</option>
                  {PRIORITIES.map(p => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
              
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Status
                </label>
                <select
                  id="batch-status"
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => e.target.value && handleBulkAction('move', e.target.value)}
                >
                  <option value="">No change</option>
                  {allLanes.map(lane => (
                    <option key={lane.id} value={lane.id}>{lane.label}</option>
                  ))}
                </select>
              </div>
              
              {/* Estimated Time */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Estimated Time (minutes)
                </label>
                <input
                  type="number"
                  id="batch-estimated"
                  placeholder="e.g. 30"
                  min="0"
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    const val = e.target.value
                    if (val && parseInt(val) >= 0) handleBulkAction('estimatedTime', val)
                  }}
                />
              </div>
              
              {/* Recurrence */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Recurrence
                </label>
                <div className="flex gap-2">
                  <select
                    id="batch-recurrence"
                    className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => handleBulkAction('recurrence', e.target.value)}
                  >
                    <option value="">No change</option>
                    {RECURRENCE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleBulkAction('clearRecurrence')}
                    className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg text-sm transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
              
              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Add Tags (comma-separated)
                </label>
                <input
                  type="text"
                  id="batch-tags"
                  placeholder="e.g. work, urgent, review"
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value
                      if (val) {
                        const tags = val.split(',').map(t => t.trim()).filter(t => t)
                        if (tags.length > 0) handleBulkAction('tags', tags)
                        ;(e.target as HTMLInputElement).value = ''
                      }
                    }
                  }}
                />
                <p className="text-xs text-slate-500 mt-1">Press Enter to add tags</p>
              </div>
              
              {/* Labels */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Set Labels (replaces existing)
                </label>
                <input
                  type="text"
                  id="batch-labels"
                  placeholder="e.g. important, personal"
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value
                      if (val) {
                        const labels = val.split(',').map(l => l.trim()).filter(l => l)
                        if (labels.length > 0) handleBulkAction('labels', labels)
                        ;(e.target as HTMLInputElement).value = ''
                      }
                    }
                  }}
                />
                <p className="text-xs text-slate-500 mt-1">Press Enter to set labels (replaces all existing)</p>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => {
                  setShowBatchEdit(false)
                  clearSelection()
                  fetchTasks()
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsModal 
        isOpen={showShortcutsModal} 
        onClose={() => setShowShortcutsModal(false)} 
      />

      {/* Advanced Search Modal */}
      <AdvancedSearchModal 
        isOpen={showAdvancedSearch} 
        onClose={() => setShowAdvancedSearch(false)}
        onNavigateToTask={(taskId) => {
          // Find and select the task - set editing task to open modal
          const task = tasks.find(t => t.id === taskId)
          if (task) setEditingTask(task)
        }}
      />

      {/* Column Manager Modal */}
      {showColumnManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Manage Columns</h2>
              <button
                onClick={() => setShowColumnManager(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {/* Existing columns list */}
              <div className="space-y-2 mb-4">
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Current Columns</h3>
                {allLanes.map((lane) => {
                  const isDefault = DEFAULT_LANES.find(d => d.id === lane.id)
                  const taskCount = getTasksByStatus(lane.id).length
                  return (
                    <div
                      key={lane.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{lane.icon}</span>
                        <span className="font-medium text-slate-700 dark:text-slate-200">{lane.label}</span>
                        <span className="text-xs text-slate-400">({taskCount} tasks)</span>
                      </div>
                      {!isDefault && (
                        <button
                          onClick={() => deleteCustomLane(lane.id)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="Delete column"
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Add new column */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Add New Column</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newLaneName}
                    onChange={(e) => setNewLaneName(e.target.value)}
                    placeholder="Column name..."
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => e.key === 'Enter' && addCustomLane()}
                  />
                  
                  {/* Color picker */}
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Color</label>
                    <div className="flex flex-wrap gap-2">
                      {LANE_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setNewLaneColor(color.value)}
                          className={`w-6 h-6 rounded-full border-2 ${color.value} ${
                            newLaneColor === color.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                          }`}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Icon picker */}
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Icon</label>
                    <div className="flex flex-wrap gap-2">
                      {['📋', '📌', '📕', '📗', '📘', '📙', '🗂️', '📎', '🔖', '🏷️', '💼', '🎯', '⚡', '🚀', '💡', '🔥'].map((icon) => (
                        <button
                          key={icon}
                          onClick={() => setNewLaneIcon(icon)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
                            newLaneIcon === icon ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500' : 'bg-slate-100 dark:bg-slate-700'
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={addCustomLane}
                    disabled={!newLaneName.trim()}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                  >
                    Add Column
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
