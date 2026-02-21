'use client'
import './globals.css'
import Link from 'next/link'
import { ConvexClientProvider } from './ConvexClientProvider'

const isDemo = process.env.NEXT_PUBLIC_MODE !== 'live'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ConvexClientProvider>
          <div className="min-h-screen flex">
            <aside className="w-64 border-r p-4">
              <h1 className="text-xl font-bold mb-4">Mission Control</h1>
              <span className={`text-xs ${isDemo ? 'text-green-500' : 'text-blue-500'}`}>
                ● {isDemo ? 'Demo Mode' : 'Live'}
              </span>
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
        </ConvexClientProvider>
      </body>
    </html>
  )
}
