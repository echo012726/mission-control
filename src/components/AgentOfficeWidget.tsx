'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bot, MessageSquare, Clock, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react'

interface Agent {
  id: string
  status: 'running' | 'idle' | 'error'
  lastHeartbeat?: number
  currentTask?: string
  model?: string
  kind?: string
  key?: string
}

interface Room {
  id: string
  name: string
  icon: string
  agents: Agent[]
  x: number
  y: number
  width: number
  height: number
}

const ROOM_COLORS: Record<string, string> = {
  dev: '#3b82f6',
  research: '#8b5cf6', 
  meeting: '#10b981',
  entry: '#f59e0b',
  default: '#64748b'
}

const AGENT_AVATARS: Record<string, string> = {
  coder: '💻',
  researcher: '🔍',
  planner: '📋',
  executor: '⚡',
  reviewer: '✅',
  discord: '💬',
  cron: '⏰',
  main: '🎯',
  default: '🤖'
}

function getAgentEmoji(agent: Agent): string {
  const id = agent.id.toLowerCase()
  for (const [key, emoji] of Object.entries(AGENT_AVATARS)) {
    if (id.includes(key)) return emoji
  }
  return AGENT_AVATARS.default
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'running': return '#22c55e'  // green
    case 'idle': return '#eab308'     // yellow
    case 'error': return '#ef4444'    // red
    default: return '#64748b'        // gray
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'running': return <Loader2 className="w-3 h-3 animate-spin" />
    case 'idle': return <Clock className="w-3 h-3" />
    case 'error': return <AlertCircle className="w-3 h-3" />
    default: return null
  }
}

function AgentAvatar({ agent, onClick }: { agent: Agent; onClick: () => void }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const statusColor = getStatusColor(agent.status)
  const emoji = getAgentEmoji(agent)
  
  // Determine room based on agent type
  let roomType = 'default'
  const id = agent.id.toLowerCase()
  if (id.includes('coder') || id.includes('dev')) roomType = 'dev'
  else if (id.includes('research')) roomType = 'research'
  else if (id.includes('cron')) roomType = 'entry'
  else if (id.includes('discord') || id.includes('group')) roomType = 'meeting'
  
  return (
    <div 
      className="absolute cursor-pointer transition-transform hover:scale-110"
      style={{ 
        left: `${10 + Math.random() * 60}%`, 
        top: `${20 + Math.random() * 50}%`,
      }}
      onClick={onClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Agent circle with status */}
      <div 
        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 relative"
        style={{ 
          backgroundColor: 'white',
          borderColor: statusColor,
          boxShadow: `0 0 10px ${statusColor}40`
        }}
      >
        {emoji}
        
        {/* Status dot */}
        <div 
          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: statusColor }}
        >
          {getStatusIcon(agent.status)}
        </div>
      </div>
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap">
          <div className="font-semibold">{agent.currentTask || agent.kind || 'Agent'}</div>
          <div className="text-slate-400">{agent.status} • {agent.model}</div>
        </div>
      )}
    </div>
  )
}

function Room({ room, onAgentClick }: { room: Room; onAgentClick: (agent: Agent) => void }) {
  const roomColor = ROOM_COLORS[room.id] || ROOM_COLORS.default
  
  return (
    <div
      className="absolute rounded-xl border-2 overflow-hidden"
      style={{
        left: `${room.x}%`,
        top: `${room.y}%`,
        width: `${room.width}%`,
        height: `${room.height}%`,
        borderColor: roomColor,
        backgroundColor: `${roomColor}10`
      }}
    >
      {/* Room header */}
      <div 
        className="px-3 py-2 text-xs font-bold flex items-center gap-1"
        style={{ backgroundColor: `${roomColor}30`, color: roomColor }}
      >
        <span>{room.icon}</span>
        <span>{room.name}</span>
        <span className="ml-auto bg-white/20 px-2 rounded-full">
          {room.agents.length}
        </span>
      </div>
      
      {/* Room floor */}
      <div className="relative h-[calc(100%-32px)]">
        {room.agents.map((agent, i) => (
          <AgentAvatar 
            key={agent.id} 
            agent={agent} 
            onClick={() => onAgentClick(agent)}
          />
        ))}
      </div>
    </div>
  )
}

export default function AgentOfficeWidget() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents?token=marcus2026')
      if (res.ok) {
        const data = await res.json()
        setAgents(data)
      }
    } catch (e) {
      console.error('Failed to fetch agents:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAgents()
    const interval = setInterval(fetchAgents, 5000)
    return () => clearInterval(interval)
  }, [fetchAgents])

  // Group agents into rooms
  const rooms: Room[] = [
    {
      id: 'dev',
      name: 'Dev Room',
      icon: '💻',
      x: 2, y: 2, width: 46, height: 46,
      agents: agents.filter(a => {
        const id = a.id.toLowerCase()
        return id.includes('coder') || id.includes('dev') || id.includes('build')
      })
    },
    {
      id: 'research',
      name: 'Research Lab',
      icon: '🔬',
      x: 52, y: 2, width: 46, height: 46,
      agents: agents.filter(a => a.id.toLowerCase().includes('research'))
    },
    {
      id: 'meeting',
      name: 'Meeting Room',
      icon: '💬',
      x: 2, y: 52, width: 46, height: 46,
      agents: agents.filter(a => {
        const id = a.id.toLowerCase()
        return id.includes('discord') || id.includes('group') || id.includes('thread')
      })
    },
    {
      id: 'entry',
      name: 'Task Entry',
      icon: '📥',
      x: 52, y: 52, width: 46, height: 46,
      agents: agents.filter(a => {
        const id = a.id.toLowerCase()
        return id.includes('cron') || id.includes('main') || id.includes('heartbeat')
      })
    }
  ]

  const totalAgents = agents.length
  const running = agents.filter(a => a.status === 'running').length
  const idle = agents.filter(a => a.status === 'idle').length
  const errors = agents.filter(a => a.status === 'error').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Stats header */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4" />
          <span className="font-semibold">{totalAgents} Agents</span>
        </div>
        <div className="flex items-center gap-1 text-green-500">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span>{running} running</span>
        </div>
        <div className="flex items-center gap-1 text-yellow-500">
          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
          <span>{idle} idle</span>
        </div>
        {errors > 0 && (
          <div className="flex items-center gap-1 text-red-500">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span>{errors} error</span>
          </div>
        )}
      </div>

      {/* Office floor plan */}
      <div className="relative w-full aspect-[2/1] bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
        {/* Grid floor pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />
        
        {/* Rooms */}
        {rooms.map(room => (
          <Room 
            key={room.id} 
            room={room} 
            onAgentClick={setSelectedAgent}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Working</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span>Idle</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Error</span>
        </div>
      </div>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{getAgentEmoji(selectedAgent)}</div>
                <div>
                  <h3 className="font-bold text-lg">{selectedAgent.currentTask || 'Agent'}</h3>
                  <p className="text-sm text-slate-500">{selectedAgent.kind || 'General'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAgent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className="font-medium capitalize" style={{ color: getStatusColor(selectedAgent.status) }}>
                  {selectedAgent.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Model</span>
                <span className="font-medium">{selectedAgent.model || 'default'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Last Heartbeat</span>
                <span className="font-medium">
                  {selectedAgent.lastHeartbeat 
                    ? new Date(selectedAgent.lastHeartbeat).toLocaleTimeString()
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Agent ID</span>
                <span className="font-mono text-xs">{selectedAgent.id.split(':').pop()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
