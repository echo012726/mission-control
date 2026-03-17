'use client'
import { useState } from 'react'
import { Mail, Link2, Unlink, RefreshCw, Check } from 'lucide-react'

export default function GmailIntegration() {
  const [connected, setConnected] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const connect = () => {
    // OAuth flow would go here
    setConnected(true)
  }

  const sync = () => {
    setSyncing(true)
    setTimeout(() => setSyncing(false), 2000)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
            <Mail className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-medium">Gmail Integration</h3>
            <p className="text-sm text-gray-500">Sync tasks from starred emails</p>
          </div>
        </div>
        {connected ? (
          <button onClick={() => setConnected(false)} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">
            <Unlink className="w-4 h-4" /> Connected
          </button>
        ) : (
          <button onClick={connect} className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm">
            <Link2 className="w-4 h-4" /> Connect
          </button>
        )}
      </div>
      
      {connected && (
        <div className="flex gap-2">
          <button onClick={sync} disabled={syncing} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm">
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      )}
    </div>
  )
}
