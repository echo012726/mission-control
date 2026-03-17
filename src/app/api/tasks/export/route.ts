import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return []

  try {
    const parsed = JSON.parse(value)

    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item))
    }

    if (typeof parsed === 'string') {
      const parsedAgain = JSON.parse(parsed)
      return Array.isArray(parsedAgain) ? parsedAgain.map((item) => String(item)) : []
    }
  } catch {
    return []
  }

  return []
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '""'
  const stringValue = String(value).replace(/"/g, '""')
  return `"${stringValue}"`
}

interface TaskWithRelations {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  tags: string[]
  labels: string[]
  dueDate: Date | null
  dueTime: string | null
  reminder: Date | null
  timeSpent: number
  estimatedTime: number | null
  recurrence: string | null
  starred: boolean
  createdAt: Date
  updatedAt: Date
  subtasks: { id: string; title: string; completed: boolean; order: number }[]
  _count: { attachments: number }
}

function buildTaskFilter(searchParams: URLSearchParams): Record<string, unknown> {
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const searchQuery = searchParams.get('q')?.trim()
  const tags = searchParams.get('tags')?.trim()
  const starred = searchParams.get('starred')
  const includeTrashed = searchParams.get('includeTrashed') === 'true'

  const where: Record<string, unknown> = {}

  if (status) where.status = status
  if (priority) where.priority = priority
  if (starred === 'true') where.starred = true

  if (searchQuery) {
    where.OR = [
      { title: { contains: searchQuery } },
      { description: { contains: searchQuery } },
    ]
  }

  if (tags) {
    const firstTag = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)[0]

    if (firstTag) {
      where.tags = { contains: firstTag }
    }
  }

  if (!includeTrashed) {
    where.deletedAt = null
  }

  return where
}

export async function GET(req: NextRequest) {
  const isDev = process.env.NODE_ENV !== 'production'

  if (!isDev) {
    const authenticated = await getSession()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const { searchParams } = new URL(req.url)
  const format = searchParams.get('format') || 'csv'
  const label = searchParams.get('label')
  
  const where = buildTaskFilter(searchParams)

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      subtasks: { orderBy: { order: 'asc' } },
      _count: { select: { attachments: true } },
    },
  })

  const normalizedTasks: TaskWithRelations[] = tasks.map((task) => ({
    ...task,
    tags: parseJsonArray(task.tags),
    labels: parseJsonArray(task.labels),
  }))

  const filteredTasks = label
    ? normalizedTasks.filter((task) => task.labels.includes(label))
    : normalizedTasks

  // Export based on format
  if (format === 'json') {
    const exportData = filteredTasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      tags: task.tags,
      labels: task.labels,
      dueDate: task.dueDate?.toISOString() || null,
      dueTime: task.dueTime,
      estimatedTime: task.estimatedTime,
      timeSpent: task.timeSpent,
      recurrence: task.recurrence,
      starred: task.starred,
      subtasks: task.subtasks.map(st => ({
        id: st.id,
        title: st.title,
        completed: st.completed,
        order: st.order
      })),
      attachmentCount: task._count.attachments,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }))

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="tasks-export-${new Date().toISOString().split('T')[0]}.json"`,
        'Cache-Control': 'no-store',
      },
    })
  }

  if (format === 'pdf') {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(20)
    doc.setTextColor(40, 40, 40)
    doc.text('Mission Control - Task Export', 14, 22)
    
    // Export date
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Exported: ${new Date().toLocaleDateString()}`, 14, 30)
    
    // Summary stats
    doc.setFontSize(12)
    doc.setTextColor(40, 40, 40)
    doc.text(`Total Tasks: ${filteredTasks.length}`, 14, 40)
    
    // Count by status
    const statusCounts: Record<string, number> = {}
    const priorityCounts: Record<string, number> = {}
    
    filteredTasks.forEach(task => {
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1
      priorityCounts[task.priority] = (priorityCounts[task.priority] || 0) + 1
    })
    
    const statusText = Object.entries(statusCounts)
      .map(([s, c]) => `${s}: ${c}`)
      .join(' | ')
    const priorityText = Object.entries(priorityCounts)
      .map(([p, c]) => `${p}: ${c}`)
      .join(' | ')
    
    doc.setFontSize(9)
    doc.text(`By Status: ${statusText}`, 14, 48)
    doc.text(`By Priority: ${priorityText}`, 14, 54)
    
    // Table data
    const tableData = filteredTasks.map(task => [
      task.title.substring(0, 40) + (task.title.length > 40 ? '...' : ''),
      task.status,
      task.priority,
      task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-',
      task.tags.slice(0, 3).join(', ') + (task.tags.length > 3 ? '...' : ''),
    ])
    
    // Priority colors
    const priorityColors: Record<string, [number, number, number]> = {
      urgent: [220, 53, 69],
      high: [255, 193, 7],
      medium: [0, 123, 255],
      low: [108, 117, 125],
    }
    
    autoTable(doc, {
      head: [['Title', 'Status', 'Priority', 'Due Date', 'Tags']],
      body: tableData,
      startY: 62,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: 255,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 30 },
        4: { cellWidth: 'auto' },
      },
      didParseCell: function(data) {
        if (data.column.index === 2 && data.section === 'body') {
          const priority = data.cell.raw as string
          if (priorityColors[priority]) {
            data.cell.styles.textColor = priorityColors[priority]
            data.cell.styles.fontStyle = 'bold'
          }
        }
      },
    })
    
    const pdfBuffer = doc.output('arraybuffer')
    
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="tasks-export-${new Date().toISOString().split('T')[0]}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  }

  // Default: CSV export
  const headers = [
    'ID',
    'Title',
    'Description',
    'Status',
    'Priority',
    'Tags',
    'Labels',
    'Due Date',
    'Due Time',
    'Estimated Time (min)',
    'Time Spent (sec)',
    'Subtasks',
    'Attachments',
    'Recurrence',
    'Starred',
    'Created At',
    'Updated At',
  ]

  const csvRows = [headers.map(csvCell).join(',')]

  for (const task of filteredTasks) {
    const row = [
      task.id,
      task.title || '',
      task.description || '',
      task.status || '',
      task.priority || '',
      task.tags.join('; '),
      task.labels.join('; '),
      task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      task.dueTime || '',
      task.estimatedTime ? String(Math.round(task.estimatedTime / 60)) : '',
      String(task.timeSpent || 0),
      String(task.subtasks.length),
      String(task._count.attachments),
      task.recurrence || '',
      task.starred ? 'true' : 'false',
      task.createdAt ? new Date(task.createdAt).toISOString() : '',
      task.updatedAt ? new Date(task.updatedAt).toISOString() : '',
    ]

    csvRows.push(row.map(csvCell).join(','))
  }

  const csv = `\uFEFF${csvRows.join('\n')}`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="tasks-export-${new Date().toISOString().split('T')[0]}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
