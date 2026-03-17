import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DEFAULT_USER = 'default'

// GET /api/dashboards/[id] - Get specific dashboard
// PUT /api/dashboards/[id] - Update dashboard
// DELETE /api/dashboards/[id] - Delete dashboard

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const dashboard = await prisma.dashboardConfig.findFirst({
      where: { id, userId: DEFAULT_USER }
    })

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
    }

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
    console.error('Dashboard GET error:', error)
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, widgets, settings } = body

    const dashboard = await prisma.dashboardConfig.findFirst({
      where: { id, userId: DEFAULT_USER }
    })

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
    }

    const updated = await prisma.dashboardConfig.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(widgets !== undefined && { widgets: JSON.stringify(widgets) }),
        ...(settings !== undefined && { settings: JSON.stringify(settings) }),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      isDefault: updated.isDefault,
      widgets: JSON.parse(updated.widgets),
      settings: JSON.parse(updated.settings),
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    })
  } catch (error) {
    console.error('Dashboard PUT error:', error)
    return NextResponse.json({ error: 'Failed to update dashboard' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const dashboard = await prisma.dashboardConfig.findFirst({
      where: { id, userId: DEFAULT_USER }
    })

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
    }

    // Check if this is the last dashboard
    const count = await prisma.dashboardConfig.count({
      where: { userId: DEFAULT_USER }
    })

    if (count <= 1) {
      return NextResponse.json({ error: 'Cannot delete last dashboard' }, { status: 400 })
    }

    // If deleted dashboard was default, make another one default
    if (dashboard.isDefault) {
      const first = await prisma.dashboardConfig.findFirst({
        where: { userId: DEFAULT_USER }
      })
      if (first) {
        await prisma.dashboardConfig.update({
          where: { id: first.id },
          data: { isDefault: true }
        })
      }
    }

    await prisma.dashboardConfig.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Dashboard DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete dashboard' }, { status: 500 })
  }
}
