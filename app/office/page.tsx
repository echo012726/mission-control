'use client'
import { useState, useEffect } from 'react'

interface AgentStatus {
  id: string
  name: string
  role: string
  status: 'online' | 'busy' | 'away' | 'offline'
  currentTask: string
  lastActive: number | null
}

export default function OfficePage() {
  const [agents, setAgents] = useState<AgentStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadAgents()
  }, [])

  async function loadAgents() {
    try {
      const res = await fetch('/api/agents')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setAgents(data)
    } catch (err) {
      setError('Could not load agent status (API not available in dev)')
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'online':
      case 'busy':
        return 'bg-green-500'
      case 'away':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-400'
    }
  }

  function getTimeAgo(ts: number | null) {
    if (!ts) return 'never'
    const mins = Math.floor((Date.now() - ts) / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-4">Digital Office</h2>
        <p className="text-gray-500">Loading agent status...</p>
      </div>
    )
  }

  const onlineCount = agents.filter(a => a.status === 'online' || a.status === 'busy').length
  const busyCount = agents.filter(a => a.status === 'busy').length
  const awayCount = agents.filter(a => a.status === 'away').length
  const offlineCount = agents.filter(a => a.status === 'offline').length

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Digital Office</h2>
      <p className="text-sm text-muted-foreground mb-6">Real-time agent status from OpenClaw</p>

      {error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded mb-4">
          <p className="text-sm text-yellow-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-xl p-4 text-white">
          <div className="text-3xl font-bold">{onlineCount}</div>
          <div className="text-sm opacity-80">Online</div>
        </div>
        <div className="bg-gradient-to-br from-red-400 to-red-600 rounded-xl p-4 text-white">
          <div className="text-3xl font-bold">{busyCount}</div>
          <div className="text-sm opacity-80">Busy</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl p-4 text-white">
          <div className="text-3xl font-bold">{awayCount}</div>
          <div className="text-sm opacity-80">Away</div>
        </div>
        <div className="bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl p-4 text-white">
          <div className="text-3xl font-bold">{offlineCount}</div>
          <div className="text-sm opacity-80">Offline</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {agents.map(agent => (
          <div
            key={agent.id}
            className={`border rounded-xl p-4 text-center transition-all ${
              agent.status === 'offline' ? 'opacity-50 grayscale' : ''
            }`}
          >
            <div className="text-4xl mb-2">
              {agent.id === 'main' ? '🦞' : 
               agent.id === 'polybot' ? '📈' :
               agent.id === 'coder' ? '👨‍💻' :
               agent.id === 'researcher' ? '🔍' : '⚡'}
            </div>
            <div className="font-semibold">{agent.name}</div>
            <div className="text-xs text-gray-500">{agent.role}</div>
            <div className="text-xs text-blue-600 mt-1 truncate">{agent.currentTask}</div>
            <div className="flex items-center justify-center gap-1 mt-2">
              <span className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`}></span>
              <span className="text-xs capitalize">{agent.status}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">{getTimeAgo(agent.lastActive)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
