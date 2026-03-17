'use client'
import { useState } from 'react'
import { BarChart3, TrendingUp, Clock, CheckCircle2, Calendar, PieChart } from 'lucide-react'

type Widget = {
  id: string
  title: string
  type: 'stats' | 'chart' | 'list'
  size: 'small' | 'medium' | 'large'
}

const defaultWidgets: Widget[] = [
  { id: '1', title: 'Tasks Completed', type: 'stats', size: 'small' },
  { id: '2', title: 'In Progress', type: 'stats', size: 'small' },
  { id: '3', title: 'Due This Week', type: 'stats', size: 'small' },
  { id: '4', title: 'Completion Rate', type: 'chart', size: 'medium' },
  { id: '5', title: 'Recent Tasks', type: 'list', size: 'medium' },
]

export default function DashboardWidgets({ tasks = [], dashboardId, onDashboardChange }: { tasks?: any[]; dashboardId?: string; onDashboardChange?: (id: string) => void }) {
  const [widgets, setWidgets] = useState(defaultWidgets)
  
  const completed = tasks.filter(t => t.status === 'done').length
  const inProgress = tasks.filter(t => t.status === 'in_progress').length
  const planned = tasks.filter(t => t.status === 'planned').length
  const total = tasks.length || 1
  const rate = Math.round((completed / total) * 100)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Stats Widgets */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{completed}</p>
            <p className="text-sm text-gray-500">Completed</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{inProgress}</p>
            <p className="text-sm text-gray-500">In Progress</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{planned}</p>
            <p className="text-sm text-gray-500">Planned</p>
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border md:col-span-2">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" /> Completion Rate
        </h3>
        <div className="h-32 flex items-end gap-2">
          {[completed, inProgress, planned].map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div 
                className={`w-full rounded-t ${
                  i === 0 ? 'bg-green-500' : i === 1 ? 'bg-blue-500' : 'bg-purple-500'
                }`}
                style={{ height: `${(v / (total || 1)) * 100}%`, minHeight: v ? '20px' : '0' }}
              />
              <span className="text-xs text-gray-500">{v}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-4 mt-2 text-xs">
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded"/> Done</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded"/> Active</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-purple-500 rounded"/> Planned</span>
        </div>
      </div>

      {/* Rate Widget */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <PieChart className="w-4 h-4" /> Productivity
        </h3>
        <div className="relative h-24 w-24 mx-auto">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle cx="48" cy="48" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none" />
            <circle 
              cx="48" cy="48" r="40" 
              stroke="#10b981" strokeWidth="8" fill="none"
              strokeDasharray={`${rate * 2.51} 251`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold">{rate}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
