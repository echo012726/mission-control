'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

interface SyncStatus {
  lastSyncedAt: string | null
  totalSyncedTasks: number
}

interface SyncResult {
  success: boolean
  added?: number
  updated?: number
  skipped?: number
  message?: string
  error?: string
}

export default function TodoistWidget() {
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<SyncResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/todoist/sync?token=marcus2026')
      const data = await res.json()
      if (data.success) {
        setStatus(data)
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch status')
      }
    } catch (e) {
      setError('Failed to connect')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    setResult(null)
    try {
      const res = await fetch('/api/todoist/sync?token=marcus2026', { method: 'POST' })
      const data = await res.json()
      setResult(data)
      if (data.success) {
        await fetchStatus()
      }
    } catch (e) {
      setResult({ success: false, error: 'Sync failed' })
    }
    setSyncing(false)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-slate-200 rounded w-1/2"></div>
          <div className="h-10 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  const isConfigured = !error?.includes('not configured')

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${isConfigured ? 'bg-blue-500/10' : 'bg-red-500/10'}`}>
            <RefreshCw className={`w-5 h-5 ${isConfigured ? 'text-blue-500' : 'text-red-500'}`} />
          </div>
          <h3 className="font-semibold text-slate-800">Todoist Sync</h3>
        </div>
        <div className="flex items-center gap-1">
          {isConfigured ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500" />
          )}
        </div>
      </div>

      {!isConfigured ? (
        <div className="bg-red-50 rounded-lg p-3 mb-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-red-700">API Key Missing</div>
              <div className="text-xs text-red-600">Add TODOIST_API_KEY to .env</div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-500 mb-1">Last Sync</div>
              <div className="font-semibold text-sm">
                {status?.lastSyncedAt 
                  ? new Date(status.lastSyncedAt).toLocaleString()
                  : 'Never'}
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-500 mb-1">Synced Tasks</div>
              <div className="font-semibold text-sm">{status?.totalSyncedTasks || 0}</div>
            </div>
          </div>

          {/* Last result */}
          {result && (
            <div className={`rounded-lg p-3 mb-3 ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                {result.success ? result.message : result.error}
              </div>
            </div>
          )}

          {/* Sync button */}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>

          <div className="text-xs text-slate-400 mt-2 text-center">
            Imports new tasks from Todoist
          </div>
        </>
      )}
    </div>
  )
}
