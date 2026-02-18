'use client'
import { useState } from 'react'

interface Memory {
  id: string
  title: string
  content: string
  source: string
  createdAt: number
}

export default function MemoryPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Memory[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  // Demo memories - in production, these would come from OpenClaw's actual memory
  const DEMO_MEMORIES: Memory[] = [
    { id: '1', title: 'PolyMarket Bot Setup', content: 'Bot initialized on 2026-02-18 with $100 bankroll. Running in paper mode.', source: 'memory/polymarket.md', createdAt: Date.now() - 86400000 },
    { id: '2', title: 'Marcus Preferences', content: 'Prefers autonomy over time. Focus on practical execution.', source: 'USER.md', createdAt: Date.now() - 172800000 },
    { id: '3', title: 'Mission Control Launch', content: 'Project started 2026-02-18. Next.js 14 + Tailwind.', source: 'MEMORY.md', createdAt: Date.now() - 43200000 },
    { id: '4', title: 'Convex Backend', content: 'Schema defined with tasks, content, events, memories, agents tables.', source: 'convex/schema.ts', createdAt: Date.now() - 3600000 },
  ]

  async function search() {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    
    // Simulate search - in production, this would call OpenClaw's memory API
    await new Promise(r => setTimeout(r, 500))
    
    const lowerQuery = query.toLowerCase()
    const filtered = DEMO_MEMORIES.filter(m => 
      m.title.toLowerCase().includes(lowerQuery) ||
      m.content.toLowerCase().includes(lowerQuery)
    )
    setResults(filtered)
    setLoading(false)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Memory Browser</h2>
      <p className="text-sm text-muted-foreground mb-4">Search and browse saved memories from OpenClaw</p>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search memories..."
          className="border rounded px-3 py-2 flex-1"
          onKeyDown={(e) => e.key === 'Enter' && search()}
        />
        <button onClick={search} className="bg-blue-500 text-white px-6 py-2 rounded">Search</button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Searching...</div>
      ) : searched ? (
        <div>
          {results.length === 0 ? (
            <p className="text-gray-500">No memories found for "{query}"</p>
          ) : (
            <div className="space-y-3">
              {results.map(mem => (
                <div key={mem.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{mem.title}</h3>
                    <span className="text-xs text-gray-400">{mem.source}</span>
                  </div>
                  <p className="text-sm text-gray-600">{mem.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-500 mb-4">Recent memories:</p>
          <div className="space-y-3">
            {DEMO_MEMORIES.map(mem => (
              <div key={mem.id} className="border rounded-lg p-4 bg-white">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{mem.title}</h3>
                  <span className="text-xs text-gray-400">{mem.source}</span>
                </div>
                <p className="text-sm text-gray-600">{mem.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
