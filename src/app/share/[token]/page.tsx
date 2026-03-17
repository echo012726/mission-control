'use client'

import { useState, useEffect, use } from 'react'
import { useSearchParams } from 'next/navigation'

interface SharedDashboard {
  id: string
  name: string
  widgets: any[]
  settings: any
  isShared: boolean
  expiresAt?: string
}

export default function SharedDashboardPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const searchParams = useSearchParams()
  const passwordParam = searchParams.get('password')
  
  const [dashboard, setDashboard] = useState<SharedDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [passwordRequired, setPasswordRequired] = useState(false)
  const [password, setPassword] = useState('')
  const [checkingPassword, setCheckingPassword] = useState(false)

  const fetchDashboard = async (pwd?: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const url = pwd 
        ? `/api/share/${token}?password=${encodeURIComponent(pwd)}`
        : `/api/share/${token}`
      
      const res = await fetch(url)
      const data = await res.json()
      
      if (res.status === 401 && data.hasPassword) {
        setPasswordRequired(true)
        setLoading(false)
        return
      }
      
      if (!res.ok) {
        setError(data.error || 'Failed to load shared dashboard')
        setLoading(false)
        return
      }
      
      setDashboard(data)
    } catch (err) {
      setError('Failed to load shared dashboard')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchDashboard(passwordParam || undefined)
  }, [token, passwordParam])

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCheckingPassword(true)
    fetchDashboard(password)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading shared dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Unable to Load Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400">{error}</p>
        </div>
      </div>
    )
  }

  if (passwordRequired) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 max-w-md w-full shadow-lg">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Password Protected</h1>
            <p className="text-slate-600 dark:text-slate-400">This dashboard is password protected. Please enter the password to view.</p>
          </div>
          
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/30 mb-4"
              required
            />
            <button
              type="submit"
              disabled={checkingPassword}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {checkingPassword ? 'Verifying...' : 'View Dashboard'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (!dashboard) return null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">{dashboard.name}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Shared Dashboard
              </p>
            </div>
          </div>
          
          {dashboard.expiresAt && (
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Expires: {new Date(dashboard.expiresAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </header>

      {/* Dashboard Widgets */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboard.widgets.map((widget: any, index: number) => (
            <div 
              key={index}
              className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{getWidgetIcon(widget.type)}</span>
                <h3 className="font-semibold text-slate-800 dark:text-white">
                  {getWidgetTitle(widget.type)}
                </h3>
              </div>
              <div className="text-slate-600 dark:text-slate-400 text-sm">
                {widget.type === 'kanban' && 'Kanban board with task management'}
                {widget.type === 'agents' && 'Agent status and monitoring'}
                {widget.type === 'activity' && 'Recent activity feed'}
                {widget.type === 'metrics' && 'Performance metrics'}
                {widget.type === 'streaks' && 'Daily streak tracking'}
                {widget.type === 'timer' && 'Time tracking widget'}
                {widget.type === 'subtasks' && 'Subtasks overview'}
                {widget.type === 'prioritymatrix' && 'Priority matrix (Eisenhower)'}
                {widget.type === 'weeklyreport' && 'Weekly productivity report'}
                {widget.type === 'todoist' && 'Todoist sync widget'}
                {widget.type === 'webhook' && 'Webhook management'}
                {!widget.type && 'Custom widget'}
              </div>
            </div>
          ))}
          
          {(!dashboard.widgets || dashboard.widgets.length === 0) && (
            <div className="col-span-full text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">No widgets in this shared dashboard</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <p>Powered by Mission Control</p>
          <a href="/" className="text-green-600 hover:text-green-700">Create your own dashboard →</a>
        </div>
      </footer>
    </div>
  )
}

function getWidgetIcon(type?: string): string {
  const icons: Record<string, string> = {
    kanban: '📋',
    agents: '🤖',
    activity: '📊',
    metrics: '📈',
    streaks: '🔥',
    timer: '⏱️',
    subtasks: '✅',
    prioritymatrix: '🎯',
    weeklyreport: '📅',
    todoist: '✓',
    webhook: '🔗',
  }
  return icons[type || ''] || '📦'
}

function getWidgetTitle(type?: string): string {
  const titles: Record<string, string> = {
    kanban: 'Kanban Board',
    agents: 'Agent Panel',
    activity: 'Activity',
    metrics: 'Metrics',
    streaks: 'Streaks',
    timer: 'Time Tracker',
    subtasks: 'Subtasks',
    prioritymatrix: 'Priority Matrix',
    weeklyreport: 'Weekly Report',
    todoist: 'Todoist Sync',
    webhook: 'Webhooks',
  }
  return titles[type || ''] || 'Widget'
}
