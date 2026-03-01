'use client'

import { useState } from 'react'
import KanbanBoard from '@/components/KanbanBoard'
import AgentStatusPanel from '@/components/AgentStatusPanel'
import ActivityFeed from '@/components/ActivityFeed'
import MetricsDashboard from '@/components/MetricsDashboard'
import WebhooksPanel from '@/components/WebhooksPanel'
import ApprovalsPanel from '@/components/ApprovalsPanel'
import { LayoutDashboard, ListTodo, Activity, Webhook, Shield, Bot } from 'lucide-react'

type Tab = 'tasks' | 'metrics' | 'webhooks' | 'approvals'

const tabs: { id: Tab; label: string; icon: typeof ListTodo }[] = [
  { id: 'tasks', label: 'Tasks', icon: ListTodo },
  { id: 'metrics', label: 'Metrics', icon: LayoutDashboard },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook },
  { id: 'approvals', label: 'Approvals', icon: Shield },
]

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('tasks')

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Bot className="text-blue-400" />
            Mission Control
          </h1>
          
          {/* Mobile: Horizontal scroll tabs */}
          <nav className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible">
            <div className="flex gap-1 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
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
              <AgentStatusPanel />
              <ActivityFeed />
            </div>
          </div>
        )}

        {/* Metrics Tab */}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            <MetricsDashboard />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AgentStatusPanel />
              <ActivityFeed />
            </div>
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
    </div>
  )
}
