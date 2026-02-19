'use client'
import { useState, useEffect } from 'react'

interface SystemStatus {
  uptime: number
  memory: { used: number; total: number }
  disk: { used: number; total: number }
  agents: { active: number; total: number }
  cronJobs: { active: number; nextRun: number }
}

export default function SystemWidget() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Demo data - would fetch from OpenClaw API in production
    setTimeout(() => {
      setStatus({
        uptime: 86400000 * 3 + 7200000, // 3 days + hours
        memory: { used: 2.4, total: 8 },
        disk: { used: 12, total: 50 },
        agents: { active: 2, total: 8 },
        cronJobs: { active: 5, nextRun: Date.now() + 300000 }
      })
      setLoading(false)
    }, 500)
  }, [])

  function formatUptime(ms: number) {
    const days = Math.floor(ms / 86400000)
    const hours = Math.floor((ms % 86400000) / 3600000)
    return `${days}d ${hours}h`
  }

  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) return <div className="text-sm text-gray-500">Loading...</div>

  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-semibold mb-3">System Status</h3>
      
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Uptime</span>
            <span>{status ? formatUptime(status.uptime) : '-'}</span>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">Memory</span>
            <span>{status?.memory.used}GB / {status?.memory.total}GB</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500" 
              style={{ width: `${((status?.memory.used || 0) / (status?.memory.total || 1)) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">Disk</span>
            <span>{status?.disk.used}GB / {status?.disk.total}GB</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500" 
              style={{ width: `${((status?.disk.used || 0) / (status?.disk.total || 1)) * 100}%` }}
            />
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Agents</span>
            <span>{status?.agents.active} / {status?.agents.total} active</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Cron Jobs</span>
            <span>{status?.cronJobs.active} scheduled</span>
          </div>
          <div className="text-xs text-gray-400">Next: {status ? formatTime(status.cronJobs.nextRun) : '-'}</div>
        </div>
      </div>
    </div>
  )
}
