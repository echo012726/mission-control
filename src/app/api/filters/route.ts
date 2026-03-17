import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET /api/filters - List all saved filters
export async function GET(req: NextRequest) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const filters = await prisma.savedFilter.findMany({
    orderBy: { order: 'asc' },
  })

  return NextResponse.json(filters)
}

// POST /api/filters - Create a new saved filter
export async function POST(req: NextRequest) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, filters } = body

  if (!name || !filters) {
    return NextResponse.json(
      { error: 'Name and filters are required' },
      { status: 400 }
    )
  }

  // Get the highest order value
  const lastFilter = await prisma.savedFilter.findFirst({
    orderBy: { order: 'desc' },
  })
  const newOrder = lastFilter ? lastFilter.order + 1 : 0

  const filter = await prisma.savedFilter.create({
    data: {
      name,
      filters: JSON.stringify(filters),
      order: newOrder,
    },
  })

  return NextResponse.json({
    ...filter,
    filters: JSON.parse(filter.filters),
  })
}
