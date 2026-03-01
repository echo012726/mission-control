import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const webhooks = await prisma.webhook.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(webhooks)
  } catch (error) {
    console.error('Failed to fetch webhooks', error)
    return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, url, events, enabled, secret } = body

    if (!name || !url) {
      return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 })
    }

    const webhook = await prisma.webhook.create({
      data: {
        name,
        url,
        events: JSON.stringify(events || []),
        enabled: enabled ?? true,
        secret: secret || null,
      },
    })

    return NextResponse.json(webhook)
  } catch (error) {
    console.error('Failed to create webhook', error)
    return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 })
  }
}
