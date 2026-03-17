import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3456/api/calendar/callback'

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
].join(' ')

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')

    // Get current connection status
    if (action === 'status') {
      const account = await prisma.googleAccount.findFirst({
        where: { userId: 'default' }
      })
      
      if (!account) {
        return NextResponse.json({ connected: false })
      }

      return NextResponse.json({
        connected: true,
        email: account.email,
        lastSyncAt: account.lastSyncAt,
        syncEnabled: account.syncEnabled
      })
    }

    // Initiate OAuth flow
    if (action === 'auth') {
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
      authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', SCOPES)
      authUrl.searchParams.set('access_type', 'offline')
      authUrl.searchParams.set('prompt', 'consent')
      authUrl.searchParams.set('state', 'default')

      return NextResponse.json({ authUrl: authUrl.toString() })
    }

    // Disconnect account
    if (action === 'disconnect') {
      await prisma.googleAccount.deleteMany({
        where: { userId: 'default' }
      })
      
      return NextResponse.json({ success: true, message: 'Disconnected from Google Calendar' })
    }

    // Get upcoming events from Google Calendar
    if (action === 'events') {
      const account = await prisma.googleAccount.findFirst({
        where: { userId: 'default' }
      })

      if (!account) {
        return NextResponse.json({ error: 'Not connected' }, { status: 401 })
      }

      // Refresh token if needed
      const now = new Date()
      if (account.expiresAt < now) {
        const refreshed = await refreshAccessToken(account.refreshToken)
        if (!refreshed) {
          return NextResponse.json({ error: 'Failed to refresh token' }, { status: 401 })
        }
      }

      const calendarId = account.calendarId || 'primary'
      const eventsUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?timeMin=${new Date().toISOString()}&maxResults=20&singleEvents=true&orderBy=startTime`

      const response = await fetch(eventsUrl, {
        headers: {
          Authorization: `Bearer ${account.accessToken}`
        }
      })

      if (!response.ok) {
        const error = await response.text()
        return NextResponse.json({ error: 'Failed to fetch events', details: error }, { status: response.status })
      }

      const data = await response.json()
      return NextResponse.json({ events: data.items || [] })
    }

    return NextResponse.json({ 
      message: 'Calendar API',
      actions: ['status', 'auth', 'disconnect', 'events', 'sync']
    })

  } catch (error) {
    console.error('Calendar API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    // Toggle sync enabled/disabled
    if (action === 'toggleSync') {
      const account = await prisma.googleAccount.findFirst({
        where: { userId: 'default' }
      })

      if (!account) {
        return NextResponse.json({ error: 'Not connected' }, { status: 401 })
      }

      const updated = await prisma.googleAccount.update({
        where: { id: account.id },
        data: { syncEnabled: body.enabled }
      })

      return NextResponse.json({ 
        success: true, 
        syncEnabled: updated.syncEnabled 
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  } catch (error) {
    console.error('Calendar POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
      console.error('Failed to refresh token:', await response.text())
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
