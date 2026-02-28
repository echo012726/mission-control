import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mission Control',
  description: 'Task management and agent monitoring',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
