'use client'
import { useState } from 'react'

interface Link {
  id: string
  name: string
  url: string
  icon: string
}

const DEFAULT_LINKS: Link[] = [
  { id: 'mc', name: 'Mission Control', url: 'https://mission-control-master-navy.vercel.app', icon: '🚀' },
  { id: 'gmail', name: 'Gmail', url: 'https://mail.google.com', icon: '✉️' },
  { id: 'github', name: 'GitHub', url: 'https://github.com/echo012726', icon: '🐙' },
  { id: 'discord', name: 'Discord', url: 'https://discord.com', icon: '💬' },
  { id: 'polymarket', name: 'Polymarket', url: 'https://polymarket.com', icon: '📈' },
  { id: 'vercel', name: 'Vercel', url: 'https://vercel.com/dashboard', icon: '▲' },
  { id: 'openclaw', name: 'OpenClaw', url: 'http://localhost:8080', icon: '🦞' },
  { id: 'obsidian', name: 'Obsidian', url: 'obsidian://open?vault=Echo', icon: '💎' },
]

export default function LinksWidget() {
  const [links] = useState<Link[]>(DEFAULT_LINKS)

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🔗</span>
        <h3 className="font-semibold">Quick Links</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {links.map(link => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 transition-colors text-sm"
          >
            <span>{link.icon}</span>
            <span className="truncate">{link.name}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
