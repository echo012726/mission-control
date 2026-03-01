'use client'

import { useState, useEffect } from 'react'
import { X, RefreshCw, Circle, Loader2, Clock, Terminal, FileText, Settings } from 'lucide-react'
import { Agent } from '@/types'
import { useToast } from '@/components/Toast'

interface AgentDetail {
  id: string
  status: string
  lastHeartbeat?: number
  currentTask?: string
  error?: string
  config?: Record<string, unknown>
  logs?: string[]
}

interface AgentDeepDivePanelProps {
  agentId: string
  onClose: () => void
}

export default function AgentDeepDivePanel({ agentId, onClose }: AgentDeepDivePanelProps) {
  const [agent, setAgent] = useState<AgentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'config'>('overview')
  const { showToast } = useToast()

  const fetchAgent = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}`)
      if (res.ok) {
        const data = await res.json()
        setAgent(data)
      } else {
        showToast('Failed to load agent details', 'error')
      }
    } catch (e) {
      console.error('Failed to fetch agent', e)
      showToast('Failed to load agent details', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgent()
  }, [agentId])

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return 'Never'
    return new Date(timestamp).toLocaleString()
  }

  const statusColors: Record<string, string> = {
    idle: 'bg-gray-500',
    running: 'bg-green-500',
    error: 'bg-red-500',
    unknown: 'bg-yellow-500',
  }

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-gray-900 border-l border-gray-800 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-white">Agent Details</h2>
          <button
            onClick={fetchAgent}
            disabled={loading}
            className="text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
            activeTab === 'overview' 
              ? 'text-blue-400 border-b-2 border-blue-400' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <FileText size={14} />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
            activeTab === 'logs' 
              ? 'text-blue-400 border-b-2 border-blue-400' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Terminal size={14} />
          Logs
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
            activeTab === 'config' 
              ? 'text-blue-400 border-b-2 border-blue-400' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Settings size={14} />
          Config
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : !agent ? (
          <p className="text-gray-500">Agent not found</p>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Status</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white">Agent ID</span>
                      <span className="text-gray-300 text-sm font-mono">{agent.id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white">Status</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${statusColors[agent.status] || statusColors.unknown}`}>
                        <Circle size={8} fill="currentColor" />
                        {agent.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white">Last Heartbeat</span>
                      <span className="text-gray-300 text-sm flex items-center gap-1">
                        <Clock size={12} />
                        {formatTime(agent.lastHeartbeat)}
                      </span>
                    </div>
                    {agent.currentTask && (
                      <div className="flex items-center justify-between">
                        <span className="text-white">Current Task</span>
                        <span className="text-gray-300 text-sm">{agent.currentTask}</span>
                      </div>
                    )}
                    {agent.error && (
                      <div className="mt-2">
                        <span className="text-white text-sm">Error</span>
                        <p className="text-red-400 text-sm mt-1">{agent.error}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Session History</h3>
                  <p className="text-gray-500 text-sm">Session history will appear here when available.</p>
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="bg-gray-950 rounded-lg p-4 font-mono text-xs">
                {agent.logs && agent.logs.length > 0 ? (
                  <div className="space-y-1">
                    {agent.logs.map((log, idx) => (
                      <div key={idx} className="text-gray-300 whitespace-pre-wrap">
                        {log}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No logs available</p>
                )}
              </div>
            )}

            {activeTab === 'config' && (
              <div className="bg-gray-800 rounded-lg p-4">
                {agent.config ? (
                  <pre className="text-xs text-gray-300 overflow-auto">
                    {JSON.stringify(agent.config, null, 2)}
                  </pre>
                ) : (
                  <p className="text-gray-500 text-sm">No configuration available</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
