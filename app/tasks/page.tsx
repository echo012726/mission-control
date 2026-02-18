'use client'
import { useState, useEffect } from 'react'

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || ''

interface Task {
  _id: string
  title: string
  status: 'todo' | 'in_progress' | 'done' | 'blocked'
  assigneeType: 'user' | 'agent'
  createdAt: number
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTask, setNewTask] = useState('')

  useEffect(() => {
    fetchTasks()
  }, [])

  async function fetchTasks() {
    setLoading(true)
    try {
      const res = await fetch(`${CONVEX_URL}/api/getTasks`, { method: 'POST', body: JSON.stringify({ args: {} }) })
      const data = await res.json()
      setTasks(data || [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function createTask() {
    if (!newTask.trim()) return
    try {
      await fetch(`${CONVEX_URL}/api/createTask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ args: { title: newTask, status: 'todo', assigneeType: 'user' } }),
      })
      setNewTask('')
      fetchTasks()
    } catch (e) {
      console.error(e)
    }
  }

  const todoTasks = tasks.filter(t => t.status === 'todo')
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress')
  const doneTasks = tasks.filter(t => t.status === 'done')
  const blockedTasks = tasks.filter(t => t.status === 'blocked')

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
            onKeyDown={(e) => e.key === 'Enter' && createTask()}
          />
          <button onClick={createTask} className="bg-blue-500 text-white px-4 py-1 rounded">Add</button>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          <div className="border rounded p-3">
            <h3 className="font-semibold mb-2">To Do ({todoTasks.length})</h3>
            {todoTasks.map(task => (
              <div key={task._id} className="bg-white p-2 rounded shadow-sm mb-2">{task.title}</div>
            ))}
          </div>
          <div className="border rounded p-3">
            <h3 className="font-semibold mb-2">In Progress ({inProgressTasks.length})</h3>
            {inProgressTasks.map(task => (
              <div key={task._id} className="bg-white p-2 rounded shadow-sm mb-2">{task.title}</div>
            ))}
          </div>
          <div className="border rounded p-3">
            <h3 className="font-semibold mb-2">Done ({doneTasks.length})</h3>
            {doneTasks.map(task => (
              <div key={task._id} className="bg-white p-2 rounded shadow-sm mb-2 line-through">{task.title}</div>
            ))}
          </div>
          <div className="border rounded p-3">
            <h3 className="font-semibold mb-2">Blocked ({blockedTasks.length})</h3>
            {blockedTasks.map(task => (
              <div key={task._id} className="bg-white p-2 rounded shadow-sm mb-2">{task.title}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
