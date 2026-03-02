'use client'

import { useState } from 'react'
import KanbanBoard from '@/components/KanbanBoard'
import AgentStatusPanel from '@/components/AgentStatusPanel'
import AgentDeepDivePanel from '@/components/AgentDeepDivePanel'
import ActivityFeed from '@/components/ActivityFeed'
import MetricsDashboard from '@/components/MetricsDashboard'
import WebhooksPanel from '@/components/WebhooksPanel'
import ApprovalsPanel from '@/components/ApprovalsPanel'
import CronJobMonitor from '@/components/CronJobMonitor'
import DashboardWidgets from '@/components/DashboardWidgets'
import { LayoutDashboard, ListTodo, Activity, Webhook, Shield, Bot, Clock, Layout } from 'lucide-react'

type Tab = 'tasks' | 'dashboard' | 'metrics' | 'webhooks' | 'approvals' | 'cron'

const tabs: { id: Tab; label: string; icon: typeof ListTodo }[] = [
  { id: 'tasks', label: 'Tasks', icon: ListTodo },
  { id: 'dashboard', label: 'Dashboard', icon: Layout },
  { id: 'metrics', label: 'Metrics', icon: LayoutDashboard },
  { id: 'cron', label: 'Cron', icon: Clock },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook },
  { id: 'approvals', label: 'Approvals', icon: Shield },
]

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('tasks')
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-white/10 px-4 sm:px-6 py-4 glass-panel">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
              <Bot className="text-blue-400" size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Mission Control
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">Real-time agent orchestration</p>
            </div>
          </div>
          
          {/* Mobile: Horizontal scroll tabs */}
          <nav className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible">
            <div className="flex gap-1 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <tab.icon size={16} />
                  <span className="hidden xs:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>

      <main className="p-4 sm:p-6">
        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
            <div className="lg:col-span-3">
              <KanbanBoard />
            </div>
            <div className="space-y-4 lg:space-y-6">
              <AgentStatusPanel onAgentClick={setSelectedAgentId} />
              <ActivityFeed />
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <DashboardWidgets />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AgentStatusPanel onAgentClick={setSelectedAgentId} />
              <ActivityFeed />
            </div>
          </div>
        )}

        {/* Metrics Tab */}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            <MetricsDashboard />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AgentStatusPanel onAgentClick={setSelectedAgentId} />
              <ActivityFeed />
            </div>
          </div>
        )}

        {/* Cron Tab */}
        {activeTab === 'cron' && (
          <div className="space-y-6">
            <CronJobMonitor />
          </div>
        )}

        {/* Webhooks Tab */}
        {activeTab === 'webhooks' && (
          <div className="space-y-6">
            <WebhooksPanel />
          </div>
        )}

        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
          <div className="space-y-6">
            <ApprovalsPanel />
          </div>
        )}
      </main>

      {/* Agent Deep-Dive Panel */}
      {selectedAgentId && (
        <AgentDeepDivePanel
          agentId={selectedAgentId}
          onClose={() => setSelectedAgentId(null)}
        />
      )}
    </div>
  )
}
