import { Task } from '@prisma/client'

export function exportToJSON(tasks: Task[]) {
  const data = JSON.stringify(tasks, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tasks-${new Date().toISOString().split('T')[0]}.json`
  a.click()
}

export function exportToCSV(tasks: Task[]) {
  const headers = ['Title', 'Status', 'Priority', 'Due Date', 'Tags']
  const rows = tasks.map(t => [
    t.title,
    t.status,
    t.priority || '',
    t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '',
    t.tags || ''
  ])
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tasks-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
}

export function exportToMarkdown(tasks: Task[]) {
  const md = tasks.map(t => `- [${t.status === 'done' ? 'x' : ' '}] ${t.title} (${t.priority || 'none'})`).join('\n')
  const blob = new Blob([`# Tasks\n\n${md}`], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tasks-${new Date().toISOString().split('T')[0]}.md`
  a.click()
}

// Server-side export functions (for use in API routes)
export function generateCSV(tasks: Task[]): string {
  const headers = ['Title', 'Status', 'Priority', 'Due Date', 'Tags']
  const rows = tasks.map(t => [
    t.title,
    t.status,
    t.priority || '',
    t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '',
    t.tags || ''
  ])
  return [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
}

export function generateJSON(tasks: Task[]): string {
  return JSON.stringify(tasks, null, 2)
}

// Utility to trigger export from client via API
export async function exportTasksViaAPI(
  options: {
    format?: 'csv' | 'json' | 'pdf'
    status?: string
    priority?: string
    label?: string
    tags?: string
    q?: string
    starred?: boolean
    includeTrashed?: boolean
  } = {}
) {
  const params = new URLSearchParams()
  
  if (options.format) params.set('format', options.format)
  if (options.status) params.set('status', options.status)
  if (options.priority) params.set('priority', options.priority)
  if (options.label) params.set('label', options.label)
  if (options.tags) params.set('tags', options.tags)
  if (options.q) params.set('q', options.q)
  if (options.starred) params.set('starred', 'true')
  if (options.includeTrashed) params.set('includeTrashed', 'true')
  
  const url = `/api/tasks/export${params.toString() ? '?' + params.toString() : ''}`
  
  window.open(url, '_blank')
}
