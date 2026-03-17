'use client'

import { useState, useEffect } from 'react'
import { Target, CheckCircle2, Circle, Settings, Plus, X } from 'lucide-react'

interface DailyGoal {
  target: number
  completed: number
}

export default function DailyGoalsWidget() {
  const [goal, setGoal] = useState<number>(5)
  const [completed, setCompleted] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [tempGoal, setTempGoal] = useState<number>(5)

  useEffect(() => {
    // Load goal from localStorage
    const savedGoal = localStorage.getItem('dailyGoal')
    if (savedGoal) {
      setGoal(parseInt(savedGoal, 10))
      setTempGoal(parseInt(savedGoal, 10))
    }

    // Fetch today's completed tasks
    const fetchTodayTasks = async () => {
      try {
        const today = new Date()
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString()
        
        const res = await fetch(`/api/tasks?token=mc_dev_token_2024&status=done&from=${startOfDay}&to=${endOfDay}`)
        if (res.ok) {
          const data = await res.json()
          // Filter to only tasks completed today (not just marked done)
          const tasks = Array.isArray(data) ? data : data.tasks || []
          setCompleted(tasks.length)
        }
      } catch (e) {
        console.error('Failed to fetch today tasks', e)
      } finally {
        setLoading(false)
      }
    }

    fetchTodayTasks()
  }, [])

  const saveGoal = () => {
    if (tempGoal > 0 && tempGoal <= 100) {
      setGoal(tempGoal)
      localStorage.setItem('dailyGoal', tempGoal.toString())
      setSettingsOpen(false)
    }
  }

  const progress = Math.min((completed / goal) * 100, 100)
  const isComplete = completed >= goal

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-slate-200 dark:border-gray-700">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-slate-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-20 bg-slate-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-slate-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${isComplete ? 'bg-green-500/10' : 'bg-blue-500/10'}`}>
            <Target className={`w-5 h-5 ${isComplete ? 'text-green-500' : 'text-blue-500'}`} />
          </div>
          <h3 className="font-semibold text-slate-800 dark:text-gray-100">Daily Goal</h3>
        </div>
        <button
          onClick={() => {
            setTempGoal(goal)
            setSettingsOpen(!settingsOpen)
          }}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400"
          title="Set daily goal"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Settings Popup */}
      {settingsOpen && (
        <div className="mb-4 p-3 bg-slate-50 dark:bg-gray-700 rounded-lg">
          <label className="text-sm text-slate-600 dark:text-gray-300 block mb-2">
            Daily task target:
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTempGoal(Math.max(1, tempGoal - 1))}
              className="p-1 rounded bg-slate-200 dark:bg-gray-600 hover:bg-slate-300 dark:hover:bg-gray-500"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              min="1"
              max="100"
              value={tempGoal}
              onChange={(e) => setTempGoal(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              className="w-16 px-2 py-1 text-center border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100"
            />
            <button
              onClick={() => setTempGoal(Math.min(100, tempGoal + 1))}
              className="p-1 rounded bg-slate-200 dark:bg-gray-600 hover:bg-slate-300 dark:hover:bg-gray-500"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={saveGoal}
              className="ml-2 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Main Progress Circle */}
      <div className="flex flex-col items-center mb-4">
        <div className="relative w-28 h-28">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="56"
              cy="56"
              r="48"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-slate-100 dark:text-gray-700"
            />
            <circle
              cx="56"
              cy="56"
              r="48"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              className={`${isComplete ? 'text-green-500' : 'text-blue-500'}`}
              strokeDasharray={`${progress * 3.01} 301`}
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isComplete ? (
              <CheckCircle2 className="w-8 h-8 text-green-500 mb-1" />
            ) : (
              <Circle className="w-8 h-8 text-blue-500 mb-1" />
            )}
            <span className="text-2xl font-bold text-slate-800 dark:text-gray-100">
              {completed}
            </span>
            <span className="text-xs text-slate-500 dark:text-gray-400">
              / {goal}
            </span>
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-gray-400 mt-2">
          {isComplete ? (
            <span className="text-green-600 dark:text-green-400 font-medium">Goal achieved! 🎉</span>
          ) : (
            <span>{goal - completed} more to reach your goal</span>
          )}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="h-3 bg-slate-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              isComplete 
                ? 'bg-gradient-to-r from-green-400 to-green-500' 
                : 'bg-gradient-to-r from-blue-400 to-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 dark:text-gray-400">
          <span>0</span>
          <span>{Math.round(progress)}%</span>
          <span>{goal}</span>
        </div>
      </div>
    </div>
  )
}

function Minus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14" />
    </svg>
  )
}
