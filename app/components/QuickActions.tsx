'use client'
import { useState } from 'react'

interface QuickAction {
  id: string
  label: string
  icon: string
  action: string
}

const ACTIONS: QuickAction[] = [
  { id: 'new-task', label: 'New Task', icon: '📝', action: 'navigate:/tasks' },
  { id: 'new-content', label: 'New Content', icon: '📺', action: 'navigate:/content' },
  { id: 'calendar', label: 'Calendar', icon: '📅', action: 'navigate:/calendar' },
  { id: 'memory', label: 'Search Memory', icon: '🔍', action: 'navigate:/memory' },
  { id: 'refresh-agents', label: 'Refresh Agents', icon: '🔄', action: 'refresh' },
  { id: 'sync', label: 'Sync All', icon: '🔗', action: 'sync' },
]

export default function QuickActions() {
  const [running, setRunning] = useState<string | null>(null)

  function handleAction(action: QuickAction) {
    if (action.action.startsWith('navigate:')) {
      const path = action.action.replace('navigate:', '/')
      window.location.href = path
      return
    }
    
    if (action.action === 'refresh') {
      setRunning(action.id)
      setTimeout(() => setRunning(null), 1000)
      return
    }
    
    if (action.action === 'sync') {
      setRunning(action.id)
      setTimeout(() => setRunning(null), 1500)
      return
    }
  }

  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-semibold mb-3">Quick Actions</h3>
      
      <div className="grid grid-cols-3 gap-2">
        {ACTIONS.map(action => (
          <button
            key={action.id}
            onClick={() => handleAction(action)}
            disabled={!!running}
            className={`p-2 rounded-lg border hover:bg-gray-50 transition-colors text-center ${
              running === action.id ? 'bg-blue-50 border-blue-200' : ''
            }`}
          >
            <div className="text-lg mb-1">{action.icon}</div>
            <div className="text-xs">{action.label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
