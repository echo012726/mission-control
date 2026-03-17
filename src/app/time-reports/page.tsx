'use client'

import { useState, useEffect } from 'react'
import { 
  Clock, Calendar, Download, BarChart3, PieChart, 
  TrendingUp, Tag, Flag, CheckCircle, ArrowLeft,
  Timer, Play, Square
} from 'lucide-react'
import Link from 'next/link'

type ReportType = 'weekly' | 'daily' | 'monthly' | 'byTag' | 'byPriority' | 'byStatus'

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  const hours = Math.floor(seconds / 3600)
  const mins = Math.round((seconds % 3600) / 60)
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

function formatTimeShort(seconds: number): string {
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  return `${Math.round(seconds / 3600)}h`
}

interface ReportData {
  type: string
  startDate: string
  endDate: string
  totalTime: number
  tasksCount: number
  breakdown: any[]
  summary: any
  tasks?: any[]
}

export default function TimeReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('weekly')
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchReport = async (type: ReportType) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/time-reports?type=${type}`)
      const data = await res.json()
      setReport(data)
    } catch (error) {
      console.error('Failed to fetch report:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchReport(reportType)
  }, [reportType])

  const exportCSV = () => {
    if (!report) return
    
    let csv = 'Label,Time (seconds),Time\n'
    report.breakdown.forEach((item: any) => {
      csv += `${item.label},${item.value},${formatTime(item.value)}\n`
    })
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `time-report-${reportType}-${report.startDate}-${report.endDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const reportTypes = [
    { id: 'weekly', label: 'Weekly', icon: Calendar },
    { id: 'daily', label: 'Daily', icon: Clock },
    { id: 'monthly', label: 'Monthly', icon: BarChart3 },
    { id: 'byTag', label: 'By Tag', icon: Tag },
    { id: 'byPriority', label: 'By Priority', icon: Flag },
    { id: 'byStatus', label: 'By Status', icon: CheckCircle },
  ]

  const maxValue = report?.breakdown?.reduce((max, item) => Math.max(max, item.value), 0) || 1

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-slate-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Clock className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-800">Time Tracking Reports</h1>
                <p className="text-sm text-slate-500">
                  {report?.startDate} - {report?.endDate}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Report Type Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {reportTypes.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setReportType(id as ReportType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                reportType === id
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-xl p-8 border border-slate-200">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-slate-200 rounded w-1/4"></div>
              <div className="grid grid-cols-4 gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-24 bg-slate-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        ) : report ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                  <Clock className="w-4 h-4" />
                  Total Time
                </div>
                <div className="text-2xl font-semibold text-slate-800">
                  {formatTime(report.totalTime)}
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                  <BarChart3 className="w-4 h-4" />
                  Tasks Tracked
                </div>
                <div className="text-2xl font-semibold text-slate-800">
                  {report.tasksCount}
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                  <TrendingUp className="w-4 h-4" />
                  Avg Per Day
                </div>
                <div className="text-2xl font-semibold text-slate-800">
                  {formatTime(report.summary.avgPerDay || report.summary.avgPerWeek || 0)}
                </div>
              </div>

              {report.summary.mostProductiveDay && (
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                    <Timer className="w-4 h-4" />
                    Top Day
                  </div>
                  <div className="text-2xl font-semibold text-slate-800">
                    {report.summary.mostProductiveDay}
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatTime(report.summary.mostProductiveTime)}
                  </div>
                </div>
              )}

              {report.summary.topTag && (
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                    <Tag className="w-4 h-4" />
                    Top Tag
                  </div>
                  <div className="text-2xl font-semibold text-slate-800">
                    {report.summary.topTag}
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatTime(report.summary.topTagTime)}
                  </div>
                </div>
              )}

              {report.summary.highPriorityPercent !== undefined && (
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                    <Flag className="w-4 h-4" />
                    High Priority
                  </div>
                  <div className="text-2xl font-semibold text-slate-800">
                    {report.summary.highPriorityPercent}%
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatTime(report.summary.highPriorityTime)}
                  </div>
                </div>
              )}

              {report.summary.donePercent !== undefined && (
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                    <CheckCircle className="w-4 h-4" />
                    Completed
                  </div>
                  <div className="text-2xl font-semibold text-slate-800">
                    {report.summary.donePercent}%
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatTime(report.summary.doneTime)}
                  </div>
                </div>
              )}
            </div>

            {/* Chart */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 mb-6">
              <h3 className="font-semibold text-slate-800 mb-4">
                {reportTypes.find(t => t.id === reportType)?.label} Breakdown
              </h3>
              
              <div className="space-y-3">
                {report.breakdown.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No time tracking data for this period
                  </div>
                ) : (
                  report.breakdown.map((item, index) => {
                    const percentage = (item.value / maxValue) * 100
                    const colorClass = [
                      'bg-blue-500',
                      'bg-green-500', 
                      'bg-yellow-500',
                      'bg-red-500',
                      'bg-purple-500',
                      'bg-indigo-500',
                      'bg-pink-500'
                    ][index % 7]
                    
                    return (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className="w-24 text-sm text-slate-600 truncate flex-shrink-0">
                          {item.label}
                        </div>
                        <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                          <div 
                            className={`h-full ${colorClass} rounded-full transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="w-16 text-sm text-slate-600 text-right flex-shrink-0">
                          {formatTime(item.value)}
                        </div>
                        <div className="w-12 text-xs text-slate-400 text-right flex-shrink-0">
                          {Math.round((item.value / report.totalTime) * 100)}%
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Recent Tasks (for daily view) */}
            {report.tasks && report.tasks.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-4">Tasks Worked On</h3>
                <div className="space-y-2">
                  {report.tasks.map((task: any) => (
                    <div 
                      key={task.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-700 truncate">{task.title}</div>
                        <div className="text-xs text-slate-400">{task.status}</div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {task.estimatedTime && (
                          <div className="text-xs text-slate-400">
                            Est: {formatTime(task.estimatedTime)}
                          </div>
                        )}
                        <div className="text-sm font-medium text-slate-700">
                          {formatTime(task.timeSpent)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl p-8 border border-slate-200 text-center">
            <p className="text-slate-500">Failed to load report</p>
          </div>
        )}
      </div>
    </div>
  )
}
