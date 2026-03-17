'use client'
import { useState, useEffect } from 'react'
import { 
  Filter, 
  X, 
  Calendar, 
  Clock, 
  Star, 
  AlertCircle, 
  CheckCircle2, 
  Link2,
  Timer,
  Bot,
  CalendarDays
} from 'lucide-react'

interface QuickFiltersProps {
  tasks: any[]
  onFilterChange: (filter: string, value: any) => void
  activeFilter: string | null
  onClearFilters: () => void
}

interface FilterOption {
  id: string
  label: string
  icon: React.ReactNode
  filter: (task: any) => boolean
  color: string
}

export default function QuickFilters({ tasks, onFilterChange, activeFilter, onClearFilters }: QuickFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    // Calculate counts for each filter
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const weekEnd = new Date(today)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const newCounts: Record<string, number> = {
      dueToday: 0,
      overdue: 0,
      dueThisWeek: 0,
      highPriority: 0,
      starred: 0,
      hasDependencies: 0,
      inProgress: 0,
      noDueDate: 0,
      recent: 0,
      assignedToAgent: 0,
    }

    tasks.forEach(task => {
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate)
        if (dueDate <= now) newCounts.overdue++
        if (dueDate >= today && dueDate < tomorrow) newCounts.dueToday++
        if (dueDate >= today && dueDate < weekEnd) newCounts.dueThisWeek++
      } else {
        newCounts.noDueDate++
      }
      
      if (task.priority === 'high') newCounts.highPriority++
      if (task.starred) newCounts.starred++
      if (task.dependsOn && task.dependsOn !== '[]' && JSON.parse(task.dependsOn).length > 0) {
        newCounts.hasDependencies++
      }
      if (task.status === 'in_progress') newCounts.inProgress++
      
      // Recent (last 24 hours)
      const created = new Date(task.createdAt)
      const dayAgo = new Date(now)
      dayAgo.setDate(dayAgo.getDate() - 1)
      if (created >= dayAgo) newCounts.recent++
      
      if (task.agentId) newCounts.assignedToAgent++
    })

    setCounts(newCounts)
  }, [tasks])

  const filters: FilterOption[] = [
    { 
      id: 'dueToday', 
      label: 'Due Today', 
      icon: <Calendar size={14} />,
      filter: (t) => {
        if (!t.dueDate) return false
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        const due = new Date(t.dueDate)
        return due >= today && due < tomorrow
      },
      color: 'bg-orange-100 text-orange-700 border-orange-200'
    },
    { 
      id: 'overdue', 
      label: 'Overdue', 
      icon: <AlertCircle size={14} />,
      filter: (t) => {
        if (!t.dueDate) return false
        return new Date(t.dueDate) < new Date()
      },
      color: 'bg-red-100 text-red-700 border-red-200'
    },
    { 
      id: 'dueThisWeek', 
      label: 'Due This Week', 
      icon: <CalendarDays size={14} />,
      filter: (t) => {
        if (!t.dueDate) return false
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekEnd = new Date(today)
        weekEnd.setDate(weekEnd.getDate() + 7)
        const due = new Date(t.dueDate)
        return due >= today && due < weekEnd
      },
      color: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    { 
      id: 'highPriority', 
      label: 'High Priority', 
      icon: <Star size={14} />,
      filter: (t) => t.priority === 'high',
      color: 'bg-red-100 text-red-700 border-red-200'
    },
    { 
      id: 'starred', 
      label: 'Starred', 
      icon: <Star size={14} className="fill-yellow-400 text-yellow-500" />,
      filter: (t) => t.starred === true,
      color: 'bg-yellow-100 text-yellow-700 border-yellow-200'
    },
    { 
      id: 'hasDependencies', 
      label: 'Has Dependencies', 
      icon: <Link2 size={14} />,
      filter: (t) => t.dependsOn && t.dependsOn !== '[]' && JSON.parse(t.dependsOn).length > 0,
      color: 'bg-purple-100 text-purple-700 border-purple-200'
    },
    { 
      id: 'inProgress', 
      label: 'In Progress', 
      icon: <Timer size={14} />,
      filter: (t) => t.status === 'in_progress',
      color: 'bg-yellow-100 text-yellow-700 border-yellow-200'
    },
    { 
      id: 'noDueDate', 
      label: 'No Due Date', 
      icon: <Clock size={14} />,
      filter: (t) => !t.dueDate,
      color: 'bg-gray-100 text-gray-700 border-gray-200'
    },
    { 
      id: 'recent', 
      label: 'Added Recently', 
      icon: <Clock size={14} />,
      filter: (t) => {
        const created = new Date(t.createdAt)
        const dayAgo = new Date()
        dayAgo.setDate(dayAgo.getDate() - 1)
        return created >= dayAgo
      },
      color: 'bg-green-100 text-green-700 border-green-200'
    },
    { 
      id: 'assignedToAgent', 
      label: 'Agent Task', 
      icon: <Bot size={14} />,
      filter: (t) => !!t.agentId,
      color: 'bg-indigo-100 text-indigo-700 border-indigo-200'
    },
  ]

  const handleFilterClick = (filterId: string) => {
    if (activeFilter === filterId) {
      onClearFilters()
    } else {
      onFilterChange(filterId, true)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
          activeFilter 
            ? 'bg-indigo-50 border-indigo-300 text-indigo-700' 
            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
        }`}
      >
        <Filter size={16} />
        <span className="text-sm font-medium">Filters</span>
        {activeFilter && (
          <span className="ml-1 px-1.5 py-0.5 bg-indigo-200 text-indigo-800 text-xs rounded">
            1
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Quick Filters</h3>
              {activeFilter && (
                <button
                  onClick={() => {
                    onClearFilters()
                    setIsOpen(false)
                  }}
                  className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <X size={12} /> Clear
                </button>
              )}
            </div>
            <div className="p-2 max-h-80 overflow-y-auto">
              {filters.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => handleFilterClick(filter.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                    activeFilter === filter.id
                      ? 'bg-indigo-50 border border-indigo-200'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={filter.color.split(' ')[0].replace('bg-', 'text-')}>
                      {filter.icon}
                    </span>
                    <span className="text-sm text-slate-700">{filter.label}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${filter.color}`}>
                    {counts[filter.id] || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
