'use client'
import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'

interface Task {
  _id: string
  title: string
  status: 'todo' | 'in_progress' | 'done' | 'blocked'
  assigneeType: 'user' | 'agent'
  createdAt: number
}

export default function TasksPage() {
  const tasks = useQuery(api.tasks.getTasks) || []
  const createTask = useMutation(api.tasks.createTask)
  const updateTaskStatus = useMutation(api.tasks.updateTaskStatus)
  const deleteTask = useMutation(api.tasks.deleteTask)
  
  const [newTask, setNewTask] = useState('')

  async function handleCreateTask() {
    if (!newTask.trim()) return
    await createTask({
      title: newTask,
      status: 'todo',
      assigneeType: 'user',
    })
    setNewTask('')
  }

  async function handleMoveTask(id: string, status: Task['status']) {
    await updateTaskStatus({ id, status })
  }

  async function handleDeleteTask(id: string) {
    await deleteTask({ id })
  }

  const todoTasks = tasks.filter((t: Task) => t.status === 'todo')
  const inProgressTasks = tasks.filter((t: Task) => t.status === 'in_progress')
  const doneTasks = tasks.filter((t: Task) => t.status === 'done')
  const blockedTasks = tasks.filter((t: Task) => t.status === 'blocked')

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Tasks Board</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="New task..."
            className="border rounded px-3 py-1"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
          />
          <button onClick={handleCreateTask} className="bg-blue-500 text-white px-4 py-1 rounded">Add</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="border rounded p-3">
          <h3 className="font-semibold mb-2">To Do ({todoTasks.length})</h3>
          {todoTasks.map((task: Task) => (
            <div key={task._id} className="bg-white p-2 rounded shadow-sm mb-2">
              <div>{task.title}</div>
              <div className="flex gap-1 mt-1">
                <button onClick={() => handleMoveTask(task._id, 'in_progress')} className="text-xs text-blue-500">→</button>
                <button onClick={() => handleDeleteTask(task._id)} className="text-xs text-red-500">×</button>
              </div>
            </div>
          ))}
        </div>
        <div className="border rounded p-3">
          <h3 className="font-semibold mb-2">In Progress ({inProgressTasks.length})</h3>
          {inProgressTasks.map((task: Task) => (
            <div key={task._id} className="bg-white p-2 rounded shadow-sm mb-2">
              <div>{task.title}</div>
              <div className="flex gap-1 mt-1">
                <button onClick={() => handleMoveTask(task._id, 'todo')} className="text-xs">←</button>
                <button onClick={() => handleMoveTask(task._id, 'done')} className="text-xs text-blue-500">→</button>
                <button onClick={() => handleDeleteTask(task._id)} className="text-xs text-red-500">×</button>
              </div>
            </div>
          ))}
        </div>
        <div className="border rounded p-3">
          <h3 className="font-semibold mb-2">Done ({doneTasks.length})</h3>
          {doneTasks.map((task: Task) => (
            <div key={task._id} className="bg-white p-2 rounded shadow-sm mb-2 line-through opacity-50">
              <div>{task.title}</div>
              <div className="flex gap-1 mt-1">
                <button onClick={() => handleMoveTask(task._id, 'in_progress')} className="text-xs">←</button>
                <button onClick={() => handleDeleteTask(task._id)} className="text-xs text-red-500">×</button>
              </div>
            </div>
          ))}
        </div>
        <div className="border rounded p-3">
          <h3 className="font-semibold mb-2">Blocked ({blockedTasks.length})</h3>
          {blockedTasks.map((task: Task) => (
            <div key={task._id} className="bg-white p-2 rounded shadow-sm mb-2">
              <div>{task.title}</div>
              <div className="flex gap-1 mt-1">
                <button onClick={() => handleMoveTask(task._id, 'todo')} className="text-xs">→</button>
                <button onClick={() => handleDeleteTask(task._id)} className="text-xs text-red-500">×</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
