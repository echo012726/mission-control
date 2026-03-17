import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { direction } = body // 'to' = MC to GCal, 'from' = GCal to MC

    const account = await prisma.googleAccount.findFirst({
      where: { userId: 'default' }
    })

    if (!account) {
      return NextResponse.json({ error: 'Not connected to Google Calendar' }, { status: 401 })
    }

    if (!account.syncEnabled) {
      return NextResponse.json({ error: 'Sync is disabled' }, { status: 400 })
    }

    // Refresh token if needed
    let accessToken = account.accessToken
    const now = new Date()
    if (account.expiresAt < now) {
      const refreshed = await refreshAccessToken(account.refreshToken)
      if (!refreshed) {
        return NextResponse.json({ error: 'Failed to refresh token' }, { status: 401 })
      }
      // Get updated account
      const updatedAccount = await prisma.googleAccount.findFirst({
        where: { userId: 'default' }
      })
      accessToken = updatedAccount?.accessToken || ''
    }

    const calendarId = account.calendarId || 'primary'

    if (direction === 'to' || !direction) {
      // Sync tasks FROM Mission Control TO Google Calendar
      await syncTasksToGoogleCalendar(accessToken, calendarId, prisma)
    }

    if (direction === 'from' || !direction) {
      // Sync events FROM Google Calendar TO Mission Control
      await syncEventsToMissionCalendar(accessToken, calendarId, prisma)
    }

    // Update last sync time
    await prisma.googleAccount.update({
      where: { id: account.id },
      data: { lastSyncAt: new Date() }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Sync completed',
      syncedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Calendar sync error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}

async function syncTasksToGoogleCalendar(accessToken: string, calendarId: string, prisma: PrismaClient) {
  // Get tasks with due dates that haven't been synced
  const tasks = await prisma.task.findMany({
    where: {
      dueDate: { not: null },
      deletedAt: null,
      status: { not: 'done' }
    }
  })

  for (const task of tasks) {
    if (task.googleCalendarId) {
      // Update existing event
      const eventUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${task.googleCalendarId}`
      
      const eventData = {
        summary: task.title,
        description: task.description || '',
        start: task.dueDate ? {
          dateTime: task.dueDate.toISOString(),
          timeZone: 'UTC'
        } : undefined,
        end: task.dueDate ? {
          dateTime: new Date(task.dueDate.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
          timeZone: 'UTC'
        } : undefined
      }

      await fetch(eventUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      })
    } else {
      // Create new event
      const eventsUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`
      
      const eventData = {
        summary: task.title,
        description: task.description || '',
        start: task.dueDate ? {
          dateTime: task.dueDate.toISOString(),
          timeZone: 'UTC'
        } : undefined,
        end: task.dueDate ? {
          dateTime: new Date(task.dueDate.getTime() + 60 * 60 * 1000).toISOString(),
          timeZone: 'UTC'
        } : undefined
      }

      const response = await fetch(eventsUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      })

      if (response.ok) {
        const event = await response.json()
        // Store the Google Calendar event ID
        await prisma.task.update({
          where: { id: task.id },
          data: { googleCalendarId: event.id }
        })
      }
    }
  }
}

async function syncEventsToMissionCalendar(accessToken: string, calendarId: string, prisma: PrismaClient) {
  // Get events from the last 30 days
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)
  
  const eventsUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?timeMin=${startDate.toISOString()}&singleEvents=true&orderBy=startTime`

  const response = await fetch(eventsUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch Google Calendar events')
  }

  const data = await response.json()
  const events = data.items || []

  for (const event of events) {
    // Skip all-day events and events without start time
    if (!event.start?.dateTime) continue

    // Check if we already have this event
    const existingTask = await prisma.task.findFirst({
      where: { googleCalendarId: event.id }
    })

    if (existingTask) {
      // Update existing task if the event was modified
      const eventUpdated = new Date(event.updated)
      if (existingTask.updatedAt < eventUpdated) {
        await prisma.task.update({
          where: { id: existingTask.id },
          data: {
            title: event.summary || 'Untitled',
            description: event.description || '',
            dueDate: new Date(event.start.dateTime)
          }
        })
      }
    } else if (!event.transparent) { // Skip "free busy" events
      // Create new task from event
      await prisma.task.create({
        data: {
          title: event.summary || 'Untitled',
          description: event.description || '',
          status: 'inbox',
          priority: 'medium',
          dueDate: new Date(event.start.dateTime),
          googleCalendarId: event.id
        }
      })
    }
  }
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    const expiresAt = new Date(Date.now() + data.expires_in * 1000)

    await prisma.googleAccount.updateMany({
      where: { userId: 'default' },
      data: {
        accessToken: data.access_token,
        expiresAt
      }
    })

    return data.access_token
  } catch (error) {
    console.error('Token refresh error:', error)
    return null
  }
}
