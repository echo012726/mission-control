'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Loader2, Trash2, Clock, Bell, User, Hash } from 'lucide-react'
import { CronJob } from '@/types'
import { useToast } from '@/components/Toast'

// Parse reminder payload to extract human-readable parts
function parseReminderPayload(command: string): { displayText: string; recipient: string; channel: string } {
  // Try to extract the human-readable reminder text from the command
  // Commands typically look like: "Send a reminder to recipient: Check in with John about project status"
  // or "DM recipient: Don't forget the meeting at 3pm"
  
  let displayText = command
  let recipient = 'Unknown'
  let channel = 'DM'
  
  // Try various patterns
  const reminderMatch = command.match(/(?:remind|reminder to|notify)\s+(?:user|recipient|channel)?\s*[:\-]?\s*(.+)/i)
  const dmMatch = command.match(/(?:DM|send to|message)\s+([^\s:]+)/i)
  const slackMatch = command.match(/(?:slack|channel)\s+#?([^\s:]+)/i)
  
  if (reminderMatch) {
    displayText = reminderMatch[1].trim()
  }
  
  if (dmMatch) {
    recipient = dmMatch[1].trim()
    channel = 'DM'
  } else if (slackMatch) {
    recipient = '#' + slackMatch[1].trim()
    channel = 'Slack'
  }
  
  // Clean up the display text - remove any agent instructions prefix
  displayText = displayText
    .replace(/^(?:the agent should|please |could you |would you mind )\s*/i, '')
    .replace(/^send (?:a )?(?:reminder |message )?/i, '')
    .trim()
  
  // If still too long or looks like raw payload, use a truncated version
  if (displayText.length > 100 || !displayText.includes(' ')) {
    displayText = command.slice(0, 100) + (command.length > 100 ? '...' : '')
  }
  
  return { displayText, recipient, channel }
}

function formatReminderTime(dateStr?: string | null): string {
  if (!dateStr) return 'Not scheduled'
  const date = new Date(dateStr)
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export default function RemindersMonitor() {
  const [reminders, setReminders] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'disabled'>('all')
  const { showToast } = useToast()

  const fetchReminders = async () => {
    setLoading(true)
    try {
      // Fetch cron jobs filtered by "reminder" tag
      const res = await fetch('/api/...?token=marcus2026&&cron?tags=reminder', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setReminders(data)
      } else {
        // Fallback: fetch all and filter client-side if API doesn't support tags yet
        const allRes = await fetch('/api/...?token=marcus2026&&cron', { credentials: 'include' })
        if (allRes.ok) {
          const allData = await allRes.json()
          const reminderJobs = allData.filter((job: CronJob) => {
            try {
              const tags = JSON.parse(job.tags || '[]')
              return tags.includes('reminder')
            } catch {
              return false
            }
          })
          setReminders(reminderJobs)
        }
      }
    } catch (e) {
      console.error('Failed to fetch reminders', e)
      showToast('Failed to load reminders', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReminders()
  }, [])

  const handleDeleteReminder = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return

    try {
      const res = await fetch(`/api/cron/${jobId}`, { 
        method: 'DELETE', 
        credentials: 'include' 
      })
      if (res.ok) {
        showToast('Reminder deleted', 'success')
        fetchReminders()
      }
    } catch (e) {
      console.error('Failed to delete reminder', e)
      showToast('Failed to delete reminder', 'error')
    }
  }

  const filteredReminders = reminders.filter((job) => {
    if (filter === 'active') return job.enabled
    if (filter === 'disabled') return !job.enabled
    return true
  })

  const activeCount = reminders.filter(r => r.enabled).length
  const disabledCount = reminders.filter(r => !r.enabled).length

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <Bell size={18} />
          Reminders
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReminders}
            disabled={loading}
            className="text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 pt-3 pb-2 border-b border-gray-800">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            All ({reminders.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              filter === 'active' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilter('disabled')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              filter === 'disabled' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Disabled ({disabledCount})
          </button>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-blue-500" size={24} />
          </div>
        ) : filteredReminders.length === 0 ? (
          <div className="text-center py-8">
            <Bell size={40} className="mx-auto text-gray-600 mb-3" />
            <p className="text-gray-500 text-sm">
              {filter === 'all' 
                ? 'No reminders configured' 
                : `No ${filter} reminders`
              }
            </p>
            <p className="text-gray-600 text-xs mt-1">
              Reminders created via the reminders skill will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReminders.map((reminder) => {
              const { displayText, recipient, channel } = parseReminderPayload(reminder.command)
              
              return (
                <div
                  key={reminder.id}
                  className={`bg-gray-800 rounded-lg p-4 ${!reminder.enabled ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Human-readable reminder text */}
                      <p className="text-white font-medium text-sm leading-relaxed">
                        "{displayText}"
                      </p>
                      
                      {/* Metadata row */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        {/* Recipient */}
                        <span className="flex items-center gap-1">
                          <User size={12} />
                          {recipient}
                        </span>
                        
                        {/* Channel */}
                        <span className="flex items-center gap-1">
                          <Hash size={12} />
                          {channel}
                        </span>
                        
                        {/* Scheduled time */}
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatReminderTime(reminder.nextRun)}
                        </span>
                      </div>
                      
                      {/* Schedule info */}
                      <div className="mt-2 text-xs text-gray-500 font-mono">
                        {reminder.schedule}
                      </div>
                    </div>
                    
                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteReminder(reminder.id)}
                      className="p-1.5 text-red-400 hover:text-red-300 rounded transition-colors flex-shrink-0"
                      title="Delete reminder"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  {/* Last error if any */}
                  {reminder.lastError && (
                    <div className="mt-2 pt-2 border-t border-gray-700">
                      <p className="text-red-400 text-xs flex items-center gap-1">
                        <span>⚠️</span>
                        {reminder.lastError}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
