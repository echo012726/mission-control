'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { LinkIcon, ArrowRight, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'

interface Task {
  id: string
  title: string
  status: string
  dependsOn: string
}

interface TaskDependenciesPanelProps {
  tasks: Task[]
  onNavigateToTask?: (taskId: string) => void
}

interface DependencyNode {
  task: Task
  dependents: Task[]  // Tasks that depend on this one
  chainLength: number
  isBlocked: boolean
  isBlocking: boolean
}

export default function TaskDependenciesPanel({ tasks, onNavigateToTask }: TaskDependenciesPanelProps) {
  const [filter, setFilter] = useState<'all' | 'blocked' | 'blocking'>('all')
  const [expandedChains, setExpandedChains] = useState<Set<string>>(new Set())

  // Build dependency graph
  const dependencyGraph = useMemo(() => {
    const graph = new Map<string, DependencyNode>()
    
    // Initialize nodes
    tasks.forEach(task => {
      graph.set(task.id, {
        task,
        dependents: [],
        chainLength: 0,
        isBlocked: false,
        isBlocking: false
      })
    })

    // Build relationships
    tasks.forEach(task => {
      const deps = task.dependsOn ? JSON.parse(task.dependsOn) : []
      const node = graph.get(task.id)!
      
      // Check if blocked (has incomplete dependencies)
      const hasIncompleteDeps = deps.some((depId: string) => {
        const depTask = tasks.find(t => t.id === depId)
        return depTask && depTask.status !== 'done'
      })
      node.isBlocked = hasIncompleteDeps && task.status !== 'done'
      
      // Check if blocking (other tasks depend on this)
      const hasDependents = tasks.some(t => {
        const tDeps = t.dependsOn ? JSON.parse(t.dependsOn) : []
        return tDeps.includes(task.id)
      })
      node.isBlocking = hasDependents

      // Add dependents
      deps.forEach((depId: string) => {
        const depNode = graph.get(depId)
        if (depNode) {
          depNode.dependents.push(task)
        }
      })
    })

    // Calculate chain lengths (longest path from this task)
    const calculateChainLength = (taskId: string, visited: Set<string> = new Set()): number => {
      if (visited.has(taskId)) return 0
      visited.add(taskId)
      
      const node = graph.get(taskId)
      if (!node) return 0

      let maxLength = 0
      node.dependents.forEach(dependent => {
        const length = calculateChainLength(dependent.id, new Set(visited))
        maxLength = Math.max(maxLength, length)
      })
      
      node.chainLength = maxLength + 1
      return node.chainLength
    }

    tasks.forEach(task => calculateChainLength(task.id))

    return graph
  }, [tasks])

  // Get root tasks (tasks with no dependencies or only completed ones)
  const rootTasks = useMemo(() => {
    return tasks.filter(task => {
      const deps = task.dependsOn ? JSON.parse(task.dependsOn) : []
      return deps.length === 0 || deps.every((depId: string) => {
        const depTask = tasks.find(t => t.id === depId)
        return depTask?.status === 'done'
      })
    })
  }, [tasks])

  // Filter tasks based on current filter
  const filteredTasks = useMemo(() => {
    let filtered = Array.from(dependencyGraph.values())
    
    if (filter === 'blocked') {
      filtered = filtered.filter(n => n.isBlocked)
    } else if (filter === 'blocking') {
      filtered = filtered.filter(n => n.isBlocking)
    }
    
    // Sort by chain length (longest first)
    return filtered.sort((a, b) => b.chainLength - a.chainLength)
  }, [dependencyGraph, filter])

  const toggleExpand = (taskId: string) => {
    const newExpanded = new Set(expandedChains)
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId)
    } else {
      newExpanded.add(taskId)
    }
    setExpandedChains(newExpanded)
  }

  const getStatusIcon = (task: Task) => {
    const deps = task.dependsOn ? JSON.parse(task.dependsOn) : []
    const hasIncompleteDeps = deps.some((depId: string) => {
      const depTask = tasks.find(t => t.id === depId)
      return depTask && depTask.status !== 'done'
    })

    if (task.status === 'done') {
      return <CheckCircle size={14} className="text-green-500" />
    }
    if (hasIncompleteDeps) {
      return <Clock size={14} className="text-orange-500" />
    }
    return <Clock size={14} className="text-slate-400" />
  }

  const renderDependencyChain = (taskId: string, depth: number = 0): React.ReactNode[] => {
    const node = dependencyGraph.get(taskId)
    if (!node) return []

    const elements: React.ReactNode[] = []
    const isExpanded = expandedChains.has(taskId)

    elements.push(
      <div 
        key={taskId}
        className={`flex items-center gap-2 py-1.5 px-2 rounded ${depth > 0 ? 'ml-4 bg-slate-50' : 'bg-white'}`}
        style={{ marginLeft: depth * 16 }}
      >
        {node.dependents.length > 0 && (
          <button
            onClick={() => toggleExpand(taskId)}
            className="p-0.5 hover:bg-slate-200 rounded"
          >
            <ArrowRight size={12} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
        )}
        {node.dependents.length === 0 && <span className="w-5" />}
        
        {getStatusIcon(node.task)}
        
        <span 
          className={`text-sm truncate cursor-pointer hover:text-blue-600 ${node.task.status === 'done' ? 'line-through text-slate-400' : node.isBlocked ? 'text-orange-700' : 'text-slate-700'}`}
          onClick={() => onNavigateToTask?.(node.task.id)}
          title={node.task.title}
        >
          {node.task.title.substring(0, 30)}{node.task.title.length > 30 ? '...' : ''}
        </span>
        
        {node.isBlocked && node.task.status !== 'done' && (
          <span title="Blocked by incomplete dependencies">
            <AlertTriangle size={12} className="text-orange-500" />
          </span>
        )}
        
        {node.chainLength > 1 && (
          <span className="text-xs text-slate-400">({node.chainLength})</span>
        )}
      </div>
    )

    if (isExpanded) {
      node.dependents.forEach(dependent => {
        elements.push(...renderDependencyChain(dependent.id, depth + 1))
      })
    }

    return elements
  }

  // Stats
  const stats = useMemo(() => {
    let blocked = 0
    let blocking = 0
    let chains = 0
    
    dependencyGraph.forEach(node => {
      if (node.isBlocked) blocked++
      if (node.isBlocking) blocking++
      if (node.chainLength > 1) chains++
    })
    
    return { blocked, blocking, chains }
  }, [dependencyGraph])

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="p-3 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-2">
          <LinkIcon size={16} className="text-slate-600" />
          <h3 className="font-medium text-slate-800">Task Dependencies</h3>
        </div>
        
        {/* Stats */}
        <div className="flex gap-3 text-xs">
          <span className="text-orange-600">{stats.blocked} blocked</span>
          <span className="text-blue-600">{stats.blocking} blocking</span>
          <span className="text-slate-500">{stats.chains} chains</span>
        </div>
      </div>

      {/* Filter */}
      <div className="px-3 py-2 border-b border-slate-100 flex gap-2">
        {(['all', 'blocked', 'blocking'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-2 py-1 rounded capitalize ${
              filter === f 
                ? 'bg-slate-800 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Dependency chains */}
      <div className="p-2 max-h-96 overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <LinkIcon size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No task dependencies</p>
            <p className="text-xs mt-1">Add dependencies to tasks to see chains here</p>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Show root tasks and their chains */}
            {filter === 'all' ? (
              rootTasks.slice(0, 10).map(task => (
                <div key={task.id} className="border border-slate-100 rounded">
                  {renderDependencyChain(task.id)}
                </div>
              ))
            ) : (
              filteredTasks.slice(0, 15).map(node => (
                <div key={node.task.id} className="border border-slate-100 rounded">
                  {renderDependencyChain(node.task.id)}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-3 py-2 border-t border-slate-100 text-xs text-slate-500 flex gap-4">
        <span className="flex items-center gap-1">
          <CheckCircle size={12} className="text-green-500" /> Done
        </span>
        <span className="flex items-center gap-1">
          <Clock size={12} className="text-orange-500" /> Blocked
        </span>
        <span className="flex items-center gap-1">
          <ArrowRight size={12} /> Expand
        </span>
      </div>
    </div>
  )
}
