'use client'

import { useState, useEffect } from 'react'
import { Save, X, ChevronDown, Trash2, Edit2, Filter } from 'lucide-react'

interface SavedFilter {
  id: string
  name: string
  filters: {
    searchQuery?: string
    filterPriority?: string
    filterTags?: string
  }
  order: number
}

interface SavedFiltersProps {
  currentFilters: {
    searchQuery: string
    filterPriority: string
    filterTags: string
  }
  onApplyFilter: (filters: SavedFilter['filters']) => void
}

export default function SavedFilters({ currentFilters, onApplyFilter }: SavedFiltersProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showManageModal, setShowManageModal] = useState(false)
  const [newFilterName, setNewFilterName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  useEffect(() => {
    fetchFilters()
  }, [])

  const fetchFilters = async () => {
    try {
      const res = await fetch('/api/...?token=marcus2026&&filters')
      if (res.ok) {
        const data = await res.json()
        setSavedFilters(data)
      }
    } catch (error) {
      console.error('Failed to fetch filters:', error)
    }
  }

  const saveFilter = async () => {
    if (!newFilterName.trim()) return

    try {
      const res = await fetch('/api/...?token=marcus2026&&filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFilterName,
          filters: currentFilters,
        }),
      })

      if (res.ok) {
        const newFilter = await res.json()
        setSavedFilters([...savedFilters, newFilter])
        setNewFilterName('')
        setShowSaveModal(false)
      }
    } catch (error) {
      console.error('Failed to save filter:', error)
    }
  }

  const applyFilter = (filter: SavedFilter) => {
    onApplyFilter(filter.filters)
    setIsOpen(false)
  }

  const deleteFilter = async (id: string) => {
    try {
      const res = await fetch(`/api/filters/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setSavedFilters(savedFilters.filter(f => f.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete filter:', error)
    }
  }

  const renameFilter = async (id: string) => {
    if (!editingName.trim()) {
      setEditingId(null)
      return
    }

    try {
      const res = await fetch(`/api/filters/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName }),
      })

      if (res.ok) {
        setSavedFilters(savedFilters.map(f => 
          f.id === id ? { ...f, name: editingName } : f
        ))
        setEditingId(null)
      }
    } catch (error) {
      console.error('Failed to rename filter:', error)
    }
  }

  const hasCurrentFilters = currentFilters.searchQuery || currentFilters.filterPriority || currentFilters.filterTags

  return (
    <div className="relative">
      {/* Main Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span>Saved</span>
          <ChevronDown className="w-3 h-3" />
        </button>

        {hasCurrentFilters && (
          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-md transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
          <div className="p-2 border-b border-slate-100">
            <button
              onClick={() => { setIsOpen(false); setShowManageModal(true) }}
              className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded"
            >
              Manage Filters
            </button>
          </div>
          
          {savedFilters.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-sm">
              No saved filters
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {savedFilters.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => applyFilter(filter)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between"
                >
                  <span>{filter.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Save Filter</h3>
              <button onClick={() => setShowSaveModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <input
              type="text"
              placeholder="Filter name..."
              value={newFilterName}
              onChange={(e) => setNewFilterName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md mb-3"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && saveFilter()}
            />

            <div className="text-xs text-slate-500 mb-4">
              Current: {currentFilters.searchQuery || 'No search'}{currentFilters.filterPriority && ` | ${currentFilters.filterPriority}`}{currentFilters.filterTags && ` | ${currentFilters.filterTags}`}
            </div>

            <button
              onClick={saveFilter}
              className="w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Save Filter
            </button>
          </div>
        </div>
      )}

      {/* Manage Modal */}
      {showManageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-80 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Manage Filters</h3>
              <button onClick={() => setShowManageModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {savedFilters.length === 0 ? (
              <div className="text-center text-slate-400 py-4">
                No saved filters
              </div>
            ) : (
              <div className="space-y-2">
                {savedFilters.map(filter => (
                  <div key={filter.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                    {editingId === filter.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => renameFilter(filter.id)}
                        onKeyDown={(e) => e.key === 'Enter' && renameFilter(filter.id)}
                        className="flex-1 px-2 py-1 border rounded text-sm"
                        autoFocus
                      />
                    ) : (
                      <span className="flex-1 text-sm truncate">{filter.name}</span>
                    )}
                    <button
                      onClick={() => { setEditingId(filter.id); setEditingName(filter.name) }}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteFilter(filter.id)}
                      className="p-1 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowManageModal(false)}
              className="w-full mt-4 py-2 border rounded-md hover:bg-slate-50"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
