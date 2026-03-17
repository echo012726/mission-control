'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Download, 
  FileText, 
  Image, 
  Copy, 
  Check,
  X,
  Plus,
  Trash2,
  RefreshCw,
  Calendar,
  Filter,
  Layers
} from 'lucide-react'

type ReportType = 'productivity' | 'portfolio' | 'time' | 'karma' | 'custom'
type ChartType = 'bar' | 'pie' | 'line' | 'stat'
type GroupBy = 'status' | 'priority' | 'portfolio' | 'tag' | 'date'
type DataSource = 'tasks' | 'portfolios' | 'time' | 'karma'

interface ReportConfig {
  id: string
  name: string
  type: ReportType
  dataSource: DataSource
  chartType: ChartType
  groupBy: GroupBy
  dateRange: { start: string; end: string }
}

interface ReportPanelProps {
  tasks?: any[]
  portfolios?: any[]
}

export default function ReportPanel({ tasks = [], portfolios = [] }: ReportPanelProps) {
  const [showModal, setShowModal] = useState(false)
  const [savedReports, setSavedReports] = useState<ReportConfig[]>([])
  const [activeReport, setActiveReport] = useState<ReportConfig | null>(null)
  const [chartData, setChartData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({
    name: 'My Report',
    type: 'custom' as ReportType,
    dataSource: 'tasks' as DataSource,
    chartType: 'bar' as ChartType,
    groupBy: 'status' as GroupBy,
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstanceRef = useRef<any>(null)

  useEffect(() => {
    const stored = localStorage.getItem('mc_reports')
    if (stored) {
      setSavedReports(JSON.parse(stored))
    } else {
      // Default templates
      const templates: ReportConfig[] = [
        { id: 't1', name: 'Weekly Productivity', type: 'productivity', dataSource: 'tasks', chartType: 'bar', groupBy: 'status', dateRange: { start: '', end: '' } },
        { id: 't2', name: 'Portfolio Health', type: 'portfolio', dataSource: 'portfolios', chartType: 'pie', groupBy: 'priority', dateRange: { start: '', end: '' } },
        { id: 't3', name: 'Time Tracking Summary', type: 'time', dataSource: 'time', chartType: 'stat', groupBy: 'date', dateRange: { start: '', end: '' } },
        { id: 't4', name: 'Karma & Engagement', type: 'karma', dataSource: 'karma', chartType: 'line', groupBy: 'date', dateRange: { start: '', end: '' } },
      ]
      setSavedReports(templates)
      localStorage.setItem('mc_reports', JSON.stringify(templates))
    }
  }, [])

  useEffect(() => {
    if (activeReport) {
      generateReport(activeReport)
    }
  }, [activeReport, tasks, portfolios])

  const saveReports = (reports: ReportConfig[]) => {
    localStorage.setItem('mc_reports', JSON.stringify(reports))
    setSavedReports(reports)
  }

  const generateReport = async (config: ReportConfig) => {
    setLoading(true)
    
    // Simulate processing time
    await new Promise(r => setTimeout(r, 300))

    let data: any = {}
    let labels: string[] = []
    let values: number[] = []
    let colors: string[] = []

    const colorPalette = [
      '#3b82f6', '#22c55e', '#f97316', '#ec4899', '#8b5cf6', '#14b8a6', '#eab308', '#ef4444'
    ]

    switch (config.dataSource) {
      case 'tasks':
        const filteredTasks = tasks.filter(t => {
          if (!t.createdAt) return true
          const created = new Date(t.createdAt)
          const start = config.dateRange.start ? new Date(config.dateRange.start) : new Date(0)
          const end = config.dateRange.end ? new Date(config.dateRange.end) : new Date()
          return created >= start && created <= end
        })

        switch (config.groupBy) {
          case 'status':
            const statusCounts: Record<string, number> = { todo: 0, in_progress: 0, done: 0 }
            filteredTasks.forEach(t => {
              const status = t.status || 'todo'
              statusCounts[status] = (statusCounts[status] || 0) + 1
            })
            labels = ['To Do', 'In Progress', 'Done']
            values = [statusCounts.todo, statusCounts.in_progress, statusCounts.done]
            break
          case 'priority':
            const priorityCounts: Record<string, number> = { low: 0, medium: 0, high: 0, urgent: 0 }
            filteredTasks.forEach(t => {
              const p = t.priority || 'medium'
              priorityCounts[p] = (priorityCounts[p] || 0) + 1
            })
            labels = ['Low', 'Medium', 'High', 'Urgent']
            values = [priorityCounts.low, priorityCounts.medium, priorityCounts.high, priorityCounts.urgent]
            break
          case 'tag':
            const tagCounts: Record<string, number> = {}
            filteredTasks.forEach(t => {
              if (t.tags && Array.isArray(t.tags)) {
                t.tags.forEach((tag: string) => {
                  tagCounts[tag] = (tagCounts[tag] || 0) + 1
                })
              }
            })
            labels = Object.keys(tagCounts).slice(0, 8)
            values = Object.values(tagCounts).slice(0, 8)
            break
          default:
            labels = ['Total']
            values = [filteredTasks.length]
        }
        colors = labels.map((_, i) => colorPalette[i % colorPalette.length])
        break

      case 'portfolios':
        labels = portfolios.map(p => p.name)
        values = portfolios.map(p => p.taskIds?.length || 0)
        colors = portfolios.map((_, i) => colorPalette[i % colorPalette.length])
        break

      case 'time':
        labels = ['Tracked', 'Estimated', 'Remaining']
        values = [24, 40, 16] // Demo data
        colors = ['#22c55e', '#f97316', '#3b82f6']
        break

      case 'karma':
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        values = [12, 19, 8, 15, 22, 5, 10]
        colors = ['#8b5cf6', '#8b5cf6', '#8b5cf6', '#8b5cf6', '#8b5cf6', '#8b5cf6', '#8b5cf6']
        break
    }

    data = { labels, values, colors }
    setChartData(data)
    setLoading(false)
  }

  const handleSaveReport = () => {
    const newReport: ReportConfig = {
      id: `r${Date.now()}`,
      name: formData.name,
      type: formData.type,
      dataSource: formData.dataSource,
      chartType: formData.chartType,
      groupBy: formData.groupBy,
      dateRange: { start: formData.startDate, end: formData.endDate }
    }
    saveReports([...savedReports, newReport])
    setActiveReport(newReport)
    setShowModal(false)
  }

  const handleDeleteReport = (id: string) => {
    if (!confirm('Delete this report?')) return
    const newReports = savedReports.filter(r => r.id !== id)
    saveReports(newReports)
    if (activeReport?.id === id) {
      setActiveReport(null)
      setChartData(null)
    }
  }

  const exportToCSV = () => {
    if (!chartData) return
    const csv = [chartData.labels.join(','), chartData.values.join(',')].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeReport?.name || 'report'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = () => {
    if (!chartData) return
    const text = chartData.labels.map((l: string, i: number) => `${l}: ${chartData.values[i]}`).join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const loadTemplate = (template: ReportConfig) => {
    setActiveReport(template)
  }

  // Calculate summary stats
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'done').length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const avgTasksPerDay = totalTasks / 7

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-indigo-600" />
          <h1 className="text-2xl font-bold">Advanced Reports</h1>
          <span className="text-gray-500 text-sm">({savedReports.length} reports)</span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Report
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-indigo-600">{totalTasks}</div>
          <div className="text-sm text-gray-500">Total Tasks</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-orange-600">{completionRate}%</div>
          <div className="text-sm text-gray-500">Completion Rate</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-purple-600">{avgTasksPerDay.toFixed(1)}</div>
          <div className="text-sm text-gray-500">Avg/Day</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Saved Reports */}
        <div className="col-span-1">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Saved Reports
          </h2>
          <div className="space-y-2">
            {savedReports.map(report => (
              <div
                key={report.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  activeReport?.id === report.id
                    ? 'bg-indigo-50 border-indigo-300 dark:bg-indigo-900/20'
                    : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:border-gray-300'
                }`}
                onClick={() => loadTemplate(report)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{report.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteReport(report.id)
                    }}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {report.dataSource} → {report.chartType} by {report.groupBy}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart Display */}
        <div className="col-span-2">
          {activeReport ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">{activeReport.name}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => generateReport(activeReport)}
                    className="p-2 text-gray-500 hover:text-indigo-600"
                    title="Refresh"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={exportToCSV}
                    className="p-2 text-gray-500 hover:text-green-600"
                    title="Export CSV"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="p-2 text-gray-500 hover:text-purple-600"
                    title="Copy"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : chartData ? (
                <div className="h-64 flex items-center justify-center">
                  {/* Simple CSS-based chart visualization */}
                  <div className="w-full">
                    {activeReport.chartType === 'stat' ? (
                      <div className="grid grid-cols-3 gap-4 h-64 items-center">
                        {chartData.labels.map((label: string, i: number) => (
                          <div key={label} className="text-center">
                            <div className="text-3xl font-bold" style={{ color: chartData.colors[i] }}>
                              {chartData.values[i]}
                            </div>
                            <div className="text-sm text-gray-500">{label}</div>
                          </div>
                        ))}
                      </div>
                    ) : activeReport.chartType === 'pie' ? (
                      <div className="flex items-center justify-center gap-8">
                        <div className="relative w-48 h-48">
                          <svg viewBox="0 0 100 100" className="transform -rotate-90">
                            {chartData.values.reduce((acc: string, val: number, i: number) => {
                              const total = chartData.values.reduce((a: number, b: number) => a + b, 0)
                              const percent = val / total * 100
                              const prev = acc ? parseFloat(acc.match(/stroke-dasharray="([^"]+)/)?.[1] || '0') / 100 * total : 0
                              const dashArray = `${percent} ${100 - percent}`
                              const dashOffset = -prev
                              return acc + `<circle cx="50" cy="50" r="40" fill="transparent" stroke="${chartData.colors[i]}" stroke-width="20" stroke-dasharray="${dashArray}" stroke-dashoffset="${dashOffset}" />`
                            }, '')}
                          </svg>
                        </div>
                        <div className="space-y-2">
                          {chartData.labels.map((label: string, i: number) => (
                            <div key={label} className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartData.colors[i] }} />
                              <span className="text-sm">{label}: {chartData.values[i]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-end gap-2 h-48">
                        {chartData.labels.map((label: string, i: number) => {
                          const maxVal = Math.max(...chartData.values)
                          const height = maxVal > 0 ? (chartData.values[i] / maxVal) * 100 : 0
                          return (
                            <div key={label} className="flex-1 flex flex-col items-center gap-1">
                              <div
                                className="w-full rounded-t transition-all"
                                style={{
                                  height: `${height}%`,
                                  backgroundColor: chartData.colors[i],
                                  minHeight: '4px'
                                }}
                              />
                              <span className="text-xs text-gray-500 truncate w-full text-center">{label}</span>
                              <span className="text-xs font-medium">{chartData.values[i]}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No data available
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
              <BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Select a report or create a new one</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Report Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Create Report</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Report Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Data Source</label>
                <select
                  value={formData.dataSource}
                  onChange={(e) => setFormData({ ...formData, dataSource: e.target.value as DataSource })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="tasks">Tasks</option>
                  <option value="portfolios">Portfolios</option>
                  <option value="time">Time Tracking</option>
                  <option value="karma">Karma Points</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Chart Type</label>
                <select
                  value={formData.chartType}
                  onChange={(e) => setFormData({ ...formData, chartType: e.target.value as ChartType })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="bar">Bar Chart</option>
                  <option value="pie">Pie Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="stat">Stat Cards</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Group By</label>
                <select
                  value={formData.groupBy}
                  onChange={(e) => setFormData({ ...formData, groupBy: e.target.value as GroupBy })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="status">Status</option>
                  <option value="priority">Priority</option>
                  <option value="portfolio">Portfolio</option>
                  <option value="tag">Tags</option>
                  <option value="date">Date</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveReport}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
