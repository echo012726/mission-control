'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Clock, TrendingUp, TrendingDown, AlertTriangle, Plus, Edit2, Trash2 } from 'lucide-react'

type Budget = {
  id: string
  projectId: string
  projectName: string
  budgetHours: number
  spentHours: number
  startDate: string
  endDate: string
}

interface BudgetPanelProps {
  tasks?: any[]
}

export default function BudgetPanel({ tasks = [] }: BudgetPanelProps) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [formData, setFormData] = useState({
    projectName: '',
    budgetHours: 8,
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  })

  useEffect(() => {
    const stored = localStorage.getItem('mc_budgets')
    if (stored) {
      setBudgets(JSON.parse(stored))
    } else {
      // Default demo budgets
      const defaultBudgets: Budget[] = [
        { id: '1', projectId: 'p1', projectName: 'Website Redesign', budgetHours: 40, spentHours: 32, startDate: '2026-03-01', endDate: '2026-03-31' },
        { id: '2', projectId: 'p2', projectName: 'Mobile App', budgetHours: 60, spentHours: 55, startDate: '2026-03-01', endDate: '2026-04-15' },
        { id: '3', projectId: 'p3', projectName: 'Marketing Campaign', budgetHours: 20, spentHours: 8, startDate: '2026-03-01', endDate: '2026-03-15' },
      ]
      setBudgets(defaultBudgets)
      saveBudgets(defaultBudgets)
    }
  }, [])

  const saveBudgets = (newBudgets: Budget[]) => {
    localStorage.setItem('mc_budgets', JSON.stringify(newBudgets))
    setBudgets(newBudgets)
  }

  const getBudgetHealth = (spent: number, budget: number) => {
    const percent = (spent / budget) * 100
    if (percent >= 100) return { status: 'over', color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900' }
    if (percent >= 80) return { status: 'warning', color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900' }
    return { status: 'good', color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900' }
  }

  const getProgressWidth = (spent: number, budget: number) => {
    return Math.min(100, (spent / budget) * 100)
  }

  const totalBudget = budgets.reduce((sum, b) => sum + b.budgetHours, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + b.spentHours, 0)
  const overallHealth = getBudgetHealth(totalSpent, totalBudget)

  const handleSave = () => {
    const newBudget: Budget = {
      id: editingBudget?.id || `b${Date.now()}`,
      projectId: editingBudget?.projectId || `p${Date.now()}`,
      projectName: formData.projectName,
      budgetHours: formData.budgetHours,
      spentHours: editingBudget?.spentHours || 0,
      startDate: formData.startDate,
      endDate: formData.endDate
    }

    let updatedBudgets: Budget[]
    if (editingBudget) {
      updatedBudgets = budgets.map(b => b.id === editingBudget.id ? newBudget : b)
    } else {
      updatedBudgets = [...budgets, newBudget]
    }

    saveBudgets(updatedBudgets)
    setShowModal(false)
    setEditingBudget(null)
    setFormData({ projectName: '', budgetHours: 8, startDate: new Date().toISOString().split('T')[0], endDate: '' })
  }

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget)
    setFormData({
      projectName: budget.projectName,
      budgetHours: budget.budgetHours,
      startDate: budget.startDate,
      endDate: budget.endDate
    })
    setShowModal(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Delete this budget?')) {
      saveBudgets(budgets.filter(b => b.id !== id))
    }
  }

  const updateSpentHours = (id: string, hours: number) => {
    const updated = budgets.map(b => b.id === id ? { ...b, spentHours: hours } : b)
    saveBudgets(updated)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-slate-800 dark:text-white">Project Budgets</h2>
        </div>
        <button
          onClick={() => { setEditingBudget(null); setFormData({ projectName: '', budgetHours: 8, startDate: new Date().toISOString().split('T')[0], endDate: '' }); setShowModal(true) }}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Budget
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 px-5 py-4 bg-slate-50 dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-800 dark:text-white">{totalBudget}h</div>
          <div className="text-xs text-slate-500">Total Budget</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-800 dark:text-white">{totalSpent}h</div>
          <div className="text-xs text-slate-500">Total Spent</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${overallHealth.color}`}>{Math.round((totalSpent / totalBudget) * 100)}%</div>
          <div className="text-xs text-slate-500">Utilization</div>
        </div>
      </div>

      {/* Budget List */}
      <div className="divide-y divide-slate-100 dark:divide-gray-700 max-h-80 overflow-y-auto">
        {budgets.length === 0 ? (
          <div className="px-5 py-8 text-center text-slate-500">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No budgets set yet</p>
            <p className="text-sm">Add a budget to track project time</p>
          </div>
        ) : (
          budgets.map(budget => {
            const health = getBudgetHealth(budget.spentHours, budget.budgetHours)
            const progress = getProgressWidth(budget.spentHours, budget.budgetHours)
            const remaining = budget.budgetHours - budget.spentHours

            return (
              <div key={budget.id} className="px-5 py-4 hover:bg-slate-50 dark:hover:bg-gray-750 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800 dark:text-white">{budget.projectName}</span>
                    {health.status === 'over' && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 text-xs rounded-full">
                        <AlertTriangle className="w-3 h-3" /> Over
                      </span>
                    )}
                    {health.status === 'warning' && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400 text-xs rounded-full">
                        <TrendingDown className="w-3 h-3" /> Warning
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(budget)} className="p-1 text-slate-400 hover:text-blue-600 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(budget.id)} className="p-1 text-slate-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative h-3 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                  <div 
                    className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
                      health.status === 'over' ? 'bg-red-500' : 
                      health.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-slate-500">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {budget.spentHours}h / {budget.budgetHours}h
                    </span>
                    <span className={`font-medium ${
                      remaining >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {remaining >= 0 ? `${remaining}h left` : `${Math.abs(remaining)}h over`}
                    </span>
                  </div>
                  <span className="text-slate-400 text-xs">
                    {budget.startDate} - {budget.endDate || 'Ongoing'}
                  </span>
                </div>

                {/* Manual spent adjustment */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-slate-500">Update spent:</span>
                  <input 
                    type="number" 
                    value={budget.spentHours}
                    onChange={(e) => updateSpentHours(budget.id, parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1 text-sm border border-slate-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    min="0"
                    step="0.5"
                  />
                  <span className="text-xs text-slate-500">hours</span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">
              {editingBudget ? 'Edit Budget' : 'Add Project Budget'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Project Name</label>
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={e => setFormData({ ...formData, projectName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-800 dark:text-white"
                  placeholder="e.g., Website Redesign"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Budget Hours</label>
                <input
                  type="number"
                  value={formData.budgetHours}
                  onChange={e => setFormData({ ...formData, budgetHours: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-800 dark:text-white"
                  min="1"
                  step="1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.projectName || formData.budgetHours <= 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingBudget ? 'Save Changes' : 'Add Budget'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
