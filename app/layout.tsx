'use client'
import './globals.css'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || ''

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [convexStatus, setConvexStatus] = useState<'loading' | 'connected' | 'missing'>('loading')

  useEffect(() => {
    if (CONVEX_URL) {
      fetch(`${CONVEX_URL}/api/getTasks`, { method: 'POST', body: JSON.stringify({ args: {} }) })
        .then(() => setConvexStatus('connected'))
        .catch(() => setConvexStatus('missing'))
    } else {
      setConvexStatus('missing')
    }
  }, [])

  return (
    <html lang="en">
      <head>
        <title>Mission Control</title>
      </head>
      <body>
        <div className="min-h-screen flex">
          <aside className="w-64 border-r p-4">
            <h1 className="text-xl font-bold mb-4">Mission Control</h1>
            {convexStatus === 'connected' && <span className="text-xs text-green-500">● Connected</span>}
            {convexStatus === 'missing' && <span className="text-xs text-yellow-500">● Demo Mode</span>}
            <nav className="flex flex-col gap-2 mt-2">
              <Link href="/" className="text-sm">Dashboard</Link>
              <Link href="/tasks" className="text-sm">Tasks</Link>
              <Link href="/content" className="text-sm">Content</Link>
              <Link href="/calendar" className="text-sm">Calendar</Link>
              <Link href="/memory" className="text-sm">Memory</Link>
              <Link href="/team" className="text-sm">Team</Link>
              <Link href="/office" className="text-sm">Office</Link>
            </nav>
          </aside>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </body>
    </html>
  )
}
