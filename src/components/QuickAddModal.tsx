'use client'
import { useState, useEffect } from 'react'
import { X, Plus, Clock, Focus } from 'lucide-react'

export default function QuickAddModal({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: (title: string, priority: string) => void }) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')
  const [syntaxHint, setSyntaxHint] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setTitle('')
      setPriority('medium')
      setSyntaxHint(null)
    }
  }, [isOpen])

  // Detect Quick Add syntax
  useEffect(() => {
    const lower = title.toLowerCase().trim()
    
    if (lower.startsWith('timer:')) {
      const match = lower.match(/timer:\s*(?:(\w+)\s*\|?\s*)?(\d+)?/)
      if (match) {
        const [, type, mins] = match
        const minutes = mins ? parseInt(mins) : 25
        const workType = type || 'work'
        setSyntaxHint(`🎯 Starting ${minutes} min ${workType} timer`)
      }
    } else if (lower.startsWith('block:')) {
      const match = lower.match(/block:\s*(.+?)\s*\|\s*(\d{1,2}(?::\d{2})?(?:am|pm)?)\s*\|\s*(\d+)(?:min|hr|m)?/)
      if (match) {
        const [, blockName, time, duration] = match
        setSyntaxHint(`📅 Scheduling "${blockName.trim()}" at ${time} for ${duration} min`)
      } else {
        setSyntaxHint(`📅 Creating time block`)
      }
    } else if (lower.startsWith('focus:')) {
      const focusName = title.slice(6).trim()
      setSyntaxHint(`🎯 Starting focus session for: "${focusName || 'current task'}"`)
    } else {
      setSyntaxHint(null)
    }
  }, [title])

  // Handle special syntax
  const handleSpecialSyntax = (): boolean => {
    const lower = title.toLowerCase().trim()
    
    // Timer syntax: timer: 25 or timer: work | 45
    if (lower.startsWith('timer:')) {
      const match = lower.match(/timer:\s*(?:(\w+)\s*\|?\s*)?(\d+)?/)
      const [, type, mins] = match || []
      const minutes = mins ? parseInt(mins) : 25
      const workType = type || 'work'
      
      // Save to localStorage for TimeBoxingPanel
      const timerState = {
        isRunning: true,
        mode: workType === 'break' ? 'break' : 'work',
        timeRemaining: minutes * 60,
        sessionsCompleted: 0
      }
      localStorage.setItem('timeboxing-timer', JSON.stringify(timerState))
      return true
    }
    
    // Block syntax: block: Meeting | 2pm | 1hr
    if (lower.startsWith('block:')) {
      const parts = title.slice(6).split('|').map(s => s.trim())
      const blockName = parts[0] || 'Time Block'
      const startTime = parts[1] || '09:00'
      const durationStr = parts[2] || '60'
      const duration = parseInt(durationStr.replace(/[^\d]/g, '')) || 60
      
      // Convert time to HH:mm format
      let formattedTime = startTime
      if (startTime.match(/^\d{1,2}(?:am|pm)$/i)) {
        const hour = parseInt(startTime)
        const isPM = startTime.toLowerCase().includes('pm')
        const formattedHour = isPM && hour !== 12 ? hour + 12 : (!isPM && hour === 12 ? 0 : hour)
        formattedTime = `${formattedHour.toString().padStart(2, '0')}:00`
      }
      
      const block = {
        id: Date.now().toString(),
        title: blockName,
        category: 'work' as const,
        startTime: formattedTime,
        duration,
        color: '#3b82f6'
      }
      
      const existing = JSON.parse(localStorage.getItem('timeboxing-blocks') || '[]')
      localStorage.setItem('timeboxing-blocks', JSON.stringify([...existing, block]))
      return true
    }
    
    // Focus syntax: focus: Task Name
    if (lower.startsWith('focus:')) {
      const focusName = title.slice(6).trim() || 'Focus Session'
      
      const timerState = {
        isRunning: true,
        mode: 'work' as const,
        timeRemaining: 25 * 60,
        sessionsCompleted: 0
      }
      localStorage.setItem('timeboxing-timer', JSON.stringify(timerState))
      
      // Also create a block
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, '0')
      const mins = now.getMinutes().toString().padStart(2, '0')
      
      const block = {
        id: Date.now().toString(),
        title: focusName,
        category: 'work' as const,
        startTime: `${hours}:${mins}`,
        duration: 25,
        color: '#3b82f6'
      }
      
      const existing = JSON.parse(localStorage.getItem('timeboxing-blocks') || '[]')
      localStorage.setItem('timeboxing-blocks', JSON.stringify([...existing, block]))
      return true
    }
    
    return false
  }

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      // Check for special syntax first
      if (handleSpecialSyntax()) {
        setTitle('')
        onClose()
        return
      }
      
      onAdd(title.trim(), priority)
      setTitle('')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2 dark:text-white">
            <Plus className="w-5 h-5" /> Quick Add Task
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What needs to be done? Or try: timer: 25, block: Meeting | 2pm | 1hr, focus: Task"
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          />
          
          {syntaxHint && (
            <div className="mb-4 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-lg flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {syntaxHint}
            </div>
          )}
          
          {!syntaxHint && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-500">Priority:</span>
              {['low', 'medium', 'high'].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-3 py-1 rounded-full text-sm capitalize ${
                    priority === p 
                      ? p === 'high' ? 'bg-red-500 text-white' : p === 'medium' ? 'bg-yellow-500 text-white' : 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
          
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            {syntaxHint ? 'Start Timer/Block' : 'Add Task'}
          </button>
        </form>
        
        <div className="mt-3 space-y-1">
          <p className="text-xs text-gray-400 text-center">Try these shortcuts:</p>
          <div className="flex flex-wrap gap-1 justify-center text-xs text-gray-500">
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">timer: 25</span>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">block: Meeting | 2pm | 1hr</span>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">focus: Write report</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">Press Esc to close</p>
      </div>
    </div>
  )
}
