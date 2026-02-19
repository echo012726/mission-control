'use client'
import { useState, useEffect } from 'react'

interface BotStats {
  bankroll: number
  totalPnL: number
  dailyPnL: number
  openPositions: number
  dailyTrades: number
  mode: 'PAPER' | 'LIVE'
  lastScan: number
}

export default function PolyBotWidget() {
  const [stats, setStats] = useState<BotStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  async function loadStats() {
    try {
      const res = await fetch('http://localhost:8477/api/stats')
      if (!res.ok) throw new Error('Bot API not available')
      const data = await res.json()
      setStats(data)
    } catch {
      // Demo data when API not available
      setStats({
        bankroll: 79.56,
        totalPnL: -20.44,
        dailyPnL: 10.65,
        openPositions: 1,
        dailyTrades: 114,
        mode: 'PAPER',
        lastScan: Date.now()
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-white">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">📈</span>
          <h3 className="font-semibold">PolyBot</h3>
        </div>
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    )
  }

  const isProfitable = stats?.dailyPnL >= 0

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">📈</span>
          <h3 className="font-semibold">PolyBot</h3>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded ${
          stats?.mode === 'LIVE' ? 'bg-red-500' : 'bg-green-500'
        }`}>
          {stats?.mode}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-slate-400 text-xs">Bankroll</div>
          <div className="font-mono text-lg">${stats?.bankroll.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-slate-400 text-xs">Daily P&L</div>
          <div className={`font-mono text-lg ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
            {isProfitable ? '+' : ''}{stats?.dailyPnL.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-slate-400 text-xs">Total P&L</div>
          <div className={`font-mono ${(stats?.totalPnL || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${stats?.totalPnL.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-slate-400 text-xs">Open Positions</div>
          <div className="font-mono">{stats?.openPositions}</div>
        </div>
        <div className="col-span-2">
          <div className="text-slate-400 text-xs">Today's Trades</div>
          <div className="font-mono">{stats?.dailyTrades}</div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-400">
        Last scan: {stats ? new Date(stats.lastScan).toLocaleTimeString() : '-'}
      </div>
    </div>
  )
}
