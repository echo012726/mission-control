'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Circle, Play, Square, Loader2, Wifi, WifiOff } from 'lucide-react'
import { Agent } from '@/types'
import { useToast } from '@/components/Toast'
import { useSSE } from '@/lib/useSSE'

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
  const [loading, setLoading] = useState(true)
  const [provisioning, setProvisioning] = useState<string | null>(null)
  const { showToast } = useToast()

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
      showToast('Failed to load agents', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
  }, [])

  // Real-time updates via SSE
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
        showToast(`Agent ${action}ed`, 'success')
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
    return date.toLocaleTimeString()
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-white">Agent Status</h2>
          {connected ? (
            <span title="Real-time connected"><Wifi size={14} className="text-green-500" /></span>
          ) : (
            <span title="Connecting..."><WifiOff size={14} className="text-gray-500" /></span>
          )}
        </div>
        <button
          onClick={fetchAgents}
          disabled={loading}
          className="text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="animate-spin text-blue-500" size={24} />
          </div>
        ) : agents.length === 0 ? (
          <p className="text-gray-500 text-sm">No agents found</p>
        ) : (
          <div className="space-y-3">
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-medium truncate">{agent.id}</p>
                  <StatusBadge status={agent.status} />
                  {agent.currentTask && (
                    <p className="text-gray-400 text-xs mt-1 truncate">Task: {agent.currentTask}</p>
                  )}
                  {agent.error && (
                    <p className="text-red-400 text-xs mt-1 truncate">Error: {agent.error}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 ml-2">
                  <span className="text-gray-500 text-xs">
                    {formatTime(agent.lastHeartbeat)}
                  </span>
                  <div className="flex gap-1">
                    {agent.status === 'idle' || agent.status === 'error' ? (
                      <button
                        onClick={() => handleProvision(agent.id, 'start')}
                        disabled={provisioning === agent.id}
                        className="p-1 text-green-400 hover:text-green-300 disabled:opacity-50 transition-colors"
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
                        onClick={() => handleProvision(agent.id, 'stop')}
                        disabled={provisioning === agent.id}
                        className="p-1 text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
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
