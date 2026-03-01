'use client'

import { useState, useEffect } from 'react'
import { BarChart3, CheckCircle, Clock, AlertCircle, Activity } from 'lucide-react'

interface Metrics {
  totalTasks: number
  completedTasks: number
  tasksByStatus: Record<string, number>
  tasksByPriority: Record<string, number>
  completionRate: number
  avgCompletionTime?: number
  recentActivity: number
}

const statusLabels: Record<string, string> = {
  inbox: 'Inbox',
  planned: 'Planned',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  done: 'Done',
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-500',
  medium: 'bg-blue-500',
  high: 'bg-red-500',
}

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/metrics')
      if (res.ok) {
        const data = await res.json()
        setMetrics(data)
      }
    } catch (e) {
      console.error('Failed to fetch metrics', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 text-gray-400">
        Failed to load metrics
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Tasks',
      value: metrics.totalTasks,
      icon: BarChart3,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Completed',
      value: metrics.completedTasks,
      icon: CheckCircle,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Completion Rate',
      value: `${metrics.completionRate}%`,
      icon: Activity,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      label: 'Avg Days to Complete',
      value: metrics.avgCompletionTime ?? 'N/A',
      icon: Clock,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
    },
  ]

  return (
    <div className="bg-gray-900 rounded-lg p-4 md:p-6">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <BarChart3 size={20} />
        Metrics Dashboard
      </h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {statCards.map((card) => (
          <div key={card.label} className={`${card.bg} rounded-lg p-3 md:p-4`}>
            <div className={`${card.color} mb-1`}>
              <card.icon size={18} />
            </div>
            <p className="text-2xl font-bold text-white">{card.value}</p>
            <p className="text-xs text-gray-400">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Tasks by Status */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-400 mb-2">Tasks by Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {Object.entries(metrics.tasksByStatus).map(([status, count]) => (
            <div key={status} className="bg-gray-800 rounded p-2 text-center">
              <p className="text-lg font-semibold text-white">{count}</p>
              <p className="text-xs text-gray-400">{statusLabels[status] || status}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tasks by Priority */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-400 mb-2">Tasks by Priority</h3>
        <div className="flex gap-3">
          {Object.entries(metrics.tasksByPriority).map(([priority, count]) => (
            <div key={priority} className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400 capitalize">{priority}</span>
                <span className="text-sm text-white">{count}</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${priorityColors[priority] || 'bg-gray-500'}`}
                  style={{
                    width: metrics.totalTasks > 0 ? `${(count / metrics.totalTasks) * 100}%` : '0%',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Activity size={14} />
        <span>{metrics.recentActivity} events in the last 24 hours</span>
      </div>
    </div>
  )
}
