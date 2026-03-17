'use client'
import { useState } from 'react'
import { Rss, Plus, Link, Trash2, ExternalLink, RefreshCw } from 'lucide-react'

type Feed = {
  id: string
  name: string
  url: string
  lastUpdated: string
  unread: number
}

export default function RSSFeed() {
  const [feeds, setFeeds] = useState<Feed[]>([
    { id: '1', name: 'Product Hunt', url: 'https://producthunt.com/feed', lastUpdated: '2h ago', unread: 12 },
    { id: '2', name: 'TechCrunch', url: 'https://techcrunch.com/feed', lastUpdated: '4h ago', unread: 8 },
  ])
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [syncing, setSyncing] = useState<string | null>(null)

  const addFeed = () => {
    if (newName && newUrl) {
      setFeeds([...feeds, { id: Date.now().toString(), name: newName, url: newUrl, lastUpdated: 'Just now', unread: 0 }])
      setNewName('')
      setNewUrl('')
      setShowAdd(false)
    }
  }

  const syncFeed = (id: string) => {
    setSyncing(id)
    setTimeout(() => {
      setFeeds(feeds.map(f => f.id === id ? { ...f, lastUpdated: 'Just now', unread: f.unread + 3 } : f))
      setSyncing(null)
    }, 1500)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
            <Rss className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-medium">RSS Feed</h3>
            <p className="text-sm text-gray-500">Subscribe to updates</p>
          </div>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white rounded-lg text-sm">
          <Plus className="w-4 h-4" /> Add Feed
        </button>
      </div>

      {showAdd && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
          <input 
            value={newName} 
            onChange={e => setNewName(e.target.value)} 
            placeholder="Feed Name..." 
            className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-800"
          />
          <input 
            value={newUrl} 
            onChange={e => setNewUrl(e.target.value)} 
            placeholder="https://..." 
            className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-800"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="px-3 py-1 text-sm text-gray-500">Cancel</button>
            <button onClick={addFeed} className="px-3 py-1 bg-orange-600 text-white rounded text-sm">Add</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {feeds.map(f => (
          <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full" />
              <div>
                <p className="font-medium text-sm">{f.name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Link className="w-3 h-3" /> Updated {f.lastUpdated}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {f.unread > 0 && (
                <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 text-xs rounded-full">
                  {f.unread} new
                </span>
              )}
              <button onClick={() => syncFeed(f.id)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-500 rounded">
                <RefreshCw className={`w-4 h-4 ${syncing === f.id ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={() => setFeeds(feeds.filter(x => x.id !== f.id))} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900 text-red-500 rounded">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
