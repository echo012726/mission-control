import { useState, useEffect } from 'react'
import { 
  Tag, 
  Plus, 
  X, 
  Trash2, 
  Edit3, 
  Check,
  Copy
} from 'lucide-react'
import { useToast } from '@/components/Toast'

interface Label {
  id: string
  name: string
  color: string
  createdAt: string
}

const defaultColors = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6366f1', // indigo
  '#78716c', // stone
]

export default function LabelsPanel() {
  const [labels, setLabels] = useState<Label[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(defaultColors[0])
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  const fetchLabels = async () => {
    try {
      const res = await fetch('/api/labels')
      if (res.ok) {
        const data = await res.json()
        setLabels(data)
      }
    } catch (error) {
      console.error('Failed to fetch labels:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLabels()
  }, [])

  const handleCreate = async () => {
    if (!newName.trim()) return
    
    setSaving(true)
    try {
      const res = await fetch('/api/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), color: newColor })
      })
      
      if (res.ok) {
        const label = await res.json()
        setLabels([...labels, label])
        setNewName('')
        setNewColor(defaultColors[Math.floor(Math.random() * defaultColors.length)])
        setShowCreate(false)
        showToast('Label created', 'success')
      } else {
        showToast('Failed to create label', 'error')
      }
    } catch (error) {
      console.error('Failed to create label:', error)
      showToast('Failed to create label', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this label? It will be removed from all tasks.')) return
    
    try {
      const res = await fetch(`/api/labels/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setLabels(labels.filter(l => l.id !== id))
        showToast('Label deleted', 'success')
      } else {
        showToast('Failed to delete label', 'error')
      }
    } catch (error) {
      console.error('Failed to delete label:', error)
      showToast('Failed to delete label', 'error')
    }
  }

  const handleUpdate = async (id: string) => {
    if (!newName.trim()) return
    
    setSaving(true)
    try {
      const res = await fetch(`/api/labels/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), color: newColor })
      })
      
      if (res.ok) {
        const updated = await res.json()
        setLabels(labels.map(l => l.id === id ? updated : l))
        setEditingId(null)
        setNewName('')
        showToast('Label updated', 'success')
      } else {
        showToast('Failed to update label', 'error')
      }
    } catch (error) {
      console.error('Failed to update label:', error)
      showToast('Failed to update label', 'error')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (label: Label) => {
    setEditingId(label.id)
    setNewName(label.name)
    setNewColor(label.color)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setNewName('')
    setNewColor(defaultColors[0])
  }

  const copyColor = (color: string) => {
    navigator.clipboard.writeText(color)
    showToast('Color copied!', 'success')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Tag className="w-6 h-6 text-indigo-600" />
          <h1 className="text-2xl font-bold">Labels</h1>
          <span className="text-gray-500 text-sm">({labels.length})</span>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Label
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-medium mb-3">Create New Label</h3>
          <div className="flex gap-3 items-start">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Label name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
            />
            <div className="flex gap-1">
              {defaultColors.map(color => (
                <button
                  key={color}
                  onClick={() => setNewColor(color)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    newColor === color ? 'ring-2 ring-offset-2 ring-indigo-600 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <button
              onClick={handleCreate}
              disabled={saving || !newName.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {saving ? '...' : <Check className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                setShowCreate(false)
                setNewName('')
              }}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Labels List */}
      {labels.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No labels yet</p>
          <p className="text-sm">Create your first label to organize tasks</p>
        </div>
      ) : (
        <div className="space-y-2">
          {labels.map(label => (
            <div
              key={label.id}
              className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              {editingId === label.id ? (
                <>
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: label.color }}
                  />
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                  <div className="flex gap-1">
                    {defaultColors.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewColor(color)}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          newColor === color ? 'ring-2 ring-offset-1 ring-indigo-600' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => handleUpdate(label.id)}
                    disabled={saving}
                    className="p-1 text-green-600 hover:text-green-700"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="flex-1 font-medium">{label.name}</span>
                  <button
                    onClick={() => copyColor(label.color)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Copy color"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => startEdit(label)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(label.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
