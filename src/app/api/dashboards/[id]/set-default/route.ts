import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DEFAULT_USER = 'default'

// POST /api/dashboards/[id]/set-default - Set dashboard as default

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // First, unset all defaults
    await prisma.dashboardConfig.updateMany({
      where: { userId: DEFAULT_USER },
      data: { isDefault: false }
    })

    // Then set the specified dashboard as default
    const dashboard = await prisma.dashboardConfig.update({
      where: { id },
      data: { isDefault: true }
    })

    return NextResponse.json({
      id: dashboard.id,
      name: dashboard.name,
      isDefault: dashboard.isDefault,
      widgets: JSON.parse(dashboard.widgets),
      settings: JSON.parse(dashboard.settings),
      createdAt: dashboard.createdAt,
      updatedAt: dashboard.updatedAt
    })
  } catch (error) {
    console.error('Dashboard set-default error:', error)
    return NextResponse.json({ error: 'Failed to set default dashboard' }, { status: 500 })
  }
}
