'use client'

import { useState, useEffect } from 'react'
import { Webhook, Plus, Trash2, Edit, Power, PowerOff, MessageSquare } from 'lucide-react'
import type { Webhook as WebhookType } from '@/types'

const EVENT_TYPES = [
  'task_created',
  'task_updated',
  'task_completed',
  'task_moved',
  'agent_heartbeat',
  'agent_error',
  'approval_requested',
  'approval_approved',
  'approval_rejected',
]

export default function WebhooksPanel() {
  const [webhooks, setWebhooks] = useState<WebhookType[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<WebhookType | null>(null)
  const [form, setForm] = useState({
    name: '',
    url: '',
    events: [] as string[],
    enabled: true,
    secret: '',
  })

  useEffect(() => {
    fetchWebhooks()
  }, [])

  const fetchWebhooks = async () => {
    try {
      const res = await fetch('/api/...?token=marcus2026&&webhooks', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setWebhooks(data)
      }
    } catch (e) {
      console.error('Failed to fetch webhooks', e)
    }
  }

  const handleSubmit = async () => {
    if (!form.name || !form.url) return

    try {
      if (editingWebhook) {
        await fetch(`/api/webhooks/${editingWebhook.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
          credentials: 'include',
        })
      } else {
        await fetch('/api/...?token=marcus2026&&webhooks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
          credentials: 'include',
        })
      }
      setForm({ name: '', url: '', events: [], enabled: true, secret: '' })
      setShowModal(false)
      setEditingWebhook(null)
      fetchWebhooks()
    } catch (e) {
      console.error('Failed to save webhook', e)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this webhook?')) return
    try {
      await fetch(`/api/webhooks/${id}`, { method: 'DELETE', credentials: 'include' })
      fetchWebhooks()
    } catch (e) {
      console.error('Failed to delete webhook', e)
    }
  }

  const handleToggle = async (webhook: WebhookType) => {
    try {
      await fetch(`/api/webhooks/${webhook.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !webhook.enabled }),
        credentials: 'include',
      })
      fetchWebhooks()
    } catch (e) {
      console.error('Failed to toggle webhook', e)
    }
  }

  const openEdit = (webhook: WebhookType) => {
    setEditingWebhook(webhook)
    setForm({
      name: webhook.name,
      url: webhook.url,
      events: JSON.parse(webhook.events || '[]'),
      enabled: webhook.enabled,
      secret: webhook.secret || '',
    })
    setShowModal(true)
  }

  const toggleEvent = (event: string) => {
    setForm((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }))
  }

  const addDiscordWebhook = () => {
    setForm({
      name: 'Discord Alerts',
      url: '',
      events: ['task_created', 'task_updated', 'task_completed'],
      enabled: true,
      secret: '',
    })
    setEditingWebhook(null)
    setShowModal(true)
  }

  const testWebhook = async (webhook: WebhookType) => {
    if (!confirm(`Send test message to ${webhook.name}?`)) return
    
    try {
      const res = await fetch(`/api/webhooks/${webhook.id}/test`, {
        method: 'POST',
        credentials: 'include',
      })
      if (res.ok) {
        alert('Test message sent! Check your Discord.')
      } else {
        alert('Failed to send test message')
      }
    } catch (e) {
      alert('Error sending test: ' + e)
    }
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Webhook size={20} />
          Webhooks
        </h2>
        <div className="flex gap-2">
          <button
            onClick={addDiscordWebhook}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-sm"
            title="Add Discord webhook preset"
          >
            <MessageSquare size={14} />
            Discord
          </button>
          <button
            onClick={() => {
              setEditingWebhook(null)
              setForm({ name: '', url: '', events: [], enabled: true, secret: '' })
              setShowModal(true)
            }}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </div>

      {webhooks.length === 0 ? (
        <p className="text-gray-400 text-sm">No webhooks configured</p>
      ) : (
        <div className="space-y-2">
          {webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className={`bg-gray-800 rounded p-3 flex items-center justify-between ${
                !webhook.enabled ? 'opacity-50' : ''
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-white font-medium truncate">{webhook.name}</p>
                <p className="text-gray-400 text-xs truncate">{webhook.url}</p>
                <p className="text-gray-500 text-xs mt-1">
                  Events: {JSON.parse(webhook.events || '[]').join(', ') || 'All'}
                </p>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={() => handleToggle(webhook)}
                  className={`p-1.5 rounded ${
                    webhook.enabled ? 'text-green-400' : 'text-gray-500'
                  }`}
                  title={webhook.enabled ? 'Disable' : 'Enable'}
                >
                  {webhook.enabled ? <Power size={16} /> : <PowerOff size={16} />}
                </button>
                <button
                  onClick={() => openEdit(webhook)}
                  className="p-1.5 text-gray-400 hover:text-white rounded"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => testWebhook(webhook)}
                  className="p-1.5 text-gray-400 hover:text-green-400 rounded"
                  title="Send test message"
                >
                  <MessageSquare size={16} />
                </button>
                <button
                  onClick={() => handleDelete(webhook.id)}
                  className="p-1.5 text-gray-400 hover:text-red-400 rounded"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingWebhook ? 'Edit Webhook' : 'Add Webhook'}
            </h3>
            <input
              type="text"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white mb-3"
            />
            <input
              type="url"
              placeholder="URL (https://...)"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white mb-3"
            />
            <input
              type="text"
              placeholder="Secret (optional)"
              value={form.secret}
              onChange={(e) => setForm({ ...form, secret: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white mb-3"
            />
            <div className="mb-4">
              <p className="text-gray-400 text-sm mb-2">Events to trigger on:</p>
              <div className="flex flex-wrap gap-1">
                {EVENT_TYPES.map((event) => (
                  <button
                    key={event}
                    onClick={() => toggleEvent(event)}
                    className={`text-xs px-2 py-1 rounded ${
                      form.events.includes(event)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {event}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
              >
                {editingWebhook ? 'Save' : 'Create'}
              </button>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingWebhook(null)
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
