import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  
  // Use Webhook model, not Task
  const webhook = await prisma.webhook.findUnique({ where: { id } })
  if (!webhook || !webhook.url) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
  }

  // Send test message
  const testMessage = {
    content: '🎉 Mission Control Test Message',
    embeds: [{
      title: '✅ Mission Control Webhook Test',
      description: 'Your webhook is working correctly!',
      color: 0x10b981,
      fields: [
        { name: 'Event', value: 'test', inline: true },
        { name: 'Status', value: 'Success', inline: true },
      ],
      timestamp: new Date().toISOString(),
    }]
  }

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testMessage),
    })

    if (response.ok) {
      return NextResponse.json({ success: true, message: 'Test sent' })
    } else {
      return NextResponse.json({ error: 'Failed to send to webhook' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Error sending test' }, { status: 500 })
  }
}
