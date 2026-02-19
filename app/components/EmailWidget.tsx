'use client'
import { useState, useEffect } from 'react'

interface Email {
  id: string
  from: string
  subject: string
  date: number
  preview: string
}

export default function EmailWidget() {
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchEmails()
    const interval = setInterval(fetchEmails, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  async function fetchEmails() {
    try {
      const res = await fetch('/api/emails')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      if (Array.isArray(data)) {
        setEmails(data)
      }
    } catch (err) {
      setError('Could not load emails')
    } finally {
      setLoading(false)
    }
  }

  function formatDate(ts: number) {
    const d = new Date(ts)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
    
    if (diffDays === 0) {
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return d.toLocaleDateString('en-US', { weekday: 'short' })
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">✉️</span>
          <h3 className="font-semibold">Inbox</h3>
        </div>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">✉️</span>
          <h3 className="font-semibold">Inbox</h3>
          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
            {emails.length}
          </span>
        </div>
        <button 
          onClick={fetchEmails}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          ↻
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {emails.length === 0 ? (
          <p className="text-sm text-gray-500">No emails</p>
        ) : (
          emails.map(email => (
            <div key={email.id} className="p-2 hover:bg-gray-50 rounded cursor-pointer">
              <div className="flex justify-between items-start">
                <div className="font-medium text-sm truncate flex-1">{email.from}</div>
                <div className="text-xs text-gray-400 whitespace-nowrap ml-2">
                  {formatDate(email.date)}
                </div>
              </div>
              <div className="text-sm truncate">{email.subject}</div>
              {email.preview && (
                <div className="text-xs text-gray-500 truncate mt-1">{email.preview}</div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="mt-3 pt-2 border-t text-xs text-center">
        <a 
          href="https://mail.google.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          Open Gmail →
        </a>
      </div>
    </div>
  )
}
