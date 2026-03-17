'use client'
import { useState } from 'react'
import { FileText, Link2, RefreshCw, Check, FolderOpen, Plus } from 'lucide-react'

type Database = {
  id: string
  name: string
  synced: boolean
}

export default function NotionIntegration() {
  const [connected, setConnected] = useState(false)
  const [databases, setDatabases] = useState<Database[]>([])
  const [syncing, setSyncing] = useState<string | null>(null)

  const connect = () => setConnected(true)

  const addDatabase = (name: string) => {
    setDatabases([...databases, { id: Date.now().toString(), name, synced: false }])
  }

  const sync = (id: string) => {
    setSyncing(id)
    setTimeout(() => {
      setDatabases(databases.map(d => d.id === id ? { ...d, synced: true } : d))
      setSyncing(null)
    }, 1500)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 dark:bg-gray-600 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium">Notion Integration</h3>
            <p className="text-sm text-gray-500">Import from Notion databases</p>
          </div>
        </div>
        <button onClick={connect} className={`px-3 py-1.5 rounded-lg text-sm ${connected ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}>
          {connected ? <><Check className="w-4 h-4 inline mr-1"/> Connected</> : 'Connect'}
        </button>
      </div>

      {connected && (
        <div className="space-y-2">
          <button onClick={() => addDatabase('New Database')} className="flex items-center gap-2 text-sm text-blue-600">
            <Plus className="w-4 h-4" /> Add Database
          </button>
          
          {databases.map(d => (
            <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{d.name}</span>
              </div>
              <button onClick={() => sync(d.id)} disabled={syncing === d.id} className="px-2 py-1 text-xs bg-blue-600 text-white rounded">
                {syncing === d.id ? 'Syncing...' : d.synced ? 'Synced' : 'Sync'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
