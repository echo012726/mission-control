'use client'
import { useState, useEffect } from 'react'

interface Memory {
  id: string
  title: string
  content: string
  preview: string
  source: string
  updatedAt: number
}

export default function MemoryPage() {
  const [query, setQuery] = useState('')
  const [memories, setMemories] = useState<Memory[]>([])
  const [filtered, setFiltered] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadMemories()
  }, [])

  async function loadMemories() {
    try {
      const res = await fetch('/api/memories')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setMemories(data)
      setFiltered(data)
    } catch (err) {
      setError('Could not load memories (API not available in dev)')
      setLoading(false)
    }
  }

  function search() {
    if (!query.trim()) {
      setFiltered(memories)
      setSearched(false)
      return
    }
    setSearched(true)
    const lowerQuery = query.toLowerCase()
    const results = memories.filter(m => 
      m.title.toLowerCase().includes(lowerQuery) ||
      m.content.toLowerCase().includes(lowerQuery)
    )
    setFiltered(results)
  }

  useEffect(() => {
    if (query.trim()) {
      search()
    } else {
      setFiltered(memories)
      setSearched(false)
    }
  }, [query])

  function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric' 
    })
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-4">Memory Browser</h2>
        <p className="text-gray-500">Loading memories...</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Memory Browser</h2>
      <p className="text-sm text-muted-foreground mb-4">Search and browse OpenClaw memories</p>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search memories..."
          className="border rounded px-3 py-2 flex-1"
        />
      </div>

      {error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded mb-4">
          <p className="text-sm text-yellow-700">{error}</p>
          <p className="text-xs text-yellow-600 mt-1">Showing demo memories instead:</p>
        </div>
      )}

      {searched && (
        <p className="text-sm text-gray-500 mb-4">Found {filtered.length} results for "{query}"</p>
      )}

      <div className="space-y-3">
        {filtered.map(mem => (
          <div key={mem.id} className="border rounded-lg p-4 bg-white hover:border-blue-300 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold">{mem.title}</h3>
              <span className="text-xs text-gray-400">{formatDate(mem.updatedAt)}</span>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">{mem.preview}</p>
            <div className="text-xs text-gray-400 mt-2">{mem.source}</div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && !loading && (
        <p className="text-gray-500">No memories found</p>
      )}
    </div>
  )
}
