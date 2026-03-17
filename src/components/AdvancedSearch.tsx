'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, X, Filter, SlidersHorizontal, Star, Calendar, MapPin, Repeat, ChevronDown } from 'lucide-react'

interface SearchTask {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  starred: boolean
  dueDate: string | null
  tags: string
  assigneeName: string | null
  locationName: string | null
  recurrence: string | null
}

interface Facet {
  status: string
  _count: { status: number }
}

interface PriorityFacet {
  priority: string
  _count: { priority: number }
}

interface TagFacet {
  name: string
  count: number
}

interface SearchResponse {
  tasks: SearchTask[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
  facets: {
    byStatus: Facet[]
    byPriority: PriorityFacet[]
    byTag: TagFacet[]
    totalStarred: number
    totalWithDueDate: number
    totalRecurring: number
  }
  query: string
}

export default function AdvancedSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchTask[]>([])
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null)
  
  // Filters
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [starred, setStarred] = useState<boolean | null>(null)
  const [hasDueDate, setHasDueDate] = useState<boolean | null>(null)
  const [isRecurring, setIsRecurring] = useState<boolean | null>(null)
  const [sortBy, setSortBy] = useState('updatedAt')
  const [sortOrder, setSortOrder] = useState('desc')

  const search = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (status) params.set('status', status)
      if (priority) params.set('priority', priority)
      if (starred !== null) params.set('starred', String(starred))
      if (hasDueDate !== null) params.set('hasDueDate', String(hasDueDate))
      if (isRecurring !== null) params.set('isRecurring', String(isRecurring))
      params.set('sortBy', sortBy)
      params.set('sortOrder', sortOrder)
      params.set('limit', '50')

      const res = await fetch(`/api/tasks/search?${params}`)
      const data = await res.json()
      setResults(data.tasks)
      setSearchResponse(data)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }, [query, status, priority, starred, hasDueDate, isRecurring, sortBy, sortOrder])

  useEffect(() => {
    const debounce = setTimeout(() => {
      search()
    }, 300)
    return () => clearTimeout(debounce)
  }, [search])

  const clearFilters = () => {
    setStatus('')
    setPriority('')
    setStarred(null)
    setHasDueDate(null)
    setIsRecurring(null)
  }

  const getStatusColor = (s: string) => {
    const colors: Record<string, string> = {
      inbox: 'bg-gray-100 text-gray-700',
      planned: 'bg-blue-100 text-blue-700',
      inProgress: 'bg-yellow-100 text-yellow-700',
      blocked: 'bg-red-100 text-red-700',
      done: 'bg-green-100 text-green-700'
    }
    return colors[s] || 'bg-gray-100 text-gray-700'
  }

  const getPriorityColor = (p: string) => {
    const colors: Record<string, string> = {
      high: 'text-red-500',
      medium: 'text-yellow-500',
      low: 'text-green-500'
    }
    return colors[p] || 'text-gray-500'
  }

  const formatDate = (date: string | null) => {
    if (!date) return null
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.includes(new Date().getFullYear().toString()) ? undefined : 'numeric'
    })
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">🔍 Advanced Search</h1>
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks by title or description..."
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {(status || priority || starred !== null || hasDueDate !== null || isRecurring !== null) && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                {[status, priority, starred, hasDueDate, isRecurring].filter(Boolean).length}
              </span>
            )}
          </button>
          
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="updatedAt">Last Updated</option>
              <option value="createdAt">Created</option>
              <option value="dueDate">Due Date</option>
              <option value="title">Title</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-3 p-4 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border rounded px-2 py-1 text-sm"
                >
                  <option value="">All</option>
                  <option value="inbox">Inbox</option>
                  <option value="planned">Planned</option>
                  <option value="inProgress">In Progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="done">Done</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full border rounded px-2 py-1 text-sm"
                >
                  <option value="">All</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Starred</label>
                <select
                  value={starred === null ? '' : String(starred)}
                  onChange={(e) => setStarred(e.target.value === '' ? null : e.target.value === 'true')}
                  className="w-full border rounded px-2 py-1 text-sm"
                >
                  <option value="">All</option>
                  <option value="true">Starred Only</option>
                  <option value="false">Not Starred</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <select
                  value={hasDueDate === null ? '' : String(hasDueDate)}
                  onChange={(e) => setHasDueDate(e.target.value === '' ? null : e.target.value === 'true')}
                  className="w-full border rounded px-2 py-1 text-sm"
                >
                  <option value="">All</option>
                  <option value="true">Has Due Date</option>
                  <option value="false">No Due Date</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Recurring</label>
                <select
                  value={isRecurring === null ? '' : String(isRecurring)}
                  onChange={(e) => setIsRecurring(e.target.value === '' ? null : e.target.value === 'true')}
                  className="w-full border rounded px-2 py-1 text-sm"
                >
                  <option value="">All</option>
                  <option value="true">Recurring</option>
                  <option value="false">One-time</option>
                </select>
              </div>
            </div>
            
            {(status || priority || starred !== null || hasDueDate !== null || isRecurring !== null) && (
              <button
                onClick={clearFilters}
                className="mt-3 text-sm text-red-600 hover:text-red-700"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Searching...</div>
      ) : (
        <>
          {searchResponse && (
            <div className="mb-4 text-sm text-gray-500">
              Found {searchResponse.pagination.total} tasks
              {query && <> for "<strong>{query}</strong>"</>}
            </div>
          )}
          
          {results.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {query ? 'No tasks match your search' : 'Start typing to search'}
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 bg-white border rounded-lg hover:shadow-md transition-shadow ${
                    task.starred ? 'border-yellow-300 bg-yellow-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs rounded ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                        <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority.toUpperCase()}
                        </span>
                        {task.starred && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                      </div>
                      <h3 className="font-medium mt-1 truncate">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(task.dueDate)}
                          </span>
                        )}
                        {task.locationName && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {task.locationName}
                          </span>
                        )}
                        {task.recurrence && (
                          <span className="flex items-center gap-1">
                            <Repeat className="w-3 h-3" />
                            Recurring
                          </span>
                        )}
                        {task.assigneeName && (
                          <span>Assigned: {task.assigneeName}</span>
                        )}
                      </div>
                      {task.tags && JSON.parse(task.tags).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {JSON.parse(task.tags).map((tag: string) => (
                            <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
