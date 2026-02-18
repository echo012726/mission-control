'use client'
import { useState, useEffect } from 'react'

interface AgentStatus {
  id: string
  name: string
  avatar: string
  status: 'online' | 'busy' | 'away' | 'offline'
  currentTask: string
  lastUpdate: number
}

const OFFICE_AGENTS: AgentStatus[] = [
  { id: 'echo', name: 'Echo', avatar: '🦞', status: 'online', currentTask: 'Orchestrating', lastUpdate: Date.now() },
  { id: 'coder', name: 'Coder', avatar: '👨‍💻', status: 'busy', currentTask: 'Writing code', lastUpdate: Date.now() - 60000 },
  { id: 'researcher', name: 'Researcher', avatar: '🔍', status: 'away', currentTask: 'Idle', lastUpdate: Date.now() - 300000 },
  { id: 'executor', name: 'Executor', avatar: '⚡', status: 'online', currentTask: 'Waiting', lastUpdate: Date.now() - 120000 },
  { id: 'polybot', name: 'PolyBot', avatar: '📈', status: 'busy', currentTask: 'Scanning markets', lastUpdate: Date.now() },
  { id: 'trader', name: 'Trading Strategist', avatar: '🎯', status: 'away', currentTask: 'Idle', lastUpdate: Date.now() - 1800000 },
  { id: 'reviewer', name: 'Reviewer', avatar: '👀', status: 'offline', currentTask: 'Idle', lastUpdate: Date.now() - 7200000 },
  { id: 'debugger', name: 'Debugger', avatar: '🐛', status: 'offline', currentTask: 'Idle', lastUpdate: Date.now() - 86400000 },
]

export default function OfficePage() {
  const [agents, setAgents] = useState<AgentStatus[]>(OFFICE_AGENTS)

  function getStatusColor(status: string) {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'busy': return 'bg-red-500'
      case 'away': return 'bg-yellow-500'
      default: return 'bg-gray-400'
    }
  }

  function getTimeAgo(ts: number) {
    const secs = Math.floor((Date.now() - ts) / 1000)
    if (secs < 60) return 'just now'
    const mins = Math.floor(secs / 60)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  const onlineCount = agents.filter(a => a.status === 'online').length
  const busyCount = agents.filter(a => a.status === 'busy').length

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Digital Office</h2>
      <p className="text-sm text-muted-foreground mb-6">Visual overview of your agent team</p>

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
          <div className="text-3xl font-bold">{agents.filter(a => a.status === 'away').length}</div>
          <div className="text-sm opacity-80">Away</div>
        </div>
        <div className="bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl p-4 text-white">
          <div className="text-3xl font-bold">{agents.filter(a => a.status === 'offline').length}</div>
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
            <div className="text-4xl mb-2">{agent.avatar}</div>
            <div className="font-semibold">{agent.name}</div>
            <div className="text-xs text-gray-500">{agent.currentTask}</div>
            <div className="flex items-center justify-center gap-1 mt-2">
              <span className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`}></span>
              <span className="text-xs capitalize">{agent.status}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">{getTimeAgo(agent.lastUpdate)}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <h3 className="font-semibold mb-2">💡 Tip</h3>
        <p className="text-sm text-blue-700">
          This is a demo visualization. Connect to OpenClaw's actual agent status for real-time updates.
        </p>
      </div>
    </div>
  )
}
