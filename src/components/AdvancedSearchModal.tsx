'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Calendar, Tag, Flag, CheckSquare, Paperclip, ChevronRight, Loader2 } from 'lucide-react'
import { parseSearchQuery, getSearchSuggestions, searchToParams, ParsedSearch } from '@/lib/searchParser'

interface Task {
  id: string
  title: string
  status: string
  priority: string
  dueDate?: string | null
  labels?: string | null
  tags?: string | null
}

interface AdvancedSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onNavigateToTask: (taskId: string) => void
}

export default function AdvancedSearchModal({ isOpen, onClose, onNavigateToTask }: AdvancedSearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [parsedSearch, setParsedSearch] = useState<ParsedSearch | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Load suggestions
  useEffect(() => {
    // Set default suggestions
    setSuggestions([
      'due:today',
      'due:tomorrow', 
      'due:overdue',
      'priority:high',
      'status:inbox',
      'has:attachment',
      'label:urgent',
      'tag:work'
    ])
  }, [])

  // Parse query and show what would be searched
  useEffect(() => {
    if (query.trim()) {
      const parsed = parseSearchQuery(query)
      setParsedSearch(parsed)
    } else {
      setParsedSearch(null)
    }
  }, [query])

  // Execute search
  const executeSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const parsed = parseSearchQuery(query)
      const params = searchToParams(parsed)
      const response = await fetch(`/api/tasks/search?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setResults(data.tasks || data || [])
      } else {
        setResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [query])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        executeSearch()
      } else {
        setResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, executeSearch])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
    if (e.key === 'Enter' && results.length > 0) {
      onNavigateToTask(results[0].id)
    }
  }

  const handleResultClick = (taskId: string) => {
    onNavigateToTask(taskId)
    onClose()
  }

  const addSuggestion = (suggestion: string) => {
    setQuery(query ? `${query} ${suggestion}` : suggestion)
    inputRef.current?.focus()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-red-500'
      case 'medium': return 'text-yellow-500'
      case 'low': return 'text-blue-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'inbox': return 'Inbox'
      case 'planned': return 'Planned'
      case 'in_progress': return 'In Progress'
      case 'blocked': return 'Blocked'
      case 'done': return 'Done'
      default: return status
    }
  }

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return null
    const date = new Date(dueDate)
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return { text: 'Overdue', className: 'text-red-500' }
    if (diffDays === 0) return { text: 'Today', className: 'text-orange-500' }
    if (diffDays === 1) return { text: 'Tomorrow', className: 'text-yellow-500' }
    return { text: date.toLocaleDateString(), className: 'text-gray-500' }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search with operators: due:today, priority:high, label:urgent..."
            className="flex-1 bg-transparent text-lg outline-none placeholder-gray-400 dark:text-white"
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Parsed Search Info */}
        {parsedSearch && (
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 text-sm border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              {parsedSearch.status?.map(s => (
                <span key={s} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs">
                  status:{s}
                </span>
              ))}
              {parsedSearch.priority?.map(p => (
                <span key={p} className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded text-xs">
                  priority:{p}
                </span>
              ))}
              {parsedSearch.labels?.map(l => (
                <span key={l} className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-xs">
                  label:{l}
                </span>
              ))}
              {parsedSearch.dueDate && (
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-xs">
                  due:{parsedSearch.dueDate.type}
                </span>
              )}
              {parsedSearch.hasLabel && (
                <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                  has:label
                </span>
              )}
              {parsedSearch.hasAttachment && (
                <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                  has:attachment
                </span>
              )}
              {parsedSearch.text && (
                <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                  "{parsedSearch.text}"
                </span>
              )}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {!query && suggestions.length > 0 && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 mb-2">Try these searches:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => addSuggestion(suggestion)}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Searching...</span>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {results.map((task) => {
                const dueInfo = formatDueDate(task.dueDate ?? null)
                return (
                  <button
                    key={task.id}
                    onClick={() => handleResultClick(task.id)}
                    className="w-full flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-sm">
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-600 rounded text-xs">
                          {getStatusLabel(task.status)}
                        </span>
                        <span className={`flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
                          <Flag className="w-3 h-3" />
                          {task.priority}
                        </span>
                        {dueInfo && (
                          <span className={`flex items-center gap-1 ${dueInfo.className}`}>
                            <Calendar className="w-3 h-3" />
                            {dueInfo.text}
                          </span>
                        )}
                        {task.labels && (
                          <span className="flex items-center gap-1 text-purple-500">
                            <Tag className="w-3 h-3" />
                            {typeof task.labels === 'string' 
                              ? (JSON.parse(task.labels) as string[]).length 
                              : 0}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                )
              })}
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No tasks found matching your search
            </div>
          )}

          {!loading && !query && (
            <div className="p-8 text-center text-gray-500">
              Start typing to search tasks
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Enter</kbd> to select</span>
            <span><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd> to close</span>
          </div>
          <span>
            {results.length} {results.length === 1 ? 'result' : 'results'}
          </span>
        </div>
      </div>
    </div>
  )
}
