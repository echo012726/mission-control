'use client'

import { useState, useEffect, useRef } from 'react'
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
  Menu,
  Moon,
  Sun,
  Plus,
  Tag,
  FileText,
  Keyboard,
  Bell,
  BellOff,
  Maximize2,
  Minimize2,
  LayoutGrid,
  Trash2,
  Share2,
  Link,
  Copy,
  Check,
  Grid3X3,
  Download
} from 'lucide-react'
import { useToast } from '@/components/Toast'
import KanbanBoard from '@/components/KanbanBoard'
import GanttChart from '@/components/GanttChart'
import AgentStatusPanel from '@/components/AgentStatusPanel'
import AgentDeepDivePanel from '@/components/AgentDeepDivePanel'
import ActivityFeed from '@/components/ActivityFeed'
import MetricsDashboard from '@/components/MetricsDashboard'
import WebhooksPanel from '@/components/WebhooksPanel'
import ApprovalsPanel from '@/components/ApprovalsPanel'
import CronJobMonitor from '@/components/CronJobMonitor'
import RemindersMonitor from '@/components/RemindersMonitor'
import ArchiveView from '@/components/ArchiveView'
import DashboardWidgets from '@/components/DashboardWidgets'
import BudgetPanel from '@/components/BudgetPanel'
import ConnectionStatus from '@/components/ConnectionStatus'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import OfflineIndicator from '@/components/OfflineIndicator'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import TaskTemplatesPanel from '@/components/TaskTemplatesPanel'
import PriorityMatrix from '@/components/PriorityMatrix'
import WeeklyReportPanel from '@/components/WeeklyReportPanel'
import LabelsPanel from '@/components/LabelsPanel'
import ReportPanel from '@/components/ReportPanel'
import PortfolioPanel from '@/components/PortfolioPanel'
import NotificationBell from '@/components/NotificationBell'
import AdvancedSearchModal from '@/components/AdvancedSearchModal'
import AdvancedSearch from '@/components/AdvancedSearch'
import TimeBoxingPanel from '@/components/TimeBoxingPanel'
import AIChatPanel from '@/components/AIChatPanel'
import WorkflowsPanel from '@/components/WorkflowsPanel'
import FocusTimer from '@/components/FocusTimer'
import TimeReportsPage from '@/app/time-reports/page'
import { useBrowserNotifications, NotificationSettings } from '@/hooks/useBrowserNotifications'

type Tab = 'dashboard' | 'tasks' | 'search' | 'matrix' | 'agents' | 'metrics' | 'webhooks' | 'approvals' | 'cron' | 'reminders' | 'archive' | 'settings' | 'reports' | 'advancedReports' | 'labels' | 'workflows' | 'timeReports' | 'portfolios'

import { Archive, Workflow, Timer, Folder, BarChart3 } from 'lucide-react'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', icon: ListTodo },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'matrix', label: 'Priority Matrix', icon: Grid3X3 },
  { id: 'labels', label: 'Labels', icon: Tag },
  { id: 'portfolios', label: 'Portfolios', icon: Folder },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'reports', label: 'Weekly Report', icon: FileText },
  { id: 'advancedReports', label: 'Advanced Reports', icon: BarChart3 },
  { id: 'timeReports', label: 'Time Reports', icon: Timer },
  { id: 'metrics', label: 'Metrics', icon: Activity },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook },
  { id: 'approvals', label: 'Approvals', icon: Shield },
  { id: 'cron', label: 'Cron Jobs', icon: Clock },
  { id: 'reminders', label: 'Reminders', icon: Bell },
  { id: 'archive', label: 'Archive', icon: Archive },
  { id: 'workflows', label: 'Workflows', icon: Workflow },
]

const tabLabels: Record<Tab, string> = {
  dashboard: 'Dashboard',
  tasks: 'Task Board',
  search: 'Search',
  matrix: 'Priority Matrix',
  labels: 'Labels',
  portfolios: 'Portfolios',
  agents: 'Agents',
  reports: 'Weekly Report',
  advancedReports: 'Advanced Reports',
  timeReports: 'Time Reports',
  metrics: 'Metrics',
  webhooks: 'Webhooks',
  approvals: 'Approvals',
  cron: 'Cron Jobs',
  reminders: 'Reminders',
  archive: 'Archive',
  settings: 'Settings',
  workflows: 'Workflows',
}

function isTypingTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null
  if (!element) return false

  return (
    element.tagName === 'INPUT' ||
    element.tagName === 'TEXTAREA' ||
    element.tagName === 'SELECT' ||
    element.isContentEditable ||
    !!element.closest('[contenteditable="true"]')
  )
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('tasks')
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null)
  const [portfolios, setPortfolios] = useState<any[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // Dark mode with system preference detection
  const getInitialTheme = () => {
    if (typeof window === 'undefined') return false
    const stored = localStorage.getItem('theme')
    if (stored) return stored === 'dark'
    // No stored preference - detect system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  const [darkMode, setDarkMode] = useState(getInitialTheme)
  const [themeSource, setThemeSource] = useState<'manual' | 'system'>(() => {
    if (typeof window === 'undefined') return 'system'
    return localStorage.getItem('theme') ? 'manual' : 'system'
  })
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [quickAddTitle, setQuickAddTitle] = useState('')
  const [quickAddTags, setQuickAddTags] = useState('')
  const [quickAddPriority, setQuickAddPriority] = useState('medium')
  const [quickAddSubtasks, setQuickAddSubtasks] = useState<{id: string, title: string}[]>([])
  const [todoistImportOpen, setTodoistImportOpen] = useState(false)
  const [todoistToken, setTodoistToken] = useState('')
  const [todoistImporting, setTodoistImporting] = useState(false)
  const [todoistImportResult, setTodoistImportResult] = useState<{success?: boolean, message?: string} | null>(null)
  const [templatesPanelOpen, setTemplatesPanelOpen] = useState(false)
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [taskViewMode, setTaskViewMode] = useState<'kanban' | 'gantt' | 'calendar'>('kanban')
  const [currentDashboardId, setCurrentDashboardId] = useState<string>('')
  const [dashboards, setDashboards] = useState<Array<{id: string, name: string, isDefault: boolean}>>([])
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareData, setShareData] = useState<{token?: string, url?: string, expiresAt?: string} | null>(null)
  const [sharePassword, setSharePassword] = useState('')
  const [shareExpireDays, setShareExpireDays] = useState(0)
  const [aiChatOpen, setAIChatOpen] = useState(false)
  const [aiChatInitialMessage, setAIChatInitialMessage] = useState('')
  const [tasks, setTasks] = useState<any[]>([])
  const token = 'mc_dev_token_2024'
  const quickAddInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  // Browser notifications hook
  const { permission: notificationPermission, enabled: notificationsEnabled, requestPermission } = useBrowserNotifications(true)

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev
      document.documentElement.classList.toggle('dark', next)
      localStorage.setItem('theme', next ? 'dark' : 'light')
      setThemeSource('manual')
      return next
    })
  }

  // Listen for system theme changes when using system preference
  useEffect(() => {
    if (themeSource !== 'system') return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setDarkMode(e.matches)
      document.documentElement.classList.toggle('dark', e.matches)
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [themeSource])

  // Keep document theme class in sync (including initial load)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  // Fetch dashboards list
  useEffect(() => {
    const fetchDashboards = async () => {
      try {
        const res = await fetch('/api/dashboards?token=mc_dev_token_2024')
        if (res.ok) {
          const data = await res.json()
          setDashboards(data)
          // Set default dashboard
          const defaultDb = data.find((d: any) => d.isDefault) || data[0]
          if (defaultDb) {
            setCurrentDashboardId(defaultDb.id)
          }
        }
      } catch (e) {
        console.error('Failed to fetch dashboards', e)
      }
    }
    fetchDashboards()
  }, [])

  // Fetch tasks for portfolio filtering
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch('/api/tasks')
        if (res.ok) {
          const data = await res.json()
          setTasks(data)
        }
      } catch (e) {
        console.error('Failed to fetch tasks', e)
      }
    }
    fetchTasks()

    // Fetch portfolios from API
    const fetchPortfolios = async () => {
      try {
        const res = await fetch('/api/portfolios')
        if (res.ok) {
          const data = await res.json()
          setPortfolios(data)
          localStorage.setItem('mc_portfolios', JSON.stringify(data))
        }
      } catch (e) {
        console.error('Failed to fetch portfolios:', e)
        // Fallback to localStorage
        const stored = localStorage.getItem('mc_portfolios')
        if (stored) {
          try {
            setPortfolios(JSON.parse(stored))
          } catch (e) {
            console.error('Failed to parse portfolios:', e)
          }
        }
      }
    }
    fetchPortfolios()
  }, [activeTab]) // Update when tab changes to get latest portfolios

  // Global keyboard shortcuts (conflict-safe with Task Board shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat || isTypingTarget(e.target)) {
        return
      }

      const hasModifier = e.ctrlKey || e.metaKey || e.altKey
      const key = e.key.toLowerCase()

      // Ctrl+K or Cmd+K opens global search
      if ((e.ctrlKey || e.metaKey) && key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
        return
      }

      // Shift + / ("?") opens shortcuts help
      if (!hasModifier && (e.key === '?' || (e.key === '/' && e.shiftKey))) {
        e.preventDefault()
        setShortcutsHelpOpen(true)
        return
      }

      // Global quick add: Shift+N anywhere, or plain "n" outside Task Board
      const isShiftN = key === 'n' && e.shiftKey && !hasModifier
      const isPlainN = key === 'n' && !e.shiftKey && !hasModifier
      if (isShiftN || (isPlainN && activeTab !== 'tasks')) {
        e.preventDefault()
        setQuickAddOpen(true)
        setTimeout(() => quickAddInputRef.current?.focus(), 50)
        return
      }

      // Shift+F toggles Focus Mode
      if (key === 'f' && e.shiftKey && !hasModifier) {
        e.preventDefault()
        setFocusMode(prev => !prev)
        return
      }

      if (e.key === 'Escape') {
        if (shortcutsHelpOpen) {
          setShortcutsHelpOpen(false)
          return
        }

        if (quickAddOpen) {
          setQuickAddOpen(false)
          return
        }

        // Exit focus mode on Escape
        if (focusMode) {
          setFocusMode(false)
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTab, quickAddOpen, shortcutsHelpOpen, focusMode])

  // Handle quick add submit
  const handleQuickAdd = async () => {
    // Check for chat: syntax - open AI chat panel with message
    const lowerTitle = quickAddTitle.toLowerCase().trim()
    if (lowerTitle.startsWith('chat:')) {
      const chatMessage = quickAddTitle.slice(5).trim()
      setQuickAddOpen(false)
      setAIChatOpen(true)
      setAIChatInitialMessage(chatMessage)
      setQuickAddTitle('')
      return
    }
    
    if (!quickAddTitle.trim()) {
      showToast('Task title is required', 'error')
      return
    }
    
    const tagsArray = quickAddTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
    
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quickAddTitle,
          description: '',
          priority: quickAddPriority,
          status: 'inbox',
          tags: JSON.stringify(tagsArray),
          subtasks: quickAddSubtasks.map(st => st.title).filter(Boolean),
        }),
        credentials: 'include',
      })
      
      if (res.ok) {
        showToast('Task created!', 'success')
        setQuickAddTitle('')
        setQuickAddTags('')
        setQuickAddPriority('medium')
        setQuickAddSubtasks([])
        setQuickAddOpen(false)
      } else {
        showToast('Failed to create task', 'error')
      }
    } catch (e) {
      console.error('Quick add failed', e)
      showToast('Failed to create task', 'error')
    }
  }
  const handleTodoistImport = async () => {
    if (!todoistToken.trim()) {
      setTodoistImportResult({ success: false, message: "API token is required" })
      return
    }
    setTodoistImporting(true)
    setTodoistImportResult(null)
    try {
      // Save token to localStorage for reuse
      localStorage.setItem("todoist_api_token", todoistToken)
      
      const res = await fetch("/api/todoist/sync?token=mc_dev_token_2024", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiToken: todoistToken }),
      })
      const data = await res.json()
      if (data.success) {
        setTodoistImportResult({ success: true, message: data.message })
        showToast("Todoist import completed!", "success")
      } else {
        setTodoistImportResult({ success: false, message: data.error })
        showToast("Todoist import failed", "error")
      }
    } catch (e) {
      setTodoistImportResult({ success: false, message: "Import failed" })
      showToast("Todoist import failed", "error")
    }
    setTodoistImporting(false)
  }

  return (
    <div className={`app-layout ${focusMode ? 'focus-mode' : ''}`}>
      {/* Sidebar - hidden in focus mode */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${focusMode ? 'focus-mode-hidden' : ''}`}>
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
              onClick={() => window.open('/import', '_blank')}
              className="nav-item"
            >
              <Download size={20} />
              Import
            </button>
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
              className="btn-ghost mobile-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={20} />
            </button>
            
            {/* Mobile Overlay */}
            {sidebarOpen && (
              <div 
                className="sidebar-overlay"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            <h1 className="header-title">{tabLabels[activeTab]}</h1>
            
            {/* Portfolio Selector */}
            {portfolios.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px', borderLeft: '1px solid #e2e8f0', paddingLeft: '16px' }}>
                <Folder size={16} style={{ color: '#64748b' }} />
                <select
                  value={selectedPortfolioId || ''}
                  onChange={(e) => {
                    setSelectedPortfolioId(e.target.value || null)
                    if (e.target.value && activeTab !== 'tasks') {
                      setActiveTab('tasks')
                    }
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Portfolios</option>
                  {portfolios.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {selectedPortfolioId && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    {(() => {
                      const p = portfolios.find(x => x.id === selectedPortfolioId)
                      if (!p) return null
                      const portfolioTasks = tasks.filter((t: any) => t.portfolioId === p.id)
                      const total = portfolioTasks.length
                      const completed = portfolioTasks.filter((t: any) => t.status === 'done').length
                      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
                      return (
                        <>
                          <span className="font-medium text-slate-700">{completionRate}% done</span>
                          <span>({completed}/{total})</span>
                          {p.budget && <span className="text-green-600 font-medium">${p.budget.toLocaleString()}</span>}
                        </>
                      )
                    })()}
                  </div>
                )}
              </div>
            )}
            
            {/* Dashboard Selector - only show on dashboard tab */}
            {activeTab === 'dashboard' && dashboards.length > 0 && !focusMode && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
                <LayoutGrid size={16} style={{ color: '#64748b' }} />
                <select
                  value={currentDashboardId}
                  onChange={(e) => setCurrentDashboardId(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: 'white',
                    fontSize: '14px',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  {dashboards.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.isDefault ? '(default)' : ''}
                    </option>
                  ))}
                </select>
                <button
                  className="btn-ghost"
                  onClick={async () => {
                    const name = prompt('Enter dashboard name:')
                    if (name) {
                      const res = await fetch('/api/dashboards?token=mc_dev_token_2024', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name })
                      })
                      if (res.ok) {
                        const newDb = await res.json()
                        setDashboards([...dashboards, newDb])
                        setCurrentDashboardId(newDb.id)
                      }
                    }
                  }}
                  title="Add new dashboard"
                  style={{ padding: '4px', borderRadius: '4px' }}
                >
                  <Plus size={14} />
                </button>
              </div>
            )}
          </div>
          
          <div className="header-right">
            {/* Share Dashboard Button - only on dashboard tab */}
            {activeTab === 'dashboard' && !focusMode && (
              <button 
                className="btn-ghost"
                onClick={() => setShareModalOpen(true)}
                title="Share Dashboard"
                style={{ padding: '8px', borderRadius: '8px' }}
              >
                <Share2 size={20} />
              </button>
            )}

            {/* Focus Mode Toggle - only show when not in focus mode */}
            {!focusMode && (
              <button 
                className="btn-ghost"
                onClick={() => setFocusMode(true)}
                title="Enter Focus Mode (hide UI chrome)"
                style={{ padding: '8px', borderRadius: '8px' }}
              >
                <Maximize2 size={20} />
              </button>
            )}
            
            {/* Exit Focus Mode button - only show in focus mode */}
            {focusMode && (
              <button 
                className="btn-ghost"
                onClick={() => setFocusMode(false)}
                title="Exit Focus Mode"
                style={{ padding: '8px', borderRadius: '8px' }}
              >
                <Minimize2 size={20} />
              </button>
            )}
            
            {!focusMode && (
              <>
                <button 
                  className="btn-ghost relative"
                  onClick={toggleDarkMode}
                  title={darkMode ? 'Switch to light mode (right-click to reset to system)' : 'Switch to dark mode (right-click to reset to system)'}
                  style={{ padding: '8px', borderRadius: '8px' }}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    // Reset to system preference
                    localStorage.removeItem('theme')
                    setThemeSource('system')
                    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
                    setDarkMode(systemDark)
                    document.documentElement.classList.toggle('dark', systemDark)
                  }}
                >
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                  {themeSource === 'system' && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" title="Following system preference" />
                  )}
                </button>
                
                <NotificationBell />
                
                <button 
                  className="btn-ghost"
                  onClick={() => { setAIChatOpen(true); setAIChatInitialMessage(''); }}
                  title="AI Assistant (🤖)"
                  style={{ padding: '8px', borderRadius: '8px' }}
                >
                  🤖
                </button>
                
                <button 
                  className="btn-ghost"
                  onClick={() => setSearchOpen(true)}
                  title="Search tasks (Ctrl+K)"
                  style={{ padding: '8px', borderRadius: '8px' }}
                >
                  <Search size={20} />
                </button>
                
                <button 
                  className="btn-ghost"
                  onClick={() => setTemplatesPanelOpen(true)}
                  title="Task Templates"
                  style={{ padding: '8px', borderRadius: '8px' }}
                >
                  <FileText size={20} />
                </button>

                <button 
                  className="btn-ghost"
                  onClick={() => setShortcutsHelpOpen(true)}
                  title="Keyboard shortcuts (?)"
                  style={{ padding: '8px', borderRadius: '8px' }}
                >
                  <Keyboard size={20} />
                </button>
                
                <TimeBoxingPanel />
                
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
              </>
            )}
            
            {/* Minimal header in focus mode - just show title and exit button */}
            {focusMode && (
              <>
                <h1 className="header-title" style={{ marginRight: '8px' }}>{tabLabels[activeTab]}</h1>
                <div className="user-avatar">M</div>
              </>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="main-content">
          {/* Search Tab */}
          {activeTab === 'search' && (
            <AdvancedSearch />
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
              <div>
                {/* View Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <button
                    onClick={() => setTaskViewMode('kanban')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: taskViewMode === 'kanban' ? '#3b82f6' : '#e2e8f0',
                      color: taskViewMode === 'kanban' ? 'white' : '#64748b',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <LayoutGrid style={{ width: '14px', height: '14px' }} />
                    Board
                  </button>
                  <button
                    onClick={() => setTaskViewMode('gantt')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: taskViewMode === 'gantt' ? '#3b82f6' : '#e2e8f0',
                      color: taskViewMode === 'gantt' ? 'white' : '#64748b',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Grid3X3 style={{ width: '14px', height: '14px' }} />
                    Timeline
                  </button>
                  <button
                    onClick={() => setTaskViewMode('calendar')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: taskViewMode === 'calendar' ? '#3b82f6' : '#e2e8f0',
                      color: taskViewMode === 'calendar' ? 'white' : '#64748b',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Clock style={{ width: '14px', height: '14px' }} />
                    Calendar
                  </button>
                </div>
                {taskViewMode === 'kanban' ? (
                  <KanbanBoard portfolioId={selectedPortfolioId} portfolios={portfolios} />
                ) : (
                  <GanttChart />
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <AgentStatusPanel onAgentClick={setSelectedAgentId} />
                <ActivityFeed />
              </div>
            </div>
          )}

          {/* Priority Matrix Tab */}
          {activeTab === 'matrix' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
              <div>
                <PriorityMatrix />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <AgentStatusPanel onAgentClick={setSelectedAgentId} />
                <ActivityFeed />
              </div>
            </div>
          )}

          {/* Labels Tab */}
          {activeTab === 'labels' && (
            <LabelsPanel />
          )}

          {/* Portfolios Tab */}
          {activeTab === 'portfolios' && (
            <PortfolioPanel 
              tasks={tasks}
              onSelectPortfolio={(id) => {
                setSelectedPortfolioId(id)
                setActiveTab('tasks')
              }}
              selectedPortfolioId={selectedPortfolioId}
            />
          )}

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <DashboardWidgets 
                dashboardId={currentDashboardId} 
                onDashboardChange={setCurrentDashboardId}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <BudgetPanel />
                <FocusTimer />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
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

          {/* Weekly Report Tab */}
          {activeTab === 'reports' && (
            <div className="card">
              <WeeklyReportPanel />
            </div>
          )}

          {/* Advanced Reports Tab */}
          {activeTab === 'advancedReports' && (
            <div className="card">
              <ReportPanel tasks={tasks} portfolios={portfolios} />
            </div>
          )}

          {/* Cron Tab */}
          {activeTab === 'cron' && (
            <CronJobMonitor />
          )}

          {/* Reminders Tab */}
          {activeTab === 'reminders' && (
            <RemindersMonitor />
          )}

          {/* Archive Tab */}
          {activeTab === 'archive' && (
            <ArchiveView token={token} />
          )}

          {/* Workflows Tab */}
          {activeTab === 'workflows' && (
            <WorkflowsPanel />
          )}

          {/* Time Reports Tab */}
          {activeTab === 'timeReports' && (
            <TimeReportsPage />
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
                <div className="space-y-6">
                  {/* Notifications Section */}
                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {notificationPermission?.granted ? (
                          <Bell className="w-5 h-5 text-blue-600" />
                        ) : (
                          <BellOff className="w-5 h-5 text-slate-400" />
                        )}
                        <div>
                          <h3 className="font-medium text-slate-800 dark:text-white">Due Date Reminders</h3>
                          <p className="text-sm text-slate-500">
                            Get browser notifications for overdue and due today tasks
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setNotificationsOpen(true)}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        {notificationPermission?.granted 
                          ? (notificationsEnabled ? 'Enabled' : 'Disabled')
                          : 'Enable'
                        }
                      </button>
                    </div>
                    {notificationPermission?.granted && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-500">
                          🔔 Notifications are enabled. You&apos;ll receive alerts every 5 minutes for overdue and due today tasks.
                        </p>
                      </div>
                    )}
                    {notificationPermission?.denied && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-red-500">
                          ⚠️ Notifications are blocked. Please enable them in your browser settings.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Appearance Section */}
                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="font-medium text-slate-800 dark:text-white mb-3">Appearance</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-300">Dark Mode</span>
                      <button
                        onClick={toggleDarkMode}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          darkMode ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                            darkMode ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Keyboard Shortcuts Section */}
                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="font-medium text-slate-800 dark:text-white mb-3">Keyboard Shortcuts</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-300">Quick Add Task</span>
                        <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">Shift+N</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-300">Search</span>
                        <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">/</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-300">New Task (Board)</span>
                        <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">N</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-300">Help</span>
                        <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">?</kbd>
                      </div>
                    </div>
                  </div>

                  {/* Integrations Section */}
                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="font-medium text-slate-800 dark:text-white mb-3">Integrations</h3>
                    
                    {/* Todoist Import */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600 dark:text-slate-300">Todoist Import</span>
                        <button
                          onClick={() => setTodoistImportOpen(true)}
                          className="text-xs px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                        >
                          Configure
                        </button>
                      </div>
                      <p className="text-xs text-slate-500">
                        Import tasks from your Todoist account
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Notification Settings Modal */}
        {notificationsOpen && (
          <NotificationSettings onClose={() => setNotificationsOpen(false)} />
        )}
      </div>

      {/* Agent Deep-Dive Panel */}
      {selectedAgentId && (
        <AgentDeepDivePanel
          agentId={selectedAgentId}
          onClose={() => setSelectedAgentId(null)}
        />
      )}

      {/* Quick Add Modal */}
      {quickAddOpen && (
        <div 
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setQuickAddOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-800 p-6 rounded-xl w-full max-w-md animate-fade-in shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Plus size={20} className="text-blue-600" />
                Quick Add Task
              </h2>
              <button 
                onClick={() => setQuickAddOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Shortcuts: <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">Shift+N</kbd> anywhere, <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">N</kbd> in Task Board, <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">Esc</kbd> to close
            </p>
            
            <input
              ref={quickAddInputRef}
              type="text"
              placeholder="What needs to be done? (try: chat: message, timer: 25, focus: Task)"
              value={quickAddTitle}
              onChange={(e) => setQuickAddTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
              className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-slate-800 dark:text-white mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              autoFocus
            />
            
            <div className="flex gap-2 mb-4">
              <select
                value={quickAddPriority}
                onChange={(e) => setQuickAddPriority(e.target.value)}
                className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              
              <div className="relative flex-1">
                <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tags (comma-separated)"
                  value={quickAddTags}
                  onChange={(e) => setQuickAddTags(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg pl-9 pr-3 py-2 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleQuickAdd}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg transition-colors font-medium"
              >
                Add Task
              </button>
              <button
                onClick={() => setQuickAddOpen(false)}
                className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 py-2.5 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Todoist Import Modal */}
      {todoistImportOpen && (
        <div 
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setTodoistImportOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-800 p-6 rounded-xl w-full max-w-md animate-fade-in shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <ListTodo size={20} className="text-red-500" />
                Todoist Import
              </h2>
              <button 
                onClick={() => setTodoistImportOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Enter your Todoist API token to import tasks. Get it from Todoist → Settings → Integrations → API token.
            </p>
            
            <input
              type="password"
              placeholder="Todoist API Token"
              value={todoistToken}
              onChange={(e) => setTodoistToken(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTodoistImport()}
              className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-slate-800 dark:text-white mb-3 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
              autoFocus
            />
            
            {todoistImportResult && (
              <div className={`p-3 rounded-lg mb-3 text-sm ${
                todoistImportResult.success 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              }`}>
                {todoistImportResult.message}
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={handleTodoistImport}
                disabled={todoistImporting}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white py-2.5 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                {todoistImporting ? (
                  <>
                    <span className="animate-spin">⟳</span>
                    Importing...
                  </>
                ) : (
                  'Import Tasks'
                )}
              </button>
              <button
                onClick={() => setTodoistImportOpen(false)}
                className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 py-2.5 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Panel */}
      <AIChatPanel 
        isOpen={aiChatOpen} 
        onClose={() => { setAIChatOpen(false); setAIChatInitialMessage(''); }}
        initialMessage={aiChatInitialMessage}
      />

      {/* Share Dashboard Modal */}
      {shareModalOpen && (
        <div 
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => { setShareModalOpen(false); setShareData(null); }}
        >
          <div 
            className="bg-white dark:bg-slate-800 p-6 rounded-xl w-full max-w-md animate-fade-in shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Share2 size={20} className="text-green-600" />
                Share Dashboard
              </h2>
              <button 
                onClick={() => { setShareModalOpen(false); setShareData(null); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            {!shareData ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Link expires in
                  </label>
                  <select
                    value={shareExpireDays}
                    onChange={(e) => setShareExpireDays(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                  >
                    <option value={0}>Never</option>
                    <option value={1}>1 day</option>
                    <option value={7}>7 days</option>
                    <option value={30}>30 days</option>
                    <option value={90}>90 days</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Password (optional)
                  </label>
                  <input
                    type="password"
                    placeholder="Leave empty for no password"
                    value={sharePassword}
                    onChange={(e) => setSharePassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                  />
                </div>

                <button
                  onClick={async () => {
                    if (!currentDashboardId) {
                      showToast('Please select a dashboard first', 'error')
                      return
                    }
                    const res = await fetch(`/api/dashboards/${currentDashboardId}/share?token=${token}`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        expiresInDays: shareExpireDays,
                        password: sharePassword || undefined
                      })
                    })
                    if (res.ok) {
                      const data = await res.json()
                      setShareData(data)
                      showToast('Share link created!', 'success')
                    } else {
                      showToast('Failed to create share link', 'error')
                    }
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Link size={18} />
                  Generate Share Link
                </button>
              </>
            ) : (
              <>
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                    Share link created successfully!
                  </p>
                  {shareData.expiresAt && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Expires: {new Date(shareData.expiresAt).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Share Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}${shareData.url}`}
                      className="flex-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 text-sm"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}${shareData.url}`)
                        showToast('Copied to clipboard!', 'success')
                      }}
                      className="bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 p-2 rounded-lg transition-colors"
                      title="Copy link"
                    >
                      <Copy size={18} className="text-slate-600 dark:text-slate-300" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    const res = await fetch(`/api/dashboards/${currentDashboardId}/share?token=${token}`, {
                      method: 'DELETE'
                    })
                    if (res.ok) {
                      setShareData(null)
                      setSharePassword('')
                      setShareExpireDays(0)
                      showToast('Share link revoked', 'success')
                    }
                  }}
                  className="w-full bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Revoke Share Link
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      {shortcutsHelpOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShortcutsHelpOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 p-6 rounded-xl w-full max-w-xl animate-fade-in shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Keyboard size={20} className="text-blue-600" />
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setShortcutsHelpOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700 dark:text-slate-200">
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-900 dark:text-white">Global</h3>
                <p><kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">Shift+N</kbd> Quick add task</p>
                <p><kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">?</kbd> Open this help</p>
                <p><kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">Esc</kbd> Close open dialog</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-slate-900 dark:text-white">Task Board</h3>
                <p><kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">N</kbd> New task in selected lane</p>
                <p><kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">/</kbd> Focus search</p>
                <p><kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">← →</kbd> Move across lanes</p>
                <p><kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">↑ ↓</kbd> Move between tasks</p>
                <p><kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">Enter</kbd> Open selected task</p>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              Conflict-safe behavior: plain <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">N</kbd> stays scoped to Task Board; global quick add uses <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">Shift+N</kbd>.
            </p>
          </div>
        </div>
      )}

      {/* Task Templates Panel */}
      <TaskTemplatesPanel
        isOpen={templatesPanelOpen}
        onClose={() => setTemplatesPanelOpen(false)}
        onUseTemplate={(taskData) => {
          // Pre-fill quick add with template data
          setQuickAddOpen(true)
          setQuickAddTitle(taskData.title || '')
          setQuickAddPriority(taskData.priority || 'medium')
          setQuickAddTags(taskData.tags?.join(', ') || '')
          // Set subtasks from template
          if (taskData.subtasks && Array.isArray(taskData.subtasks)) {
            setQuickAddSubtasks(taskData.subtasks.map((st: any) => ({ ...st, id: `temp_${Date.now()}_${Math.random()}` })))
          } else {
            setQuickAddSubtasks([])
          }
          showToast('Template applied! Edit and click Add Task to create.', 'success')
        }}
        token="mc_dev_token_2024"
      />

      {/* Global Search Modal */}
      {/* PWA Components */}
      <ServiceWorkerRegistration />
      <OfflineIndicator />
      <PWAInstallPrompt />

      <AdvancedSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigateToTask={(taskId) => {
          setSearchOpen(false)
          // Switch to tasks tab and find the task
          setActiveTab('tasks')
          showToast('Found task!', 'success')
        }}
      />
    </div>
  )
}
