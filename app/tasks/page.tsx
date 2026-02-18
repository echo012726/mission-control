'use client'
import { useState, useEffect } from 'react'

interface Task {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'done' | 'blocked'
  assigneeType: 'user' | 'agent'
  createdAt: number
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('mc_tasks')
    if (saved) setTasks(JSON.parse(saved))
  }, [])

  function saveTasks(newTasks: Task[]) {
    setTasks(newTasks)
    localStorage.setItem('mc_tasks', JSON.stringify(newTasks))
  }

  function createTask() {
    if (!newTask.trim()) return
    const task: Task = {
      id: Date.now().toString(),
      title: newTask,
      status: 'todo',
      assigneeType: 'user',
      createdAt: Date.now()
    }
    saveTasks([...tasks, task])
    setNewTask('')
  }

  function deleteTask(id: string) {
    saveTasks(tasks.filter(t => t.id !== id))
  }

  function moveTask(id: string, status: Task['status']) {
    saveTasks(tasks.map(t => t.id === id ? { ...t, status } : t))
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

      <div className="grid grid-cols-4 gap-4">
        <div className="border rounded p-3">
          <h3 className="font-semibold mb-2">To Do ({todoTasks.length})</h3>
          {todoTasks.map(task => (
            <div key={task.id} className="bg-white p-2 rounded shadow-sm mb-2">
              <div>{task.title}</div>
              <div className="flex gap-1 mt-1">
                <button onClick={() => moveTask(task.id, 'in_progress')} className="text-xs text-blue-500">→</button>
                <button onClick={() => deleteTask(task.id)} className="text-xs text-red-500">×</button>
              </div>
            </div>
          ))}
        </div>
        <div className="border rounded p-3">
          <h3 className="font-semibold mb-2">In Progress ({inProgressTasks.length})</h3>
          {inProgressTasks.map(task => (
            <div key={task.id} className="bg-white p-2 rounded shadow-sm mb-2">
              <div>{task.title}</div>
              <div className="flex gap-1 mt-1">
                <button onClick={() => moveTask(task.id, 'todo')} className="text-xs">←</button>
                <button onClick={() => moveTask(task.id, 'done')} className="text-xs text-blue-500">→</button>
                <button onClick={() => deleteTask(task.id)} className="text-xs text-red-500">×</button>
              </div>
            </div>
          ))}
        </div>
        <div className="border rounded p-3">
          <h3 className="font-semibold mb-2">Done ({doneTasks.length})</h3>
          {doneTasks.map(task => (
            <div key={task.id} className="bg-white p-2 rounded shadow-sm mb-2 line-through opacity-50">
              <div>{task.title}</div>
              <div className="flex gap-1 mt-1">
                <button onClick={() => moveTask(task.id, 'in_progress')} className="text-xs">←</button>
                <button onClick={() => deleteTask(task.id)} className="text-xs text-red-500">×</button>
              </div>
            </div>
          ))}
        </div>
        <div className="border rounded p-3">
          <h3 className="font-semibold mb-2">Blocked ({blockedTasks.length})</h3>
          {blockedTasks.map(task => (
            <div key={task.id} className="bg-white p-2 rounded shadow-sm mb-2">
              <div>{task.title}</div>
              <div className="flex gap-1 mt-1">
                <button onClick={() => moveTask(task.id, 'todo')} className="text-xs">→</button>
                <button onClick={() => deleteTask(task.id)} className="text-xs text-red-500">×</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
