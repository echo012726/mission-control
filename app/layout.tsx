import './globals.css'
import Link from 'next/link'

export const metadata = {
  title: 'Mission Control',
  description: 'OpenClaw Mission Control dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex">
          <aside className="w-64 border-r p-4">
            <h1 className="text-xl font-bold mb-4">Mission Control</h1>
            <nav className="flex flex-col gap-2">
              <Link href="/" className="text-sm text-primary">Dashboard</Link>
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
