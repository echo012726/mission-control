import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Slack OAuth configuration
const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID || ''
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET || ''
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET || ''
const REDIRECT_URI = process.env.SLACK_REDIRECT_URI || 'http://localhost:3456/api/slack/callback'

const SCOPES = ['chat:write', 'channels:read', 'groups:read', 'incoming-webhook']

// GET - Status check and OAuth initiation
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')

    // Get connection status
    if (action === 'status') {
      const account = await prisma.slackAccount.findFirst({
        where: { userId: 'default' }
      })
      
      if (!account) {
        return NextResponse.json({ connected: false })
      }

      return NextResponse.json({
        connected: true,
        teamName: account.teamName,
        channelName: account.channelName,
        notifications: account.notifications,
        createdAt: account.createdAt
      })
    }

    // Initiate OAuth flow
    if (action === 'auth') {
      if (!SLACK_CLIENT_ID) {
        return NextResponse.json({ 
          error: 'Slack OAuth not configured',
          authUrl: null 
        }, { status: 500 })
      }

      const authUrl = new URL('https://slack.com/oauth/v2/authorize')
      authUrl.searchParams.set('client_id', SLACK_CLIENT_ID)
      authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
      authUrl.searchParams.set('scope', SCOPES.join(','))
      authUrl.searchParams.set('user_scope', 'identity.basic')

      return NextResponse.json({ authUrl: authUrl.toString() })
    }

    // Get configured channels
    if (action === 'channels') {
      const account = await prisma.slackAccount.findFirst({
        where: { userId: 'default' }
      })
      
      if (!account || !account.accessToken) {
        return NextResponse.json({ channels: [] })
      }

      // Fetch channels from Slack API
      const response = await fetch('https://slack.com/api/conversations.list', {
        headers: {
          'Authorization': `Bearer ${account.accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      
      if (!data.ok) {
        return NextResponse.json({ channels: [] })
      }

      const channels = data.channels.map((ch: any) => ({
        id: ch.id,
        name: ch.name,
        isPrivate: ch.is_private
      }))

      return NextResponse.json({ channels })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Slack GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - OAuth callback, disconnect, send notifications
export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')

    // OAuth callback
    if (action === 'callback') {
      const code = searchParams.get('code')
      
      if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 })
      }

      if (!SLACK_CLIENT_ID || !SLACK_CLIENT_SECRET) {
        return NextResponse.json({ error: 'Slack not configured' }, { status: 500 })
      }

      // Exchange code for tokens
      const response = await fetch('https://slack.com/api/oauth.v2.access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: SLACK_CLIENT_ID,
          client_secret: SLACK_CLIENT_SECRET,
          code,
          redirect_uri: REDIRECT_URI
        })
      })

      const data = await response.json()

      if (!data.ok) {
        console.error('Slack OAuth error:', data)
        return NextResponse.json({ error: data.error || 'OAuth failed' }, { status: 400 })
      }

      // Get team info
      const teamResponse = await fetch('https://slack.com/api/team.info', {
        headers: { 'Authorization': `Bearer ${data.access_token}` }
      })
      const teamData = await teamResponse.json()

      // Find or create account
      const account = await prisma.slackAccount.upsert({
        where: { id: data.team?.id || 'default' },
        create: {
          slackUserId: data.authed_user?.id || '',
          teamId: data.team?.id || '',
          teamName: teamData.team?.name || data.team?.name || 'Slack Team',
          accessToken: data.access_token,
          botToken: data.bot_token || data.access_token,
          scopes: JSON.stringify(data.scope?.split(',') || []),
          notifications: true
        },
        update: {
          accessToken: data.access_token,
          botToken: data.bot_token || data.access_token,
          scopes: JSON.stringify(data.scope?.split(',') || [])
        }
      })

      // If incoming webhook URL provided, save it
      if (data.incoming_webhook?.url) {
        await prisma.slackAccount.update({
          where: { id: account.id },
          data: {
            webhookUrl: data.incoming_webhook.url,
            channelId: data.incoming_webhook.channel_id,
            channelName: data.incoming_webhook.channel
          }
        })
      }

      return NextResponse.json({ 
        success: true, 
        teamName: account.teamName 
      })
    }

    // Disconnect Slack
    if (action === 'disconnect') {
      await prisma.slackAccount.deleteMany({
        where: { userId: 'default' }
      })

      return NextResponse.json({ success: true })
    }

    // Send notification
    if (action === 'notify') {
      const body = await request.json()
      const { taskId, message, channelId } = body

      const account = await prisma.slackAccount.findFirst({
        where: { userId: 'default' }
      })

      if (!account) {
        return NextResponse.json({ error: 'Slack not connected' }, { status: 400 })
      }

      // Get task info if taskId provided
      let taskTitle = ''
      let taskUrl = ''
      if (taskId) {
        const task = await prisma.task.findUnique({ where: { id: taskId } })
        if (task) {
          taskTitle = task.title
          taskUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3456'}/board?task=${task.id}`
        }
      }

      // Build Slack message
      const slackMessage = {
        text: message || `Task updated: ${taskTitle}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Task Update*${taskTitle ? `: ${taskTitle}` : ''}`
            }
          },
          ...(taskUrl ? [{
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `<${taskUrl}|View in Mission Control>`
            }
          }] : [])
        ]
      }

      // Send via webhook (preferred) or API
      if (account.webhookUrl) {
        const webhookResponse = await fetch(account.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slackMessage)
        })

        if (!webhookResponse.ok) {
          console.error('Webhook error:', await webhookResponse.text())
        }
      } else if (account.botToken && channelId) {
        // Fallback: use chat.postMessage API
        const apiResponse = await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${account.botToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            channel: channelId,
            ...slackMessage
          })
        })

        const apiData = await apiResponse.json()
        if (!apiData.ok) {
          console.error('Slack API error:', apiData)
        }
      }

      return NextResponse.json({ success: true })
    }

    // Update settings
    if (action === 'settings') {
      const body = await request.json()
      const { notifications, channelId, channelName } = body

      const account = await prisma.slackAccount.findFirst({
        where: { userId: 'default' }
      })

      if (!account) {
        return NextResponse.json({ error: 'Slack not connected' }, { status: 400 })
      }

      await prisma.slackAccount.update({
        where: { id: account.id },
        data: {
          notifications: notifications !== undefined ? notifications : account.notifications,
          channelId: channelId || account.channelId,
          channelName: channelName || account.channelName
        }
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Slack POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove Slack connection
export async function DELETE() {
  try {
    await prisma.slackAccount.deleteMany({
      where: { userId: 'default' }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Slack DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
