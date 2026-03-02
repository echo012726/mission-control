'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Circle, Play, Square, Loader2, Wifi, WifiOff, Bot, Activity, AlertTriangle } from 'lucide-react'
import { Agent } from '@/types'
import { useToast } from '@/components/Toast'
import { useSSE } from '@/lib/useSSE'

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string; dot: string }> = {
    idle: { bg: 'bg-gray-500/20', text: 'text-gray-400', dot: 'bg-gray-400' },
    running: { bg: 'bg-green-500/20', text: 'text-green-400', dot: 'bg-green-400' },
    error: { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-400' },
    unknown: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  }

  const color = colors[status] || colors.unknown

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${color.bg} ${color.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${color.dot} ${status === 'running' ? 'animate-pulse' : ''}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function AgentCardSkeleton() {
  return (
    <div className="flex items-start justify-between p-3 rounded-lg">
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-700/50 rounded w-32 skeleton" />
        <div className="h-3 bg-gray-700/30 rounded w-20 skeleton" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="h-3 bg-gray-700/30 rounded w-16 skeleton" />
        <div className="w-8 h-8 bg-gray-700/30 rounded-lg skeleton" />
      </div>
    </div>
  )
}

interface AgentStatusPanelProps {
  onAgentClick?: (agentId: string) => void
}

export default function AgentStatusPanel({ onAgentClick }: AgentStatusPanelProps) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [provisioning, setProvisioning] = useState<string | null>(null)
  const { showToast } = useToast()

  const fetchAgents = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  // Real-time updates via SSE with connection status
  const { connected } = useSSE({
    onAgentUpdate: () => {
      fetchAgents()
    },
  })

  const handleProvision = async (agentId: string, action: 'start' | 'stop') => {
    setProvisioning(agentId)
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, action }),
      })
      if (res.ok) {
        showToast(`Agent ${action === 'start' ? 'started' : 'stopped'} successfully`, 'success')
        fetchAgents()
      } else {
        showToast(`Failed to ${action} agent`, 'error')
      }
    } catch (e) {
      console.error(`Failed to ${action} agent`, e)
      showToast(`Failed to ${action} agent`, 'error')
    } finally {
      setProvisioning(null)
    }
  }

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return 'Never'
    const date = new Date(timestamp)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getAgentIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity size={16} className="text-green-400" />
      case 'error':
        return <AlertTriangle size={16} className="text-red-400" />
      default:
        return <Bot size={16} className="text-gray-400" />
    }
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Bot size={18} className="text-blue-400" />
          </div>
          <h2 className="font-semibold text-white">Agents</h2>
          <div className="flex items-center gap-1.5">
            {connected ? (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <Wifi size={12} />
                <span className="hidden sm:inline">Live</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <WifiOff size={12} />
                <span className="hidden sm:inline">Offline</span>
              </span>
            )}
          </div>
        </div>
        <button
          onClick={fetchAgents}
          disabled={loading}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all disabled:opacity-50"
          title="Refresh agents"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Content */}
      <div className="p-3">
        {loading ? (
          <div className="space-y-2">
            <AgentCardSkeleton />
            <AgentCardSkeleton />
          </div>
        ) : agents.length === 0 ? (
          <div className="empty-state py-6">
            <div className="relative">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-600">
                <rect x="8" y="6" width="32" height="36" rx="6" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="24" cy="18" r="5" stroke="currentColor" strokeWidth="2"/>
                <path d="M16 30H32" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M16 36H26" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="18" cy="10" r="1.5" fill="currentColor"/>
                <circle cx="24" cy="10" r="1.5" fill="currentColor"/>
                <circle cx="30" cy="10" r="1.5" fill="currentColor"/>
              </svg>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500/30 rounded-full animate-pulse"/>
            </div>
            <p className="text-gray-400 text-sm mt-3">No agents found</p>
            <p className="text-gray-600 text-xs mt-1">Agents will appear here when connected</p>
          </div>
        ) : (
          <div className="space-y-2">
            {agents.map((agent) => (
              <div 
                key={agent.id} 
                className={`group flex items-start gap-3 p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/60 transition-all ${
                  onAgentClick ? 'cursor-pointer' : ''
                }`}
                onClick={() => onAgentClick?.(agent.id)}
              >
                <div className="p-2 rounded-lg bg-gray-700/50 group-hover:bg-gray-700 transition-colors">
                  {getAgentIcon(agent.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{agent.id}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <StatusBadge status={agent.status} />
                  </div>
                  {agent.currentTask && (
                    <p className="text-gray-500 text-xs mt-1.5 truncate flex items-center gap-1">
                      <Activity size={10} />
                      {agent.currentTask}
                    </p>
                  )}
                  {agent.error && (
                    <p className="text-red-400/80 text-xs mt-1 truncate flex items-center gap-1">
                      <AlertTriangle size={10} />
                      {agent.error}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-gray-500 text-xs">
                    {formatTime(agent.lastHeartbeat)}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {agent.status === 'idle' || agent.status === 'error' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleProvision(agent.id, 'start')
                        }}
                        disabled={provisioning === agent.id}
                        className="p-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors disabled:opacity-50"
                        title="Start agent"
                      >
                        {provisioning === agent.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Play size={14} />
                        )}
                      </button>
                    ) : agent.status === 'running' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleProvision(agent.id, 'stop')
                        }}
                        disabled={provisioning === agent.id}
                        className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                        title="Stop agent"
                      >
                        {provisioning === agent.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Square size={14} />
                        )}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
