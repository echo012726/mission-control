'use client'

import { useState, useEffect } from 'react'
import { Plus, RefreshCw, Loader2, Play, Pause, Trash2, Clock, CheckCircle, XCircle, AlertCircle, Bell } from 'lucide-react'
import { CronJob } from '@/types'
import { useToast } from '@/components/Toast'

// Helper to check if a cron job is a reminder
function isReminder(job: CronJob): boolean {
  try {
    const tags = JSON.parse(job.tags || '[]')
    return tags.includes('reminder')
  } catch {
    return false
  }
}

export default function CronJobMonitor() {
  const [cronJobs, setCronJobs] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newJob, setNewJob] = useState({ name: '', schedule: '', command: '', isReminder: false })
  const [saving, setSaving] = useState(false)
  const [hideReminders, setHideReminders] = useState(false)
  const { showToast } = useToast()

  const fetchCronJobs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/...?token=marcus2026&&cron', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setCronJobs(data)
      }
    } catch (e) {
      console.error('Failed to fetch cron jobs', e)
      showToast('Failed to load cron jobs', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCronJobs()
  }, [])

  const handleAddJob = async () => {
    if (!newJob.name || !newJob.schedule || !newJob.command) {
      showToast('All fields are required', 'error')
      return
    }

    setSaving(true)
    try {
      const tags = newJob.isReminder ? ['reminder'] : []
      
      const res = await fetch('/api/...?token=marcus2026&&cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newJob.name,
          schedule: newJob.schedule,
          command: newJob.command,
          tags,
        }),
        credentials: 'include',
      })
      if (res.ok) {
        showToast('Cron job created', 'success')
        setNewJob({ name: '', schedule: '', command: '', isReminder: false })
        setShowAddModal(false)
        fetchCronJobs()
      } else {
        const err = await res.json()
        showToast(err.error || 'Failed to create cron job', 'error')
      }
    } catch (e) {
      console.error('Failed to create cron job', e)
      showToast('Failed to create cron job', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleJob = async (job: CronJob) => {
    try {
      const res = await fetch(`/api/cron/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !job.enabled }),
        credentials: 'include',
      })
      if (res.ok) {
        showToast(`Cron job ${job.enabled ? 'disabled' : 'enabled'}`, 'success')
        fetchCronJobs()
      }
    } catch (e) {
      console.error('Failed to toggle cron job', e)
      showToast('Failed to update cron job', 'error')
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this cron job?')) return

    try {
      const res = await fetch(`/api/cron/${jobId}`, { method: 'DELETE', credentials: 'include' })
      if (res.ok) {
        showToast('Cron job deleted', 'success')
        fetchCronJobs()
      }
    } catch (e) {
      console.error('Failed to delete cron job', e)
      showToast('Failed to delete cron job', 'error')
    }
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleString()
  }

  const statusIcons: Record<string, typeof CheckCircle> = {
    idle: Clock,
    running: Loader2,
    success: CheckCircle,
    failed: XCircle,
  }

  const statusColors: Record<string, string> = {
    idle: 'text-gray-400',
    running: 'text-blue-400',
    success: 'text-green-400',
    failed: 'text-red-400',
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <Clock size={18} />
          Cron Jobs
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHideReminders(!hideReminders)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              hideReminders 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title={hideReminders ? 'Show reminders' : 'Hide reminders'}
          >
            <Bell size={12} />
            {hideReminders ? 'Hidden' : 'Filter'}
          </button>
          <button
            onClick={fetchCronJobs}
            disabled={loading}
            className="text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm transition-colors"
          >
            <Plus size={14} />
            Add Job
          </button>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-blue-500" size={24} />
          </div>
        ) : (hideReminders ? cronJobs.filter(j => !isReminder(j)) : cronJobs).length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            {hideReminders ? 'No non-reminder cron jobs' : 'No cron jobs configured'}
          </p>
        ) : (
          <div className="space-y-3">
            {(hideReminders ? cronJobs.filter(j => !isReminder(j)) : cronJobs).map((job) => {
              const StatusIcon = statusIcons[job.status] || Clock
              return (
                <div
                  key={job.id}
                  className={`bg-gray-800 rounded-lg p-3 ${!job.enabled ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-medium truncate">{job.name}</h3>
                        {isReminder(job) && (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                            <Bell size={10} />
                            Reminder
                          </span>
                        )}
                        <StatusIcon size={14} className={statusColors[job.status]} />
                      </div>
                      <p className="text-gray-400 text-xs font-mono mt-1 truncate">{job.schedule}</p>
                      <p className="text-gray-500 text-xs mt-1 truncate">{job.command}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => handleToggleJob(job)}
                        className={`p-1.5 rounded transition-colors ${
                          job.enabled 
                            ? 'text-yellow-400 hover:text-yellow-300' 
                            : 'text-green-400 hover:text-green-300'
                        }`}
                        title={job.enabled ? 'Disable' : 'Enable'}
                      >
                        {job.enabled ? <Pause size={14} /> : <Play size={14} />}
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="p-1.5 text-red-400 hover:text-red-300 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>Last run: {formatDate(job.lastRun)}</span>
                    {job.lastError && (
                      <span className="text-red-400 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {job.lastError}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Cron Job Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Add Cron Job</h2>
            <input
              type="text"
              placeholder="Job name"
              value={newJob.name}
              onChange={(e) => setNewJob({ ...newJob, name: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Schedule (e.g., */5 * * * *)"
              value={newJob.schedule}
              onChange={(e) => setNewJob({ ...newJob, schedule: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <textarea
              placeholder="Command to execute"
              value={newJob.command}
              onChange={(e) => setNewJob({ ...newJob, command: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white mb-3 h-20 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={newJob.isReminder}
                onChange={(e) => setNewJob({ ...newJob, isReminder: e.target.checked })}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-300 text-sm flex items-center gap-1">
                <Bell size={14} />
                Mark as Reminder
              </span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleAddJob}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Add'}
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
