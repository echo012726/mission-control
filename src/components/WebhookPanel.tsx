'use client'
import { useState } from 'react'
import { Webhook, Plus, Trash2, FlaskConical } from 'lucide-react'

type WebhookConfig = {
  id: string
  url: string
  event: string
  enabled: boolean
}

export default function WebhookPanel() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([])
  const [newUrl, setNewUrl] = useState('')
  const [newEvent, setNewEvent] = useState('task.created')

  const addWebhook = () => {
    if (newUrl) {
      setWebhooks([...webhooks, { id: Date.now().toString(), url: newUrl, event: newEvent, enabled: true }])
      setNewUrl('')
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium flex items-center gap-2"><Webhook className="w-4 h-4" /> Webhooks</h3>
      <div className="flex gap-2">
        <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://..." className="flex-1 p-2 border rounded text-sm" />
        <select value={newEvent} onChange={e => setNewEvent(e.target.value)} className="p-2 border rounded text-sm">
          <option value="task.created">Created</option>
          <option value="task.completed">Completed</option>
        </select>
        <button onClick={addWebhook} className="p-2 bg-blue-600 text-white rounded"><Plus className="w-4 h-4" /></button>
      </div>
      {webhooks.map(w => (
        <div key={w.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
          <div><p className="text-sm font-mono">{w.url}</p><p className="text-xs text-gray-500">{w.event}</p></div>
          <button onClick={() => setWebhooks(webhooks.filter(wh => wh.id !== w.id))} className="p-1 text-red-500"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
    </div>
  )
}
