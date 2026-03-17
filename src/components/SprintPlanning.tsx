'use client'
import { useState } from 'react'
import { Flag, Calendar, Target, Plus, ChevronRight, CheckCircle2 } from 'lucide-react'

type Sprint = {
  id: string
  name: string
  startDate: string
  endDate: string
  points: number
  completed: number
}

export default function SprintPlanning() {
  const [sprints, setSprints] = useState<Sprint[]>([
    { id: '1', name: 'Sprint 1', startDate: '2026-03-01', endDate: '2026-03-14', points: 21, completed: 13 },
    { id: '2', name: 'Sprint 2', startDate: '2026-03-15', endDate: '2026-03-28', points: 0, completed: 0 },
  ])
  const [activeSprint, setActiveSprint] = useState('1')

  const active = sprints.find(s => s.id === activeSprint)
  const progress = active ? Math.round((active.completed / active.points) * 100) : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <Flag className="w-4 h-4" /> Sprints
        </h3>
        <button className="flex items-center gap-1 text-sm text-blue-600">
          <Plus className="w-4 h-4" /> New Sprint
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {sprints.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSprint(s.id)}
            className={`flex-shrink-0 p-3 rounded-lg border text-left min-w-[140px] ${
              activeSprint === s.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <p className="font-medium text-sm">{s.name}</p>
            <p className="text-xs text-gray-500">{s.points} pts</p>
          </button>
        ))}
      </div>

      {active && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {active.startDate} - {active.endDate}</span>
            <span className="text-gray-500">{active.completed}/{active.points} points</span>
          </div>
          
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{progress}% complete</span>
            <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {(active.points - active.completed)} remaining</span>
          </div>
        </div>
      )}
    </div>
  )
}
