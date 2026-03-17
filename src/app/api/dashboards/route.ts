import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DEFAULT_USER = 'default'

// GET /api/dashboards - List all dashboards
export async function GET(req: NextRequest) {
  try {
    const dashboards = await prisma.dashboardConfig.findMany({
      where: { userId: DEFAULT_USER },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(dashboards.map(d => ({
      id: d.id,
      name: d.name,
      isDefault: d.isDefault,
      widgets: JSON.parse(d.widgets),
      settings: JSON.parse(d.settings),
      createdAt: d.createdAt,
      updatedAt: d.updatedAt
    })))
  } catch (error) {
    console.error('Dashboards GET error:', error)
    return NextResponse.json({ error: 'Failed to load dashboards' }, { status: 500 })
  }
}

// POST /api/dashboards - Create new dashboard
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, widgets, settings } = body

    // Check if this is the first dashboard (make it default)
    const existingCount = await prisma.dashboardConfig.count({
      where: { userId: DEFAULT_USER }
    })

    const dashboard = await prisma.dashboardConfig.create({
      data: {
        userId: DEFAULT_USER,
        name: name || `Dashboard ${existingCount + 1}`,
        isDefault: existingCount === 0,
        widgets: widgets ? JSON.stringify(widgets) : '[]',
        settings: settings ? JSON.stringify(settings) : '{}'
      }
    })

    return NextResponse.json({
      id: dashboard.id,
      name: dashboard.name,
      isDefault: dashboard.isDefault,
      widgets: JSON.parse(dashboard.widgets),
      settings: JSON.parse(dashboard.settings),
      createdAt: dashboard.createdAt,
      updatedAt: dashboard.updatedAt
    }, { status: 201 })
  } catch (error) {
    console.error('Dashboards POST error:', error)
    return NextResponse.json({ error: 'Failed to create dashboard' }, { status: 500 })
  }
}
