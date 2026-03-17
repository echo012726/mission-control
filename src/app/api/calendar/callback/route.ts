import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3456/api/calendar/callback'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const state = searchParams.get('state')

    if (error) {
      return NextResponse.redirect(new URL('/?calendar_error=' + error, request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL('/?calendar_error=no_code', request.url))
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange error:', errorText)
      return NextResponse.redirect(new URL('/?calendar_error=token_exchange_failed', request.url))
    }

    const tokens = await tokenResponse.json()

    // Get user email from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    })

    if (!userResponse.ok) {
      return NextResponse.redirect(new URL('/?calendar_error=user_info_failed', request.url))
    }

    const userInfo = await userResponse.json()

    // Get primary calendar ID
    const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList/primary', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    })

    let calendarId = 'primary'
    if (calendarResponse.ok) {
      const calendarData = await calendarResponse.json()
      calendarId = calendarData.id || 'primary'
    }

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)

    // Store or update Google account
    const existingAccount = await prisma.googleAccount.findFirst({
      where: { userId: state || 'default' }
    })

    if (existingAccount) {
      await prisma.googleAccount.update({
        where: { id: existingAccount.id },
        data: {
          email: userInfo.email,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || existingAccount.refreshToken,
          expiresAt,
          calendarId,
          syncEnabled: true
        }
      })
    } else {
      await prisma.googleAccount.create({
        data: {
          userId: state || 'default',
          email: userInfo.email,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || '',
          expiresAt,
          calendarId,
          syncEnabled: true
        }
      })
    }

    // Redirect back to app with success
    return NextResponse.redirect(new URL('/?calendar_connected=true', request.url))

  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(new URL('/?calendar_error=internal_error', request.url))
  }
}
