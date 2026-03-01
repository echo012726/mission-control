import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, logActivity } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const cronJob = await prisma.cronJob.findUnique({ where: { id } })

  if (!cronJob) {
    return NextResponse.json({ error: 'Cron job not found' }, { status: 404 })
  }

  return NextResponse.json(cronJob)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()

  const cronJob = await prisma.cronJob.update({
    where: { id },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.schedule && { schedule: body.schedule }),
      ...(body.command && { command: body.command }),
      ...(body.enabled !== undefined && { enabled: body.enabled }),
      ...(body.status && { status: body.status }),
      ...(body.lastError !== undefined && { lastError: body.lastError }),
    },
  })

  return NextResponse.json(cronJob)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const cronJob = await prisma.cronJob.findUnique({ where: { id } })

  if (!cronJob) {
    return NextResponse.json({ error: 'Cron job not found' }, { status: 404 })
  }

  await prisma.cronJob.delete({ where: { id } })
  await logActivity('cron_deleted', { cronJobId: id, name: cronJob.name })

  return NextResponse.json({ success: true })
}
