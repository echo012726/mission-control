'use client'
import { useState, useEffect, useCallback } from 'react'
import { Play, Pause, Clock, Plus, X, Edit2, Save } from 'lucide-react'

interface TimeTrackerProps {
  taskId: string
  initialTimeSpent: number
  timerStarted?: string | null
  estimatedTime?: number | null
  compact?: boolean
  onTimeUpdate?: (newTime: number) => void
}

export default function TimeTracker({ 
  taskId, 
  initialTimeSpent, 
  timerStarted,
  estimatedTime,
  compact = false,
  onTimeUpdate
}: TimeTrackerProps) {
  const [running, setRunning] = useState(false)
  const [seconds, setSeconds] = useState(initialTimeSpent || 0)
  const [intervalId, setIntervalId] = useState<ReturnType<typeof setInterval> | null>(null)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualMinutes, setManualMinutes] = useState('')
  const [syncing, setSyncing] = useState(false)

  // Sync with parent when initial values change
  useEffect(() => {
    setSeconds(initialTimeSpent || 0)
  }, [taskId, initialTimeSpent])

  // Check if timer was started on another device/session
  useEffect(() => {
    if (timerStarted && !running) {
      const startTime = new Date(timerStarted).getTime()
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setSeconds((initialTimeSpent || 0) + elapsed)
      // Resume counting locally
      const id = setInterval(() => setSeconds(s => s + 1), 1000)
      setIntervalId(id)
      setRunning(true)
    }
  }, [timerStarted])

  const formatTime = useCallback((s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0) return `${h}h ${m}m`
    if (m > 0) return `${m}m ${sec}s`
    return `${sec}s`
  }, [])

  const formatTimeShort = useCallback((s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }, [])

  const toggleTimer = async () => {
    setSyncing(true)
    try {
      const action = running ? 'stop' : 'start'
      const res = await fetch('/api/tasks/time', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, action })
      })
      
      if (res.ok) {
        const data = await res.json()
        
        if (action === 'stop') {
          // Timer stopped - update with final time
          if (intervalId) clearInterval(intervalId)
          setIntervalId(null)
          setRunning(false)
          setSeconds(data.timeSpent)
          onTimeUpdate?.(data.timeSpent)
        } else {
          // Timer started
          setRunning(true)
          const id = setInterval(() => setSeconds(s => s + 1), 1000)
          setIntervalId(id)
        }
      }
    } catch (error) {
      console.error('Timer toggle error:', error)
      // Fallback to local-only timer
      if (running) {
        if (intervalId) clearInterval(intervalId)
        setIntervalId(null)
        setRunning(false)
        onTimeUpdate?.(seconds)
      } else {
        setRunning(true)
        const id = setInterval(() => setSeconds(s => s + 1), 1000)
        setIntervalId(id)
      }
    } finally {
      setSyncing(false)
    }
  }

  const addManualTime = async () => {
    const mins = parseInt(manualMinutes)
    if (isNaN(mins) || mins <= 0) return
    
    const additionalSeconds = mins * 60
    const newTotal = seconds + additionalSeconds
    
    try {
      const res = await fetch('/api/tasks/time', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          taskId, 
          action: 'add', 
          seconds: additionalSeconds 
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        setSeconds(data.timeSpent || newTotal)
        onTimeUpdate?.(data.timeSpent || newTotal)
      } else {
        // Local fallback
        setSeconds(newTotal)
        onTimeUpdate?.(newTotal)
      }
    } catch {
      setSeconds(newTotal)
      onTimeUpdate?.(newTotal)
    }
    
    setManualMinutes('')
    setShowManualEntry(false)
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={toggleTimer}
          disabled={syncing}
          className={`p-1.5 rounded-lg transition-colors ${
            running 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-green-500 hover:bg-green-600 text-white'
          } ${syncing ? 'opacity-50' : ''}`}
          title={running ? 'Stop timer' : 'Start timer'}
        >
          {running ? <Pause size={12} /> : <Play size={12} />}
        </button>
        <span className={`text-xs font-mono ${running ? 'text-red-600 font-semibold' : 'text-slate-600'}`}>
          {formatTime(seconds)}
        </span>
        {estimatedTime && estimatedTime > 0 && (
          <span className={`text-xs ${seconds > estimatedTime ? 'text-red-500' : 'text-slate-400'}`}>
            / {formatTimeShort(estimatedTime)}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTimer}
            disabled={syncing}
            className={`p-3 rounded-xl transition-all ${
              running 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30' 
                : 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30'
            } ${syncing ? 'opacity-50' : ''}`}
          >
            {running ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <div className="flex flex-col">
            <span className={`text-2xl font-mono font-bold ${running ? 'text-red-600' : 'text-slate-700'}`}>
              {formatTime(seconds)}
            </span>
            {running && <span className="text-xs text-red-500 animate-pulse">Recording...</span>}
          </div>
        </div>
        
        <div className="flex gap-1">
          <button
            onClick={() => setShowManualEntry(!showManualEntry)}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            title="Add time manually"
          >
            <Edit2 size={16} />
          </button>
        </div>
      </div>

      {/* Estimated time comparison */}
      {estimatedTime && estimatedTime > 0 && (
        <div className={`text-sm ${seconds > estimatedTime ? 'text-red-500' : 'text-slate-500'}`}>
          Estimated: {formatTime(estimatedTime)}
          {seconds > estimatedTime && (
            <span className="ml-2 font-medium">
              (+{formatTime(seconds - estimatedTime)} over)
            </span>
          )}
        </div>
      )}

      {/* Manual time entry */}
      {showManualEntry && (
        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
          <Plus size={14} className="text-slate-400" />
          <input
            type="number"
            value={manualMinutes}
            onChange={(e) => setManualMinutes(e.target.value)}
            placeholder="Minutes"
            className="w-20 px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-500"
            min="1"
          />
          <button
            onClick={addManualTime}
            disabled={!manualMinutes}
            className="p-1.5 rounded bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
          >
            <Save size={14} />
          </button>
          <button
            onClick={() => { setShowManualEntry(false); setManualMinutes('') }}
            className="p-1.5 rounded hover:bg-slate-200 text-slate-400"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
