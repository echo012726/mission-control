'use client'

import { useState, useEffect } from 'react'
import { X, RefreshCw, Circle, Loader2, Clock, Terminal, Settings, Play, Send, Zap, FileText } from 'lucide-react'
import { Agent } from '@/types'
import { useToast } from '@/components/Toast'

// Agent emoji map - synced with openclaw.json identity.emoji
const AGENT_EMOJIS: Record<string, string> = {
  main: '🤖',
  planner: '📋',
  researcher: '🔍',
  browser_runner: '🌐',
  coder: '💻',
  executor: '⚙️',
  reviewer: '🔎',
  arbiter: '⚖️',
  summarizer: '📝',
  security_guard: '🛡️',
}

interface AgentDetail {
  id: string
  status: string
  lastHeartbeat?: number
  currentTask?: string
  error?: string
  config?: Record<string, unknown>
  logs?: string[]
  runtime?: string
  type?: string
  messageCount?: number
  createdAt?: number
  uptime?: number
}

interface TriggerTaskForm {
  task: string
  agentType: string
  runtime: string
}

interface AgentDeepDivePanelProps {
  agentId: string
  onClose: () => void
}

export default function AgentDeepDivePanel({ agentId, onClose }: AgentDeepDivePanelProps) {
  const [agent, setAgent] = useState<AgentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'config' | 'trigger'>('overview')
  const [triggering, setTriggering] = useState(false)
  const [triggerForm, setTriggerForm] = useState<TriggerTaskForm>({
    task: '',
    agentType: 'coder',
    runtime: 'openai-codex/gpt-5.3-codex'
  })
  const [triggerResult, setTriggerResult] = useState<{success?: boolean; message?: string; agent?: unknown} | null>(null)
  const { showToast } = useToast()

  const fetchAgent = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}`, { credentials: 'include' })
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

  const formatUptime = (timestamp?: number) => {
    if (!timestamp) return '-'
    const diff = Date.now() - timestamp
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m`
    return `${seconds}s`
  }

  const handleTriggerTask = async () => {
    if (!triggerForm.task.trim()) {
      showToast('Please enter a task description', 'error')
      return
    }
    
    setTriggering(true)
    setTriggerResult(null)
    
    try {
      const res = await fetch('/api/openclaw/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: triggerForm.task,
          agentType: triggerForm.agentType,
          runtime: triggerForm.runtime
        }),
        credentials: 'include'
      })
      
      const data = await res.json()
      
      if (res.ok && data.success) {
        setTriggerResult({ success: true, message: data.message, agent: data.agent })
        showToast('Task triggered successfully', 'success')
        setTriggerForm({ ...triggerForm, task: '' })
      } else {
        setTriggerResult({ success: false, message: data.error || 'Failed to trigger task' })
        showToast(data.error || 'Failed to trigger task', 'error')
      }
    } catch (e) {
      console.error('Failed to trigger task', e)
      setTriggerResult({ success: false, message: 'Network error' })
      showToast('Failed to trigger task', 'error')
    } finally {
      setTriggering(false)
    }
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
          <span className="text-2xl">{AGENT_EMOJIS[agentId] || '🤖'}</span>
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
        <button
          onClick={() => setActiveTab('trigger')}
          className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
            activeTab === 'trigger' 
              ? 'text-blue-400 border-b-2 border-blue-400' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Zap size={14} />
          Trigger
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
                      <span className="text-gray-300 text-sm font-mono flex items-center gap-2">
                        <span className="text-lg">{AGENT_EMOJIS[agent.id] || '🤖'}</span>
                        {agent.id}
                      </span>
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
                    {agent.uptime !== undefined && agent.status === 'running' && (
                      <div className="flex items-center justify-between">
                        <span className="text-white">Uptime</span>
                        <span className="text-green-400 text-sm">{formatUptime(agent.lastHeartbeat)}</span>
                      </div>
                    )}
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
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Runtime Info</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white">Type</span>
                      <span className="text-gray-300 text-sm">{agent.type || 'subagent'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white">Model/Runtime</span>
                      <span className="text-blue-400 text-sm font-mono">{agent.runtime || 'minimax-portal/MiniMax-M2.5'}</span>
                    </div>
                    {agent.messageCount !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-white">Messages</span>
                        <span className="text-gray-300 text-sm">{agent.messageCount}</span>
                      </div>
                    )}
                    {agent.createdAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-white">Created</span>
                        <span className="text-gray-300 text-sm">{formatTime(agent.createdAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Session History</h3>
                  {agent.messageCount !== undefined && agent.messageCount > 0 ? (
                    <p className="text-gray-300 text-sm">{agent.messageCount} messages processed in this session</p>
                  ) : (
                    <p className="text-gray-500 text-sm">No session history available</p>
                  )}
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

            {activeTab === 'trigger' && (
              <div className="space-y-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                    <Zap size={14} className="text-yellow-400" />
                    Trigger New Task
                  </h3>
                  <p className="text-gray-500 text-xs mb-4">
                    Spawn a new subagent to handle a specific task
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-white text-xs block mb-1">Task Description</label>
                      <textarea
                        value={triggerForm.task}
                        onChange={(e) => setTriggerForm({ ...triggerForm, task: e.target.value })}
                        placeholder="Describe the task you want the agent to perform..."
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white text-sm resize-none focus:outline-none focus:border-blue-500"
                        rows={4}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-white text-xs block mb-1">Agent Type</label>
                        <select
                          value={triggerForm.agentType}
                          onChange={(e) => setTriggerForm({ ...triggerForm, agentType: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-blue-500"
                        >
                          <option value="coder">Coder</option>
                          <option value="researcher">Researcher</option>
                          <option value="planner">Planner</option>
                          <option value="executor">Executor</option>
                          <option value="reviewer">Reviewer</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-white text-xs block mb-1">Model/Runtime</label>
                        <select
                          value={triggerForm.runtime}
                          onChange={(e) => setTriggerForm({ ...triggerForm, runtime: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-blue-500"
                        >
                          <option value="openai-codex/gpt-5.3-codex">Codex</option>
                          <option value="deepseek/deepseek-chat">DeepSeek Chat</option>
                          <option value="deepseek/deepseek-reasoner">DeepSeek Reasoner</option>
                          <option value="minimax-portal/MiniMax-M2.5">MiniMax M2.5</option>
                          <option value="openai/gpt-4.1">GPT-4.1</option>
                        </select>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleTriggerTask}
                      disabled={triggering || !triggerForm.task.trim()}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      {triggering ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Triggering...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Trigger Task
                        </>
                      )}
                    </button>
                    
                    {triggerResult && (
                      <div className={`p-3 rounded-lg text-sm ${
                        triggerResult.success 
                          ? 'bg-green-900/30 text-green-400 border border-green-800' 
                          : 'bg-red-900/30 text-red-400 border border-red-800'
                      }`}>
                        {triggerResult.success ? '✓ ' : '✗ '}
                        {triggerResult.message}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Quick Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setTriggerForm({ ...triggerForm, task: 'Research the latest developments in AI agents and automation', agentType: 'researcher', runtime: 'deepseek/deepseek-chat' })}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-lg transition-colors"
                    >
                      🔍 Research Task
                    </button>
                    <button
                      onClick={() => setTriggerForm({ ...triggerForm, task: 'Write a Python script to automate data processing', agentType: 'coder', runtime: 'openai-codex/gpt-5.3-codex' })}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-lg transition-colors"
                    >
                      💻 Code Task
                    </button>
                    <button
                      onClick={() => setTriggerForm({ ...triggerForm, task: 'Review the latest code changes for security issues', agentType: 'reviewer', runtime: 'deepseek/deepseek-reasoner' })}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-lg transition-colors"
                    >
                      🔎 Review Code
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
