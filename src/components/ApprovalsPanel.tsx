'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, Shield } from 'lucide-react'
import type { Approval } from '@/types'

export default function ApprovalsPanel() {
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  useEffect(() => {
    fetchApprovals()
    const interval = setInterval(fetchApprovals, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchApprovals = async () => {
    try {
      const status = filter === 'all' ? '' : filter
      const res = await fetch(`/api/approvals?status=${status}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setApprovals(data)
      }
    } catch (e) {
      console.error('Failed to fetch approvals', e)
    }
  }

  useEffect(() => {
    fetchApprovals()
  }, [filter])

  const handleReview = async (id: string, status: 'approved' | 'rejected', reason?: string) => {
    try {
      await fetch('/api/...?token=marcus2026&&approvals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, reason }),
        credentials: 'include',
      })
      fetchApprovals()
    } catch (e) {
      console.error('Failed to review approval', e)
    }
  }

  const typeLabels: Record<string, string> = {
    task_completion: 'Task Completion',
    agent_provisioning: 'Agent Provisioning',
  }

  const statusConfig = {
    pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    approved: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
    rejected: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Shield size={20} />
          Approval Flows
        </h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {approvals.length === 0 ? (
        <p className="text-gray-400 text-sm">No pending approvals</p>
      ) : (
        <div className="space-y-2">
          {approvals.map((approval) => {
            const config = statusConfig[approval.status as keyof typeof statusConfig]
            const Icon = config?.icon || Clock

            return (
              <div key={approval.id} className="bg-gray-800 rounded p-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-white font-medium">
                      {typeLabels[approval.type] || approval.type}
                    </p>
                    <p className="text-gray-400 text-xs">
                      Task: {approval.taskId.slice(0, 8)}...
                    </p>
                  </div>
                  <span className={`${config?.bg} ${config?.color} px-2 py-1 rounded text-xs flex items-center gap-1`}>
                    <Icon size={12} />
                    {approval.status}
                  </span>
                </div>

                {approval.requestedBy && (
                  <p className="text-gray-500 text-xs mb-2">
                    Requested by: {approval.requestedBy}
                  </p>
                )}

                {approval.reason && (
                  <p className="text-gray-400 text-xs mb-2">{approval.reason}</p>
                )}

                {approval.status === 'pending' && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleReview(approval.id, 'approved')}
                      className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white py-1.5 rounded text-xs"
                    >
                      <CheckCircle size={12} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReview(approval.id, 'rejected')}
                      className="flex-1 flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded text-xs"
                    >
                      <XCircle size={12} />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
