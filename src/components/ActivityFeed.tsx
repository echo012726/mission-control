'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { RefreshCw, Loader2, Wifi, WifiOff, Activity, Bot, CheckCircle, Plus, Trash2, AlertTriangle, LogIn, FileText, Clock, Radio, Terminal } from 'lucide-react'
import { useSSE } from '@/lib/useSSE'

interface Activity {
  id: string
  type: string
  payload: string
  createdAt: string
}

interface EchoActivity {
  id: string
  type: 'cron_run' | 'approval' | 'subagent_result' | 'session_event' | 'heartbeat' | 'task_action'
  message: string
  agent?: string
  timestamp: number
  metadata?: Record<string, unknown>
}

const typeConfig: Record<string, { icon: typeof Activity; color: string; bg: string }> = {
  task_created: { icon: Plus, color: 'text-green-600', bg: 'bg-green-100' },
  task_moved: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
  task_completed: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  task_deleted: { icon: Trash2, color: 'text-red-600', bg: 'bg-red-100' },
  agent_heartbeat: { icon: Bot, color: 'text-purple-600', bg: 'bg-purple-100' },
  agent_error: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
  login: { icon: LogIn, color: 'text-cyan-600', bg: 'bg-cyan-100' },
}

const echoTypeConfig: Record<string, { icon: typeof Activity; color: string; bg: string }> = {
  cron_run: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  approval: { icon: CheckCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  subagent_result: { icon: Bot, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  session_event: { icon: Radio, color: 'text-green-400', bg: 'bg-green-500/20' },
  heartbeat: { icon: Activity, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  task_action: { icon: FileText, color: 'text-orange-400', bg: 'bg-orange-500/20' },
}

function ActivitySkeleton() {
  return (
    <div className="flex gap-3 p-2 bg-white rounded-lg border border-slate-100">
      <div className="w-8 h-8 bg-slate-100 rounded-lg skeleton" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-100 rounded w-3/4 skeleton" />
        <div className="h-3 bg-slate-50 rounded w-1/4 skeleton" />
      </div>
    </div>
  )
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [echoActivities, setEchoActivities] = useState<EchoActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  const [activeTab, setActiveTab] = useState<'mission' | 'echo'>('mission')
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchActivities = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/activity?limit=20')
      if (res.ok) {
        const data = await res.json()
        setActivities(data)
        setIsFirstLoad(false)
      }
    } catch (e) {
      console.error('Failed to fetch activities', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchEchoActivities = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/openclaw/activity?limit=20')
      if (res.ok) {
        const data = await res.json()
        setEchoActivities(data)
        setIsFirstLoad(false)
      }
    } catch (e) {
      console.error('Failed to fetch Echo activities', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'mission') {
      fetchActivities()
    } else {
      fetchEchoActivities()
    }
  }, [activeTab, fetchActivities, fetchEchoActivities])

  // Real-time updates via SSE
  const { connected } = useSSE({
    onActivity: (data) => {
      const newActivity = data as Activity
      setActivities(prev => {
        // Avoid duplicates
        if (prev.some(a => a.id === newActivity.id)) return prev
        return [newActivity, ...prev].slice(0, 20)
      })
    },
  })

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return date.toLocaleDateString()
  }

  const getActivityDescription = (activity: Activity) => {
    const label = activity.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    try {
      const payload = JSON.parse(activity.payload)
      if (activity.type === 'task_created') {
        return { title: label, subtitle: payload.title }
      }
      if (activity.type === 'task_moved') {
        return { title: label, subtitle: `${payload.from} → ${payload.to}` }
      }
      if (activity.type === 'task_completed') {
        return { title: label, subtitle: payload.title }
      }
      if (activity.type === 'login') {
        return { title: label, subtitle: payload.email || 'User' }
      }
      if (activity.type === 'agent_heartbeat') {
        return { title: label, subtitle: payload.agentId }
      }
      if (activity.type === 'agent_error') {
        return { title: label, subtitle: `${payload.agentId}: ${payload.error}` }
      }
    } catch {
      // Payload not JSON
    }
    return { title: label, subtitle: null }
  }

  const getActivityIcon = (type: string) => {
    const config = typeConfig[type] || typeConfig.task_created
    const Icon = config.icon
    return <Icon size={14} className={config.color} />
  }

  const getActivityBg = (type: string) => {
    const config = typeConfig[type]
    return config?.bg || 'bg-gray-500/20'
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Activity size={18} className="text-purple-400" />
          </div>
          <h2 className="font-semibold text-white">Activity</h2>
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
        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex bg-gray-800 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('mission')}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                activeTab === 'mission'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Mission
            </button>
            <button
              onClick={() => setActiveTab('echo')}
              className={`px-2 py-1 text-xs rounded-md flex items-center gap-1 transition-colors ${
                activeTab === 'echo'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Terminal size={10} />
              Echo
            </button>
          </div>
          <button
            onClick={() => activeTab === 'mission' ? fetchActivities() : fetchEchoActivities()}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all disabled:opacity-50"
            title="Refresh activity"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div 
        ref={containerRef}
        className="p-2 max-h-[320px] overflow-y-auto"
      >
        {activeTab === 'echo' ? (
          // Echo Activity Display
          <>
            {loading && isFirstLoad ? (
              <div className="space-y-1">
                <ActivitySkeleton />
                <ActivitySkeleton />
                <ActivitySkeleton />
              </div>
            ) : echoActivities.length === 0 ? (
              <div className="empty-state py-8">
                <div className="relative">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-600">
                    <rect x="8" y="12" width="48" height="40" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <path d="M8 20H56" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="16" cy="16" r="2" fill="currentColor"/>
                    <circle cx="24" cy="16" r="2" fill="currentColor"/>
                    <circle cx="32" cy="16" r="2" fill="currentColor"/>
                    <path d="M20 32L28 40L20 48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M32 48H44" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-purple-500/30 rounded-full animate-pulse"/>
                </div>
                <p className="text-gray-400 text-sm mt-4">No Echo activity</p>
                <p className="text-gray-600 text-xs mt-1">Echo's actions will appear here</p>
              </div>
            ) : (
              <div className="space-y-1">
                {echoActivities.map((activity, index) => {
                  const config = echoTypeConfig[activity.type] || echoTypeConfig.session_event
                  const Icon = config.icon
                  return (
                    <div 
                      key={activity.id}
                      className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors animate-fade-in-up"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className={`p-2 rounded-lg ${config.bg} shrink-0`}>
                        <Icon size={14} className={config.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{activity.message}</p>
                        {activity.agent && (
                          <p className="text-purple-400 text-xs truncate mt-0.5 flex items-center gap-1">
                            <Bot size={10} />
                            {activity.agent}
                          </p>
                        )}
                        <p className="text-gray-600 text-xs mt-1 flex items-center gap-1">
                          <Clock size={10} />
                          {formatTimestamp(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          // Mission Control Activity Display
          <>
            {loading && isFirstLoad ? (
              <div className="space-y-1">
                <ActivitySkeleton />
                <ActivitySkeleton />
                <ActivitySkeleton />
              </div>
            ) : activities.length === 0 ? (
              <div className="empty-state py-8">
                <div className="relative">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-600">
                    <rect x="8" y="12" width="48" height="40" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <path d="M8 20H56" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="16" cy="16" r="2" fill="currentColor"/>
                    <circle cx="24" cy="16" r="2" fill="currentColor"/>
                    <circle cx="32" cy="16" r="2" fill="currentColor"/>
                    <path d="M20 32L28 40L20 48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M32 48H44" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-purple-500/30 rounded-full animate-pulse"/>
                </div>
                <p className="text-gray-400 text-sm mt-4">No activity yet</p>
                <p className="text-gray-600 text-xs mt-1">Actions will appear here in real-time</p>
              </div>
            ) : (
              <div className="space-y-1">
                {activities.map((activity, index) => {
                  const { title, subtitle } = getActivityDescription(activity)
                  return (
                    <div 
                      key={activity.id}
                      className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors animate-fade-in-up"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className={`p-2 rounded-lg ${getActivityBg(activity.type)} shrink-0`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{title}</p>
                        {subtitle && (
                          <p className="text-gray-500 text-xs truncate mt-0.5">{subtitle}</p>
                        )}
                        <p className="text-gray-600 text-xs mt-1 flex items-center gap-1">
                          <Clock size={10} />
                          {formatTime(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Helper function for Echo timestamps
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = Math.floor((now.getTime() - timestamp) / 1000)
  
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return date.toLocaleDateString()
}
