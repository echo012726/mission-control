'use client'

import { useState } from 'react'
import { 
  LayoutDashboard, 
  ListTodo, 
  Activity, 
  Webhook, 
  Shield, 
  Bot, 
  Clock, 
  Settings,
  Search,
  X,
  Menu
} from 'lucide-react'
import KanbanBoard from '@/components/KanbanBoard'
import AgentStatusPanel from '@/components/AgentStatusPanel'
import AgentDeepDivePanel from '@/components/AgentDeepDivePanel'
import ActivityFeed from '@/components/ActivityFeed'
import MetricsDashboard from '@/components/MetricsDashboard'
import WebhooksPanel from '@/components/WebhooksPanel'
import ApprovalsPanel from '@/components/ApprovalsPanel'
import CronJobMonitor from '@/components/CronJobMonitor'
import DashboardWidgets from '@/components/DashboardWidgets'
import ConnectionStatus from '@/components/ConnectionStatus'

type Tab = 'dashboard' | 'tasks' | 'agents' | 'metrics' | 'webhooks' | 'approvals' | 'cron' | 'settings'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', icon: ListTodo },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'metrics', label: 'Metrics', icon: Activity },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook },
  { id: 'approvals', label: 'Approvals', icon: Shield },
  { id: 'cron', label: 'Cron Jobs', icon: Clock },
]

const tabLabels: Record<Tab, string> = {
  dashboard: 'Dashboard',
  tasks: 'Task Board',
  agents: 'Agents',
  metrics: 'Metrics',
  webhooks: 'Webhooks',
  approvals: 'Approvals',
  cron: 'Cron Jobs',
  settings: 'Settings',
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('tasks')
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <Bot size={20} />
            </div>
            <span className="sidebar-logo-text">Mission Control</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Main</div>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as Tab)}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            ))}
          </div>
          
          <div className="nav-section">
            <div className="nav-section-title">System</div>
            <button
              onClick={() => setActiveTab('settings')}
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            >
              <Settings size={20} />
              Settings
            </button>
          </div>
        </nav>
        
        <div style={{ padding: '16px 12px', borderTop: '1px solid #e2e8f0' }}>
          <ConnectionStatus compact />
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-wrapper">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <button 
              className="btn-ghost"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ display: 'none' }}
            >
              <Menu size={20} />
            </button>
            <h1 className="header-title">{tabLabels[activeTab]}</h1>
          </div>
          
          <div className="header-right">
            <div className="search-box">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search tasks, agents..." 
              />
            </div>
            
            <div className="connection-badge">
              <span className="connection-dot"></span>
              Connected
            </div>
            
            <div className="user-avatar">M</div>
          </div>
        </header>

        {/* Page Content */}
        <main className="main-content">
          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
              <div>
                <KanbanBoard />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <AgentStatusPanel onAgentClick={setSelectedAgentId} />
                <ActivityFeed />
              </div>
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <DashboardWidgets />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                <AgentStatusPanel onAgentClick={setSelectedAgentId} />
                <ActivityFeed />
              </div>
            </div>
          )}

          {/* Metrics Tab */}
          {activeTab === 'metrics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <MetricsDashboard />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                <AgentStatusPanel onAgentClick={setSelectedAgentId} />
                <ActivityFeed />
              </div>
            </div>
          )}

          {/* Cron Tab */}
          {activeTab === 'cron' && (
            <CronJobMonitor />
          )}

          {/* Webhooks Tab */}
          {activeTab === 'webhooks' && (
            <WebhooksPanel />
          )}

          {/* Approvals Tab */}
          {activeTab === 'approvals' && (
            <ApprovalsPanel />
          )}

          {/* Agents Tab */}
          {activeTab === 'agents' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
              <AgentStatusPanel onAgentClick={setSelectedAgentId} />
              <ActivityFeed />
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Settings</h2>
              </div>
              <div className="card-body">
                <p style={{ color: '#64748b' }}>Settings panel coming soon...</p>
              </div>
            </div>
          )}
        </main>
      </div>

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
