'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Circle } from 'lucide-react'

interface Agent {
  id: string
  status: string
  lastHeartbeat?: number
  currentTask?: string
  error?: string
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    idle: 'bg-gray-500',
    running: 'bg-green-500',
    error: 'bg-red-500',
    unknown: 'bg-yellow-500',
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${colors[status] || colors.unknown}`}>
      <Circle size={8} fill="currentColor" />
      {status}
    </span>
  )
}

export default function AgentStatusPanel() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(false)

  const fetchAgents = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/agents')
      if (res.ok) {
        const data = await res.json()
        setAgents(data)
      }
    } catch (e) {
      console.error('Failed to fetch agents', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
    const interval = setInterval(fetchAgents, 10000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return 'Never'
    const date = new Date(timestamp)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return date.toLocaleTimeString()
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h2 className="font-semibold text-white">Agent Status</h2>
        <button
          onClick={fetchAgents}
          disabled={loading}
          className="text-gray-400 hover:text-white disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="p-4">
        {agents.length === 0 ? (
          <p className="text-gray-500 text-sm">No agents found</p>
        ) : (
          <div className="space-y-3">
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-start justify-between">
                <div>
                  <p className="text-white text-sm font-medium">{agent.id}</p>
                  <StatusBadge status={agent.status} />
                  {agent.currentTask && (
                    <p className="text-gray-400 text-xs mt-1">Task: {agent.currentTask}</p>
                  )}
                  {agent.error && (
                    <p className="text-red-400 text-xs mt-1">Error: {agent.error}</p>
                  )}
                </div>
                <span className="text-gray-500 text-xs">
                  {formatTime(agent.lastHeartbeat)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
