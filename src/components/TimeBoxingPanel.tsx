'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Plus, Play, Clock, Pause, RotateCcw, Settings } from 'lucide-react'

interface TimeBlock {
  id: string
  title: string
  category: 'work' | 'meeting' | 'break' | 'personal'
  startTime: string // HH:mm format
  duration: number // minutes
  color: string
}

interface TimerState {
  isRunning: boolean
  mode: 'work' | 'break' | 'longBreak'
  timeRemaining: number // seconds
  sessionsCompleted: number
}

const CATEGORY_COLORS = {
  work: '#3b82f6',
  meeting: '#8b5cf6',
  break: '#10b981',
  personal: '#f59e0b'
}

const DEFAULT_WORK_TIME = 25 * 60
const DEFAULT_BREAK_TIME = 5 * 60
const DEFAULT_LONG_BREAK = 15 * 60
const SESSIONS_BEFORE_LONG_BREAK = 4

export default function TimeBoxingPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    mode: 'work',
    timeRemaining: DEFAULT_WORK_TIME,
    sessionsCompleted: 0
  })

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('timeboxing-blocks')
    if (saved) setTimeBlocks(JSON.parse(saved))
    
    const savedTimer = localStorage.getItem('timeboxing-timer')
    if (savedTimer) setTimerState(JSON.parse(savedTimer))
  }, [])

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('timeboxing-blocks', JSON.stringify(timeBlocks))
  }, [timeBlocks])

  useEffect(() => {
    localStorage.setItem('timeboxing-timer', JSON.stringify(timerState))
  }, [timerState])

  // Timer countdown
  useEffect(() => {
    if (!timerState.isRunning) return
    
    const interval = setInterval(() => {
      setTimerState(prev => {
        if (prev.timeRemaining <= 0) {
          // Timer complete - switch mode
          if (prev.mode === 'work') {
            const newSessions = prev.sessionsCompleted + 1
            const isLongBreak = newSessions % SESSIONS_BEFORE_LONG_BREAK === 0
            return {
              ...prev,
              mode: isLongBreak ? 'longBreak' : 'break',
              timeRemaining: isLongBreak ? DEFAULT_LONG_BREAK : DEFAULT_BREAK_TIME,
              isRunning: true,
              sessionsCompleted: newSessions
            }
          } else {
            return {
              ...prev,
              mode: 'work',
              timeRemaining: DEFAULT_WORK_TIME,
              isRunning: true
            }
          }
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timerState.isRunning])

  const toggleTimer = () => {
    setTimerState(prev => ({ ...prev, isRunning: !prev.isRunning }))
  }

  const resetTimer = () => {
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      timeRemaining: prev.mode === 'work' ? DEFAULT_WORK_TIME : 
                     prev.mode === 'longBreak' ? DEFAULT_LONG_BREAK : DEFAULT_BREAK_TIME
    }))
  }

  const addTimeBlock = (block: Omit<TimeBlock, 'id'>) => {
    const newBlock: TimeBlock = { ...block, id: Date.now().toString() }
    setTimeBlocks(prev => [...prev, newBlock])
  }

  const removeBlock = (id: string) => {
    setTimeBlocks(prev => prev.filter(b => b.id !== id))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getCurrentTime = () => {
    const now = new Date()
    return now.toTimeString().slice(0, 5)
  }

  const getProgress = () => {
    const total = timerState.mode === 'work' ? DEFAULT_WORK_TIME :
                  timerState.mode === 'longBreak' ? DEFAULT_LONG_BREAK : DEFAULT_BREAK_TIME
    return ((total - timerState.timeRemaining) / total) * 100
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
      >
        <Clock className="w-4 h-4" />
        <span className="text-sm font-medium">Time Boxing</span>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Panel */}
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl h-full overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold dark:text-white">Time Boxing</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <X className="w-5 h-5 dark:text-gray-300" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Timer Section */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                timerState.mode === 'work' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                timerState.mode === 'longBreak' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' :
                'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              }`}>
                {timerState.mode === 'work' ? 'Focus Time' : 
                 timerState.mode === 'longBreak' ? 'Long Break' : 'Short Break'}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Session {timerState.sessionsCompleted + 1}
              </span>
            </div>

            {/* Timer Circle */}
            <div className="relative w-48 h-48 mx-auto mb-4">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={553}
                  strokeDashoffset={553 - (553 * getProgress()) / 100}
                  className={timerState.mode === 'work' ? 'text-blue-500' : 'text-green-500'}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold font-mono dark:text-white">
                  {formatTime(timerState.timeRemaining)}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-3">
              <button
                onClick={toggleTimer}
                className={`p-4 rounded-full ${
                  timerState.isRunning 
                    ? 'bg-yellow-500 hover:bg-yellow-600' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white shadow-lg transition-all`}
              >
                {timerState.isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
              <button
                onClick={resetTimer}
                className="p-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full shadow-lg transition-all"
              >
                <RotateCcw className="w-6 h-6 dark:text-gray-300" />
              </button>
            </div>
          </div>

          {/* Time Blocks Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold dark:text-white">Today&apos;s Schedule</h3>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Block
              </button>
            </div>

            {timeBlocks.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No time blocks scheduled</p>
                <p className="text-sm mt-1">Add blocks to plan your day</p>
              </div>
            ) : (
              <div className="space-y-2">
                {timeBlocks
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map(block => (
                    <div
                      key={block.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div 
                        className="w-1 h-12 rounded-full"
                        style={{ backgroundColor: block.color }}
                      />
                      <div className="flex-1">
                        <p className="font-medium dark:text-white">{block.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {block.startTime} • {block.duration} min
                        </p>
                      </div>
                      <button
                        onClick={() => removeBlock(block.id)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Current Time */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            Current time: {getCurrentTime()}
          </div>
        </div>

        {/* Create Block Modal */}
        {showCreateModal && (
          <CreateBlockModal
            onClose={() => setShowCreateModal(false)}
            onAdd={addTimeBlock}
          />
        )}
      </div>
    </div>
  )
}

function CreateBlockModal({ 
  onClose, 
  onAdd 
}: { 
  onClose: () => void
  onAdd: (block: Omit<TimeBlock, 'id'>) => void 
}) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<TimeBlock['category']>('work')
  const [startTime, setStartTime] = useState('09:00')
  const [duration, setDuration] = useState(60)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    
    onAdd({
      title,
      category,
      startTime,
      duration,
      color: CATEGORY_COLORS[category]
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-lg font-bold mb-4 dark:text-white">Add Time Block</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Meeting, Focus time, etc."
              className="w-full px-3 py-2 border dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as TimeBlock['category'])}
              className="w-full px-3 py-2 border dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white"
            >
              <option value="work">Work</option>
              <option value="meeting">Meeting</option>
              <option value="break">Break</option>
              <option value="personal">Personal</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Duration (min)</label>
              <input
                type="number"
                value={duration}
                onChange={e => setDuration(parseInt(e.target.value) || 30)}
                min="5"
                max="480"
                className="w-full px-3 py-2 border dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-border-gray-7002 border dark: rounded-lg dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Add Block
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
