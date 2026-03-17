import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DEFAULT_USER = 'default'

export async function GET() {
  try {
    let config = await prisma.dashboardConfig.findFirst({
      where: { userId: DEFAULT_USER }
    })

    // Create default config if none exists
    if (!config) {
      config = await prisma.dashboardConfig.create({
        data: {
          userId: DEFAULT_USER,
          widgets: JSON.stringify([
            { id: 'w1', type: 'tasksummary', title: 'Task Summary' },
            { id: 'w2', type: 'recenttasks', title: 'Recent Tasks' },
            { id: 'w3', type: 'upcoming', title: 'Upcoming Due' },
            { id: 'w4', type: 'labels', title: 'Labels' },
            { id: 'w5', type: 'weather', title: 'Weather', location: 'Lisbon' },
            { id: 'w6', type: 'agentoffice', title: 'Agent Office' },
            { id: 'w7', type: 'passiveincome', title: 'Passive Income' },
            { id: 'w8', type: 'todoist', title: 'Todoist Sync' },
            { id: 'w9', type: 'familytracker', title: 'Family Tracker' },
            { id: 'w10', type: 'calendar', title: 'Calendar' },
            { id: 'w11', type: 'reminders', title: 'Reminders' },
          ]),
          settings: JSON.stringify({})
        }
      })
    }

    return NextResponse.json({
      widgets: JSON.parse(config.widgets),
      settings: JSON.parse(config.settings)
    })
  } catch (error) {
    console.error('Dashboard GET error:', error)
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { widgets, settings } = body

    const widgetData = widgets ? JSON.stringify(widgets) : undefined
    const settingsData = settings ? JSON.stringify(settings) : undefined

    let config = await prisma.dashboardConfig.findFirst({
      where: { userId: DEFAULT_USER }
    })

    if (config) {
      config = await prisma.dashboardConfig.update({
        where: { id: config.id },
        data: {
          ...(widgetData && { widgets: widgetData }),
          ...(settingsData && { settings: settingsData }),
          updatedAt: new Date()
        }
      })
    } else {
      config = await prisma.dashboardConfig.create({
        data: {
          userId: DEFAULT_USER,
          widgets: widgetData || '[]',
          settings: settingsData || '{}'
        }
      })
    }

    return NextResponse.json({
      widgets: JSON.parse(config.widgets),
      settings: JSON.parse(config.settings)
    })
  } catch (error) {
    console.error('Dashboard PUT error:', error)
    return NextResponse.json({ error: 'Failed to save dashboard' }, { status: 500 })
  }
}
