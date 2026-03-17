'use client'

import { useState } from 'react'
import { DollarSign, TrendingUp, Plus, Save } from 'lucide-react'

interface PassiveIncomeData {
  gumroad: {
    totalRevenue: number
    monthlyRevenue: number
    lastMonthRevenue: number
    salesCount: number
  }
  kdp: {
    monthlyRoyalties: number
    lastUpdated: string | null
  }
  updatedAt: string
}

export default function PassiveIncomeWidget() {
  const [data, setData] = useState<PassiveIncomeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [kdpInput, setKdpInput] = useState('')
  const [saved, setSaved] = useState(false)

  // Fetch data on mount
  useState(() => {
    fetch('/api/...?token=marcus2026&&passive-income')
      .then(res => res.json())
      .then(d => {
        setData(d)
        setKdpInput(d.kdp?.monthlyRoyalties?.toString() || '')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  })

  const handleSaveKDP = async () => {
    setSaving(true)
    try {
      await fetch('/api/...?token=marcus2026&&passive-income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyRoyalties: parseFloat(kdpInput) || 0 })
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error(e)
    }
    setSaving(false)
  }

  const totalPassive = (data?.gumroad?.monthlyRevenue || 0) + (data?.kdp?.monthlyRoyalties || 0)
  const lastMonthTotal = (data?.gumroad?.lastMonthRevenue || 0)
  const change = lastMonthTotal > 0 ? ((totalPassive - lastMonthTotal) / lastMonthTotal * 100).toFixed(1) : 0

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-slate-200 rounded w-1/2"></div>
          <div className="h-10 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-green-500/10">
          <DollarSign className="w-5 h-5 text-green-500" />
        </div>
        <h3 className="font-semibold text-slate-800">Passive Income</h3>
      </div>

      {/* Total This Month */}
      <div className="mb-4">
        <div className="text-3xl font-bold text-slate-900">
          ${totalPassive.toLocaleString()}
        </div>
        <div className="text-sm text-slate-500 flex items-center gap-1">
          <span className={Number(change) >= 0 ? 'text-green-600' : 'text-red-600'}>
            {Number(change) >= 0 ? '↑' : '↓'} {Math.abs(Number(change))}%
          </span>
          <span>vs last month</span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-xs text-slate-500 mb-1">Gumroad</div>
          <div className="font-semibold">${(data?.gumroad?.monthlyRevenue || 0).toLocaleString()}</div>
          <div className="text-xs text-slate-400">{data?.gumroad?.salesCount || 0} sales</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-xs text-slate-500 mb-1">KDP Royalties</div>
          <div className="font-semibold">${(data?.kdp?.monthlyRoyalties || 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Manual Entry */}
      <div className="border-t border-slate-100 pt-3">
        <label className="text-xs text-slate-500 block mb-2">Update KDP Monthly</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={kdpInput}
            onChange={e => setKdpInput(e.target.value)}
            placeholder="Enter amount"
            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/30"
          />
          <button
            onClick={handleSaveKDP}
            disabled={saving}
            className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
          >
            {saving ? '...' : saved ? '✓' : <Save className="w-4 h-4" />}
          </button>
        </div>
        {data?.kdp?.lastUpdated && (
          <div className="text-xs text-slate-400 mt-1">
            Last updated: {new Date(data.kdp.lastUpdated).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  )
}
