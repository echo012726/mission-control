'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, GripVertical } from 'lucide-react'
import { Task } from '@/types'

const LANES = [
  { id: 'inbox', label: 'Inbox', color: 'border-gray-500' },
  { id: 'planned', label: 'Planned', color: 'border-blue-500' },
  { id: 'in_progress', label: 'In Progress', color: 'border-yellow-500' },
  { id: 'blocked', label: 'Blocked', color: 'border-red-500' },
  { id: 'done', label: 'Done', color: 'border-green-500' },
]

function TaskCard({ task, onEdit }: { task: Task; onEdit: (task: Task) => void }) {
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
    transition,
  }

  const priorityColors = {
    low: 'bg-gray-600',
    medium: 'bg-blue-600',
    high: 'bg-red-600',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gray-800 rounded p-3 mb-2 cursor-pointer hover:bg-gray-750 ${
        isDragging ? 'opacity-50' : ''
      }`}
      onClick={() => onEdit(task)}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 text-gray-500 hover:text-gray-400 cursor-grab"
        >
          <GripVertical size={14} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{task.title}</p>
          {task.description && (
            <p className="text-gray-400 text-xs mt-1 line-clamp-2">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`text-xs px-2 py-0.5 rounded ${priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.medium}`}
            >
              {task.priority}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Lane({
  lane,
  tasks,
  onTaskMove,
  onAddTask,
  onEditTask,
}: {
  lane: typeof LANES[0]
  tasks: Task[]
  onTaskMove: (taskId: string, newStatus: string) => void
  onAddTask: (status: string) => void
  onEditTask: (task: Task) => void
}) {
  const { setNodeRef } = useSortable({ id: lane.id })

  return (
    <div className="flex-1 min-w-[250px] max-w-[300px]">
      <div className={`border-t-2 ${lane.color} px-3 py-2 bg-gray-900 rounded-t`}>
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-white">{lane.label}</h3>
          <span className="text-gray-400 text-sm">{tasks.length}</span>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className="bg-gray-900/50 p-2 rounded-b min-h-[200px]"
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={onEditTask} />
          ))}
        </SortableContext>
        <button
          onClick={() => onAddTask(lane.id)}
          className="w-full flex items-center justify-center gap-1 text-gray-500 hover:text-gray-400 py-2 text-sm"
        >
          <Plus size={14} /> Add task
        </button>
      </div>
    </div>
  )
}

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTaskStatus, setNewTaskStatus] = useState('inbox')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks')
      if (res.ok) {
        const data = await res.json()
        setTasks(data)
      }
    } catch (e) {
      console.error('Failed to fetch tasks', e)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id)
    if (task) setActiveTask(task)
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
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      fetchTasks()
    } catch (e) {
      console.error('Failed to update task', e)
    }
  }

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return

    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTask,
          status: newTaskStatus,
        }),
      })
      setNewTask({ title: '', description: '', priority: 'medium' })
      setShowAddModal(false)
      fetchTasks()
    } catch (e) {
      console.error('Failed to create task', e)
    }
  }

  const handleEditTask = async () => {
    if (!editingTask) return

    try {
      await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingTask.title,
          description: editingTask.description,
          priority: editingTask.priority,
        }),
      })
      setEditingTask(null)
      fetchTasks()
    } catch (e) {
      console.error('Failed to update task', e)
    }
  }

  const handleDeleteTask = async () => {
    if (!editingTask) return

    try {
      await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'DELETE',
      })
      setEditingTask(null)
      fetchTasks()
    } catch (e) {
      console.error('Failed to delete task', e)
    }
  }

  const getTasksByStatus = (status: string) => tasks.filter((t) => t.status === status)

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {LANES.map((lane) => (
          <Lane
            key={lane.id}
            lane={lane}
            tasks={getTasksByStatus(lane.id)}
            onTaskMove={updateTaskStatus}
            onAddTask={(status) => {
              setNewTaskStatus(status)
              setShowAddModal(true)
            }}
            onEditTask={(task) => setEditingTask(task)}
          />
        ))}
        <DragOverlay>
          {activeTask && (
            <div className="bg-gray-800 rounded p-3 shadow-lg">
              <p className="text-white text-sm">{activeTask.title}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Add Task</h2>
            <input
              type="text"
              placeholder="Task title"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white mb-3"
              autoFocus
            />
            <textarea
              placeholder="Description (optional)"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white mb-3 h-24"
            />
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white mb-4"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleAddTask}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Edit Task</h2>
            <input
              type="text"
              value={editingTask.title}
              onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white mb-3"
            />
            <textarea
              value={editingTask.description || ''}
              onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white mb-3 h-24"
            />
            <select
              value={editingTask.priority}
              onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white mb-4"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleEditTask}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
              >
                Save
              </button>
              <button
                onClick={handleDeleteTask}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded"
              >
                Delete
              </button>
              <button
                onClick={() => setEditingTask(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
