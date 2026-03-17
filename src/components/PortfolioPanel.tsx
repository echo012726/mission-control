'use client'
import { useState, useEffect } from 'react'
import { 
  Folder, 
  Plus, 
  X, 
  Trash2, 
  Edit3, 
  Check,
  Copy,
  TrendingUp,
  CheckCircle2,
  Circle,
  DollarSign
} from 'lucide-react'
import { useToast } from '@/components/Toast'

interface Portfolio {
  id: string
  name: string
  color: string
  budget: number | null
  taskIds: string[]
  createdAt: string
}

interface PortfolioPanelProps {
  tasks: any[]
  selectedPortfolioId: string | null
  onSelectPortfolio: (id: string | null) => void
}

const defaultColors = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#8b5cf6', // purple
  '#f97316', // orange
  '#ef4444', // red
  '#14b8a6', // teal
  '#ec4899', // pink
  '#6366f1', // indigo
]

export default function PortfolioPanel({ tasks, selectedPortfolioId, onSelectPortfolio }: PortfolioPanelProps) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(defaultColors[0])
  const [newBudget, setNewBudget] = useState('')
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  // Load portfolios from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('mc_portfolios')
    if (stored) {
      try {
        setPortfolios(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse portfolios:', e)
      }
    }
    setLoading(false)
  }, [])

  // Save portfolios to localStorage
  const savePortfolios = (newPortfolios: Portfolio[]) => {
    localStorage.setItem('mc_portfolios', JSON.stringify(newPortfolios))
    setPortfolios(newPortfolios)
  }

  const handleCreate = () => {
    if (!newName.trim()) return
    
    const newPortfolio: Portfolio = {
      id: `portfolio_${Date.now()}`,
      name: newName.trim(),
      color: newColor,
      budget: newBudget ? parseFloat(newBudget) : null,
      taskIds: [],
      createdAt: new Date().toISOString()
    }
    
    savePortfolios([...portfolios, newPortfolio])
    setNewName('')
    setNewBudget('')
    setNewColor(defaultColors[Math.floor(Math.random() * defaultColors.length)])
    setShowCreate(false)
    showToast('Portfolio created', 'success')
  }

  const handleDelete = (id: string) => {
    if (!confirm('Delete this portfolio? Tasks will be unassigned but kept.')) return
    
    const newPortfolios = portfolios.filter(p => p.id !== id)
    savePortfolios(newPortfolios)
    if (selectedPortfolioId === id) {
      onSelectPortfolio(null)
    }
    showToast('Portfolio deleted', 'success')
  }

  const handleUpdate = (id: string) => {
    if (!newName.trim()) return
    
    setSaving(true)
    const newPortfolios = portfolios.map(p => {
      if (p.id === id) {
        return {
          ...p,
          name: newName.trim(),
          color: newColor,
          budget: newBudget ? parseFloat(newBudget) : null
        }
      }
      return p
    })
    savePortfolios(newPortfolios)
    setEditingId(null)
    setNewName('')
    setNewBudget('')
    showToast('Portfolio updated', 'success')
    setSaving(false)
  }

  const startEdit = (portfolio: Portfolio) => {
    setEditingId(portfolio.id)
    setNewName(portfolio.name)
    setNewColor(portfolio.color)
    setNewBudget(portfolio.budget?.toString() || '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setNewName('')
    setNewBudget('')
    setNewColor(defaultColors[0])
  }

  // Calculate stats for each portfolio
  const getPortfolioStats = (portfolio: Portfolio) => {
    const portfolioTasks = tasks.filter(t => t.portfolioId === portfolio.id)
    const total = portfolioTasks.length
    const completed = portfolioTasks.filter(t => t.status === 'done').length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, completionRate }
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
          <Folder className="w-6 h-6 text-indigo-600" />
          <h1 className="text-2xl font-bold">Portfolios</h1>
          <span className="text-gray-500 text-sm">({portfolios.length})</span>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Portfolio
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-medium mb-3">Create New Portfolio</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Portfolio name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
            />
            <div className="flex gap-3 items-center">
              <span className="text-sm text-gray-600">Color:</span>
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
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  placeholder="Budget (optional)"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
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
                  setNewBudget('')
                }}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Portfolios List */}
      {portfolios.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No portfolios yet</p>
          <p className="text-sm">Create your first portfolio to organize tasks</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* All Tasks Option */}
          <button
            onClick={() => onSelectPortfolio(null)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
              selectedPortfolioId === null
                ? 'bg-indigo-50 border-indigo-300'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-gray-400" />
            <span className="flex-1 font-medium">All Tasks</span>
            <span className="text-sm text-gray-500">{tasks.length}</span>
          </button>

          {portfolios.map(portfolio => {
            const stats = getPortfolioStats(portfolio)
            return (
              <div
                key={portfolio.id}
                className={`p-3 rounded-lg border transition-colors ${
                  selectedPortfolioId === portfolio.id
                    ? 'bg-indigo-50 border-indigo-300'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                {editingId === portfolio.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
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
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={newBudget}
                        onChange={(e) => setNewBudget(e.target.value)}
                        placeholder="Budget"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => handleUpdate(portfolio.id)}
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
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onSelectPortfolio(portfolio.id)}
                      className="flex items-center gap-3 flex-1"
                    >
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: portfolio.color }}
                      />
                      <div className="flex-1 text-left">
                        <div className="font-medium">{portfolio.name}</div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span>{stats.completed}/{stats.total} tasks</span>
                          {portfolio.budget && (
                            <span>${portfolio.budget.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </button>
                    {/* Progress bar */}
                    <div className="w-20">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <TrendingUp className="w-3 h-3" />
                        {stats.completionRate}%
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full mt-1">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${stats.completionRate}%`,
                            backgroundColor: portfolio.color
                          }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => startEdit(portfolio)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(portfolio.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
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
