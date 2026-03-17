import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DEFAULT_USER = 'default'

// POST /api/dashboards/[id]/copy - Create a copy of a dashboard

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name } = body

    // Get the source dashboard
    const source = await prisma.dashboardConfig.findFirst({
      where: { id, userId: DEFAULT_USER }
    })

    if (!source) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
    }

    // Create a copy with a new name
    const copy = await prisma.dashboardConfig.create({
      data: {
        userId: DEFAULT_USER,
        name: name || `${source.name} (Copy)`,
        isDefault: false,
        widgets: source.widgets,
        settings: source.settings
      }
    })

    return NextResponse.json({
      id: copy.id,
      name: copy.name,
      isDefault: copy.isDefault,
      widgets: JSON.parse(copy.widgets),
      settings: JSON.parse(copy.settings),
      createdAt: copy.createdAt,
      updatedAt: copy.updatedAt
    }, { status: 201 })
  } catch (error) {
    console.error('Dashboard copy error:', error)
    return NextResponse.json({ error: 'Failed to copy dashboard' }, { status: 500 })
  }
}
