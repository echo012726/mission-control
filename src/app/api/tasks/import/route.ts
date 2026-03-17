import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, logActivity } from '@/lib/auth'

function parseCSVRow(row: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i]
    const nextChar = row[i + 1]
    
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
  }
  result.push(current.trim())
  return result
}

export async function POST(req: NextRequest) {
  const isDev = process.env.NODE_ENV !== 'production'

  if (!isDev) {
    const authenticated = await getSession()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const body = await req.json()
    const { csv } = body

    if (!csv) {
      return NextResponse.json({ error: 'No CSV data provided' }, { status: 400 })
    }

    const lines = csv.split('\n').filter((line: string) => line.trim())
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV must have header row and at least one data row' }, { status: 400 })
    }

    const headers = parseCSVRow(lines[0]).map(h => h.toLowerCase().trim())
    
    // Map common header variations
    const headerMap: Record<string, string> = {
      'title': 'title',
      'task': 'title',
      'name': 'title',
      'description': 'description',
      'desc': 'description',
      'status': 'status',
      'state': 'status',
      'priority': 'priority',
      'p': 'priority',
      'tags': 'tags',
      'labels': 'labels',
      'due date': 'dueDate',
      'due': 'dueDate',
      'date': 'dueDate',
      'estimated time (min)': 'estimatedTime',
      'estimated': 'estimatedTime',
      'time estimate': 'estimatedTime',
      'recurrence': 'recurrence',
      'repeat': 'recurrence',
    }

    const getHeaderIndex = (name: string): number => {
      const mapped = headerMap[name] || name
      return headers.findIndex(h => h === mapped || h.includes(name))
    }

    const titleIdx = getHeaderIndex('title')
    const descIdx = getHeaderIndex('description')
    const statusIdx = getHeaderIndex('status')
    const priorityIdx = getHeaderIndex('priority')
    const tagsIdx = getHeaderIndex('tags')
    const labelsIdx = getHeaderIndex('labels')
    const dueDateIdx = getHeaderIndex('dueDate')
    const estimatedTimeIdx = getHeaderIndex('estimatedTime')
    const recurrenceIdx = getHeaderIndex('recurrence')

    if (titleIdx === -1) {
      return NextResponse.json({ error: 'CSV must have a Title column' }, { status: 400 })
    }

    const validStatuses = ['inbox', 'planned', 'in_progress', 'blocked', 'done']
    const validPriorities = ['low', 'medium', 'high']

    let imported = 0
    let skipped = 0
    const errors: string[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVRow(lines[i])
      
      if (!values[titleIdx] || !values[titleIdx].trim()) {
        skipped++
        continue
      }

      const taskData: Record<string, unknown> = {
        title: values[titleIdx].trim(),
      }

      if (descIdx !== -1 && values[descIdx]) {
        taskData.description = values[descIdx].trim()
      }

      if (statusIdx !== -1 && values[statusIdx]) {
        const status = values[statusIdx].trim().toLowerCase()
        if (validStatuses.includes(status)) {
          taskData.status = status
        } else {
          errors.push(`Row ${i + 1}: Invalid status "${values[statusIdx]}" - using "inbox"`)
          taskData.status = 'inbox'
        }
      } else {
        taskData.status = 'inbox'
      }

      if (priorityIdx !== -1 && values[priorityIdx]) {
        const priority = values[priorityIdx].trim().toLowerCase()
        if (validPriorities.includes(priority)) {
          taskData.priority = priority
        } else {
          taskData.priority = 'medium'
        }
      } else {
        taskData.priority = 'medium'
      }

      if (tagsIdx !== -1 && values[tagsIdx]) {
        const tags = values[tagsIdx].split(';').map(t => t.trim()).filter(Boolean)
        taskData.tags = JSON.stringify(tags)
      }

      if (labelsIdx !== -1 && values[labelsIdx]) {
        const labels = values[labelsIdx].split(';').map(l => l.trim()).filter(Boolean)
        taskData.labels = JSON.stringify(labels)
      }

      if (dueDateIdx !== -1 && values[dueDateIdx]) {
        try {
          const date = new Date(values[dueDateIdx].trim())
          if (!isNaN(date.getTime())) {
            taskData.dueDate = date
          }
        } catch {
          errors.push(`Row ${i + 1}: Invalid date format`)
        }
      }

      if (estimatedTimeIdx !== -1 && values[estimatedTimeIdx]) {
        const mins = parseInt(values[estimatedTimeIdx].trim())
        if (!isNaN(mins)) {
          taskData.estimatedTime = mins * 60 // Convert to seconds
        }
      }

      if (recurrenceIdx !== -1 && values[recurrenceIdx]) {
        const recurrence = values[recurrenceIdx].trim().toLowerCase()
        if (['daily', 'weekly', 'monthly'].includes(recurrence)) {
          taskData.recurrence = recurrence
        }
      }

      await prisma.task.create({
        data: taskData as any
      })
      imported++
    }

    await logActivity('tasks_imported', { count: imported, skipped })

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully imported ${imported} tasks${skipped > 0 ? `, skipped ${skipped} rows` : ''}`
    })
  } catch (error) {
    console.error('CSV import error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Import failed' 
    }, { status: 500 })
  }
}
