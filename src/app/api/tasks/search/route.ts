import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Advanced search endpoint with full-text search and multiple filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Search query
    const query = searchParams.get('q')?.toLowerCase() || ''
    
    // Filters
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const starred = searchParams.get('starred')
    const assigneeId = searchParams.get('assigneeId')
    const tag = searchParams.get('tag')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const hasDueDate = searchParams.get('hasDueDate')
    const hasLocation = searchParams.get('hasLocation')
    const isRecurring = searchParams.get('isRecurring')
    
    // Sorting
    const sortBy = searchParams.get('sortBy') || 'updatedAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      deletedAt: null
    }

    // Full-text search on title and description
    if (query) {
      where.OR = [
        { title: { contains: query } },
        { description: { contains: query } }
      ]
    }

    // Status filter
    if (status) {
      where.status = status
    }

    // Priority filter
    if (priority) {
      where.priority = priority
    }

    // Starred filter
    if (starred !== null) {
      where.starred = starred === 'true'
    }

    // Assignee filter
    if (assigneeId) {
      where.assigneeId = assigneeId
    }

    // Tag filter
    if (tag) {
      where.tags = { contains: tag }
    }

    // Date range filters
    if (dateFrom || dateTo) {
      where.dueDate = {}
      if (dateFrom) {
        where.dueDate.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.dueDate.lte = new Date(dateTo)
      }
    }

    // Has due date filter
    if (hasDueDate !== null) {
      if (hasDueDate === 'true') {
        where.dueDate = { ...where.dueDate, not: null }
      } else {
        where.dueDate = null
      }
    }

    // Has location filter
    if (hasLocation !== null) {
      where.locationEnabled = hasLocation === 'true'
    }

    // Recurring filter
    if (isRecurring !== null) {
      where.recurring = isRecurring === 'true' ? { not: null } : null
    }

    // Get total count
    const total = await prisma.task.count({ where })

    // Get paginated results
    const tasks = await prisma.task.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      include: {
        subtasks: true
      }
    })

    // Calculate facets for filter UI
    const facets = {
      byStatus: await prisma.task.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: true
      }),
      byPriority: await prisma.task.groupBy({
        by: ['priority'],
        where: { deletedAt: null },
        _count: true
      }),
      byTag: await getTagCounts(),
      totalStarred: await prisma.task.count({
        where: { starred: true, deletedAt: null }
      }),
      totalWithDueDate: await prisma.task.count({
        where: { dueDate: { not: null }, deletedAt: null }
      }),
      totalRecurring: await prisma.task.count({
        where: { recurrence: { not: null }, deletedAt: null }
      })
    }

    return NextResponse.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + tasks.length < total
      },
      facets,
      query
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}

async function getTagCounts() {
  const tasks = await prisma.task.findMany({
    where: { deletedAt: null },
    select: { tags: true }
  })
  
  const tagCounts: Record<string, number> = {}
  tasks.forEach(task => {
    const tags = JSON.parse(task.tags || '[]')
    tags.forEach((tag: string) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    })
  })
  
  return Object.entries(tagCounts).map(([name, count]) => ({ name, count }))
}
