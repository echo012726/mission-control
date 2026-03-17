'use client'
import { useState } from 'react'
import { Users, Lock, Eye, Link, Copy, Check, Send } from 'lucide-react'

type ClientView = {
  id: string
  name: string
  url: string
  views: number
  lastAccessed: string
}

export default function ClientPortal() {
  const [views, setViews] = useState<ClientView[]>([
    { id: '1', name: 'ACME Corp Project', url: 'https://mc.nexus/p/acme123', views: 42, lastAccessed: '2h ago' },
    { id: '2', name: 'Design Assets Review', url: 'https://mc.nexus/p/des456', views: 12, lastAccessed: '1d ago' },
  ])
  const [copied, setCopied] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')

  const copyLink = (id: string, url: string) => {
    navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const createView = () => {
    if (newName) {
      setViews([...views, { id: Date.now().toString(), name: newName, url: `https://mc.nexus/p/${Math.random().toString(36).substr(2, 6)}`, views: 0, lastAccessed: 'Never' }])
      setNewName('')
      setShowNew(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium">Client Portals</h3>
            <p className="text-sm text-gray-500">Share secure project views</p>
          </div>
        </div>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm">
          <Plus className="w-4 h-4" /> New Portal
        </button>
      </div>

      {showNew && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2"><Lock className="w-4 h-4" /> New Secure View</h4>
          <input 
            value={newName} 
            onChange={e => setNewName(e.target.value)} 
            placeholder="Project Name..." 
            className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-800"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowNew(false)} className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            <button onClick={createView} className="px-3 py-1 bg-blue-600 text-white rounded text-sm flex items-center gap-1">
              <Send className="w-4 h-4" /> Create
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {views.map(v => (
          <div key={v.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-lg hover:border-blue-300 transition-colors">
            <div>
              <p className="font-medium flex items-center gap-2">
                {v.name}
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-500 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> {v.views} views
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Link className="w-3 h-3" /> {v.url}
              </p>
            </div>
            
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="text-xs text-gray-400 mr-2 text-right">
                <p>Last seen</p>
                <p>{v.lastAccessed}</p>
              </div>
              <button 
                onClick={() => copyLink(v.id, v.url)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  copied === v.id ? 'bg-green-100 text-green-700' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                }`}
              >
                {copied === v.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied === v.id ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Plus({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14"></path>
      <path d="M12 5v14"></path>
    </svg>
  )
}
