'use client'
import { useState, useEffect } from 'react'

interface Agent {
  id: string
  name: string
  role: string
  status: 'idle' | 'working' | 'waiting'
  description: string
  lastActive: number
}

const DEFAULT_AGENTS: Agent[] = [
  { id: 'main', name: 'Echo', role: 'Main Orchestrator', status: 'working', description: 'High-level coordination and delegation', lastActive: Date.now() },
  { id: 'coder', name: 'Coder', role: 'Development', status: 'idle', description: 'Write code, implement features', lastActive: Date.now() - 300000 },
  { id: 'researcher', name: 'Researcher', role: 'Research', status: 'idle', description: 'Web research with citations', lastActive: Date.now() - 600000 },
  { id: 'executor', name: 'Executor', role: 'Automation', status: 'idle', description: 'Run shell commands', lastActive: Date.now() - 900000 },
  { id: 'polybot', name: 'PolyBot', role: 'Trading', status: 'working', description: 'PolyMarket EV trading bot', lastActive: Date.now() },
  { id: 'trader', name: 'Trading Strategist', role: 'Trading', status: 'idle', description: 'Strategy development', lastActive: Date.now() - 1800000 },
]

export default function TeamPage() {
  const [agents, setAgents] = useState<Agent[]>(DEFAULT_AGENTS)

  useEffect(() => {
    const saved = localStorage.getItem('mc_agents')
    if (saved) setAgents(JSON.parse(saved))
    else setAgents(DEFAULT_AGENTS)
  }, [])

  function save(newAgents: Agent[]) {
    setAgents(newAgents)
    localStorage.setItem('mc_agents', JSON.stringify(newAgents))
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'working': return 'bg-green-500'
      case 'waiting': return 'bg-yellow-500'
      default: return 'bg-gray-400'
    }
  }

  function getTimeAgo(ts: number) {
    const mins = Math.floor((Date.now() - ts) / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  const workingAgents = agents.filter(a => a.status === 'working')
  const waitingAgents = agents.filter(a => a.status === 'waiting')
  const idleAgents = agents.filter(a => a.status === 'idle')

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Team</h2>
      <p className="text-sm text-muted-foreground mb-6">Your agent workforce</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(agent => (
          <div key={agent.id} className="border rounded-lg p-4 bg-white">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-lg">{agent.name}</h3>
                <p className="text-sm text-gray-500">{agent.role}</p>
              </div>
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`}></span>
                <span className="text-xs capitalize">{agent.status}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">{agent.description}</p>
            <p className="text-xs text-gray-400">Last active: {getTimeAgo(agent.lastActive)}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{workingAgents.length}</div>
          <div className="text-sm text-green-700">Working</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{waitingAgents.length}</div>
          <div className="text-sm text-yellow-700">Waiting</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">{idleAgents.length}</div>
          <div className="text-sm text-gray-700">Idle</div>
        </div>
      </div>
    </div>
  )
}
