'use client'
import { useState, useEffect } from 'react'

interface CronJob {
  id: string
  name: string
  schedule: string
  nextRun: number
  status: string
}

export default function CronWidget() {
  const [jobs, setJobs] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJobs()
  }, [])

  async function fetchJobs() {
    try {
      const res = await fetch('/api/cron')
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setJobs(data)
    } catch (e) {
      // Demo data
      setJobs([
        { id: 'daily', name: 'Daily Usage Report', schedule: 'Daily 9pm PT', nextRun: Date.now() + 43200000, status: 'active' },
        { id: 'weekly', name: 'Weekly Usage Report', schedule: 'Sun 4am PT', nextRun: Date.now() + 172800000, status: 'active' },
        { id: 'heartbeat', name: 'Heartbeat', schedule: '3x daily', nextRun: Date.now() + 28800000, status: 'active' },
      ])
    } finally {
      setLoading(false)
    }
  }

  function formatNextRun(ts: number) {
    const diff = ts - Date.now()
    if (diff < 0) return 'Now'
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return '< 1 hour'
    if (hours < 24) return `${hours}h`
    return `${Math.floor(hours / 24)}d`
  }

  if (loading) {
    return (
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">⏰</span>
          <h3 className="font-semibold">Cron Jobs</h3>
        </div>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">⏰</span>
          <h3 className="font-semibold">Cron Jobs</h3>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
          {jobs.length} active
        </span>
      </div>

      <div className="space-y-2">
        {jobs.map(job => (
          <div key={job.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <div>
              <div className="font-medium text-sm">{job.name}</div>
              <div className="text-xs text-gray-500">{job.schedule}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">Next</div>
              <div className="text-sm font-medium">{formatNextRun(job.nextRun)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
