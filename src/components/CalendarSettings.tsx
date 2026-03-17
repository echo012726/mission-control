'use client'

import { useState, useEffect } from 'react'
import { Calendar, Link, RefreshCw, Check, X, Clock, ExternalLink } from 'lucide-react'

interface CalendarStatus {
  connected: boolean
  email?: string
  lastSyncAt?: string | null
  syncEnabled?: boolean
}

export default function CalendarSettings() {
  const [status, setStatus] = useState<CalendarStatus>({ connected: false })
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/calendar?action=status')
      const data = await res.json()
      setStatus(data)
    } catch (error) {
      console.error('Failed to fetch status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    setConnecting(true)
    setMessage('')
    try {
      const res = await fetch('/api/calendar?action=auth')
      const data = await res.json()
      if (data.authUrl) {
        window.location.href = data.authUrl
      }
    } catch (error) {
      console.error('Failed to initiate auth:', error)
      setMessage('Failed to connect')
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await fetch('/api/calendar?action=disconnect')
      setStatus({ connected: false })
      setMessage('Disconnected from Google Calendar')
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setMessage('')
    try {
      const res = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction: 'both' })
      })
      const data = await res.json()
      if (data.success) {
        setMessage('Sync completed successfully!')
        fetchStatus()
      } else {
        setMessage(data.error || 'Sync failed')
      }
    } catch (error) {
      console.error('Sync failed:', error)
      setMessage('Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const handleToggleSync = async () => {
    try {
      const newEnabled = !status.syncEnabled
      await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleSync', enabled: newEnabled })
      })
      setStatus({ ...status, syncEnabled: newEnabled })
    } catch (error) {
      console.error('Failed to toggle sync:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
          <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Google Calendar</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {status.connected ? 'Connected' : 'Not connected'}
          </p>
        </div>
        {status.connected && (
          <span className={`ml-auto px-2 py-1 text-xs rounded-full ${
            status.syncEnabled 
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            {status.syncEnabled ? 'Sync On' : 'Sync Off'}
          </span>
        )}
      </div>

      {status.connected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Link className="w-4 h-4" />
            <span>{status.email}</span>
          </div>

          {status.lastSyncAt && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span>Last synced: {new Date(status.lastSyncAt).toLocaleString()}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
            <button
              onClick={handleToggleSync}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {status.syncEnabled ? 'Disable' : 'Enable'}
            </button>
            <button
              onClick={handleDisconnect}
              className="px-3 py-2 border border-red-300 text-red-600 dark:border-red-700 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Connect your Google Calendar to sync tasks bidirectionally.
          </p>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            {connecting ? 'Connecting...' : 'Connect Google Calendar'}
          </button>
        </div>
      )}

      {message && (
        <div className={`mt-3 p-2 rounded text-sm ${
          message.includes('success') || message.includes('connected')
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
        }`}>
          {message}
        </div>
      )}
    </div>
  )
}
