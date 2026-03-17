import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const webhook = await prisma.webhook.findUnique({
      where: { id },
    })

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    return NextResponse.json(webhook)
  } catch (error) {
    console.error('Failed to fetch webhook', error)
    return NextResponse.json({ error: 'Failed to fetch webhook' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const webhook = await prisma.webhook.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.url && { url: body.url }),
        ...(body.events && { events: JSON.stringify(body.events) }),
        ...(body.enabled !== undefined && { enabled: body.enabled }),
        ...(body.secret !== undefined && { secret: body.secret }),
      },
    })

    return NextResponse.json(webhook)
  } catch (error) {
    console.error('Failed to update webhook', error)
    return NextResponse.json({ error: 'Failed to update webhook' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.webhook.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete webhook', error)
    return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 })
  }
}
