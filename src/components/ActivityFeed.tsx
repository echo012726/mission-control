'use client'

import { useState, useEffect } from 'react'

interface Activity {
  id: string
  type: string
  payload: string
  createdAt: string
}

const typeLabels: Record<string, string> = {
  task_created: 'Task created',
  task_moved: 'Task moved',
  agent_heartbeat: 'Agent heartbeat',
  agent_error: 'Agent error',
  login: 'User logged in',
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(false)

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/activity?limit=20')
      if (res.ok) {
        const data = await res.json()
        setActivities(data)
      }
    } catch (e) {
      console.error('Failed to fetch activities', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
    const interval = setInterval(fetchActivities, 15000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return date.toLocaleTimeString()
  }

  const getActivityDescription = (activity: Activity) => {
    const label = typeLabels[activity.type] || activity.type
    try {
      const payload = JSON.parse(activity.payload)
      if (activity.type === 'task_created') {
        return `${label}: ${payload.title}`
      }
      if (activity.type === 'task_moved') {
        return `${label}: ${payload.from} → ${payload.to}`
      }
      if (activity.type === 'login') {
        return `${label}`
      }
    } catch {
      // Payload not JSON
    }
    return label
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h2 className="font-semibold text-white">Activity</h2>
        <button
          onClick={fetchActivities}
          disabled={loading}
          className="text-gray-400 hover:text-white disabled:opacity-50 text-sm"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      <div className="p-4 max-h-[300px] overflow-y-auto">
        {activities.length === 0 ? (
          <p className="text-gray-500 text-sm">No activity yet</p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="text-sm">
                <p className="text-white">{getActivityDescription(activity)}</p>
                <p className="text-gray-500 text-xs">{formatTime(activity.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
