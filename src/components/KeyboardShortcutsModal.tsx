"use client"

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface KeyboardShortcut {
  key: string
  description: string
  category: string
}

const SHORTCUTS: KeyboardShortcut[] = [
  // Task Actions
  { key: 'n', description: 'Create new task', category: 'Task Actions' },
  { key: 'Enter', description: 'Open selected task', category: 'Task Actions' },
  { key: 'Escape', description: 'Close modal / Clear selection', category: 'Task Actions' },
  { key: 'Ctrl+D', description: 'Duplicate task', category: 'Task Actions' },
  { key: 'd', description: 'Delete task', category: 'Task Actions' },
  { key: 'e', description: 'Edit task', category: 'Task Actions' },
  
  // Navigation
  { key: '← →', description: 'Navigate between lanes', category: 'Navigation' },
  { key: '↑ ↓', description: 'Navigate tasks in lane', category: 'Navigation' },
  { key: '1-6', description: 'Jump to lane by number', category: 'Navigation' },
  { key: 'Home', description: 'Go to first task', category: 'Navigation' },
  { key: 'End', description: 'Go to last task', category: 'Navigation' },
  
  // Search & Filter
  { key: '/', description: 'Open advanced search', category: 'Search & Filter' },
  { key: 't', description: 'Toggle Today filter', category: 'Search & Filter' },
  { key: 'f', description: 'Open filters', category: 'Search & Filter' },
  
  // View Modes
  { key: 'v', description: 'Cycle view mode (Board/Calendar/Gantt)', category: 'View Modes' },
  { key: 'm', description: 'Toggle matrix view', category: 'View Modes' },
  { key: 'g', description: 'Toggle Gantt timeline', category: 'View Modes' },
  
  // Bulk Operations
  { key: 'b', description: 'Enter bulk select mode', category: 'Bulk Operations' },
  { key: 'a', description: 'Select all (in bulk mode)', category: 'Bulk Operations' },
  
  // Other
  { key: '?', description: 'Show this help', category: 'Other' },
  { key: 's', description: 'Save / Confirm', category: 'Other' },
]

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
      return () => window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const categories = SHORTCUTS.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) acc[shortcut.category] = []
    acc[shortcut.category].push(shortcut)
    return acc
  }, {} as Record<string, KeyboardShortcut[]>)

  const filteredCategories = searchQuery
    ? Object.entries(categories).reduce((acc, [category, shortcuts]) => {
        const filtered = shortcuts.filter(s => 
          s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
          category.toLowerCase().includes(searchQuery.toLowerCase())
        )
        if (filtered.length > 0) acc[category] = filtered
        return acc
      }, {} as Record<string, KeyboardShortcut[]>)
    : categories

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <input
            type="text"
            placeholder="Search shortcuts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto p-4">
          {Object.entries(filteredCategories).map(([category, shortcuts]) => (
            <div key={category} className="mb-6 last:mb-0">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts.map((shortcut, idx) => (
                  <div 
                    key={`${shortcut.key}-${idx}`}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <span className="text-slate-700 dark:text-slate-200">
                      {shortcut.description}
                    </span>
                    <div className="flex gap-1">
                      {shortcut.key.split('+').map((key, i) => (
                        <kbd 
                          key={i}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-mono rounded border border-slate-200 dark:border-slate-500"
                        >
                          {key.trim()}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {Object.keys(filteredCategories).length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No shortcuts found matching "{searchQuery}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <p className="text-xs text-slate-500 text-center">
            Press <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">?</kbd> anytime to show this help
          </p>
        </div>
      </div>
    </div>
  )
}
