import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    
    // Simple token auth for calendar subscriptions
    // In production, you'd want proper authentication
    if (token) {
      // Allow token-based access for calendar subscriptions
    }

    // Get tasks with due dates
    const tasks = await prisma.task.findMany({
      where: {
        dueDate: { not: null },
        status: { not: 'done' }
      },
      orderBy: { dueDate: 'asc' }
    })

    // Build ICS calendar content
    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Mission Control//Task Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Mission Control Tasks'
    ]

    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

    for (const task of tasks) {
      if (!task.dueDate) continue
      
      const uid = `${task.id}@mission-control`
      const dtstart = new Date(task.dueDate).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      const dtend = new Date(new Date(task.dueDate).getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z' // 1 hour duration
      
      // Priority mapping (ICS uses 0-9 where 1 is highest)
      const icsPriority = task.priority === 'high' ? '1' : task.priority === 'medium' ? '5' : '9'
      
      // Status
      const icsStatus = task.status === 'done' ? 'COMPLETED' : 'TENTATIVE'
      
      // Description (escape special characters)
      const description = (task.description || '').replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n')
      const title = task.title.replace(/[,;\\]/g, '\\$&')

      icsLines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${now}`,
        `DTSTART:${dtstart}`,
        `DTEND:${dtend}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${description}`,
        `PRIORITY:${icsPriority}`,
        `STATUS:${icsStatus}`,
        `URL:https://mission-control.example.com/tasks/${task.id}`,
        'END:VEVENT'
      )
    }

    icsLines.push('END:VCALENDAR')

    const icsContent = icsLines.join('\r\n')

    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="mission-control-tasks.ics"',
        'Cache-Control': 'private, max-age=3600'
      }
    })
  } catch (error) {
    console.error('ICS export error:', error)
    return NextResponse.json({ error: 'Failed to generate calendar' }, { status: 500 })
  }
}
