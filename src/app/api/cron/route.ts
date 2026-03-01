import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, logActivity } from '@/lib/auth'

export async function GET() {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cronJobs = await prisma.cronJob.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(cronJobs)
}

export async function POST(req: NextRequest) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, schedule, command, enabled } = body

  if (!name || !schedule || !command) {
    return NextResponse.json({ error: 'Name, schedule, and command are required' }, { status: 400 })
  }

  // Validate cron expression format (basic check)
  const cronParts = schedule.trim().split(/\s+/)
  if (cronParts.length < 5 || cronParts.length > 6) {
    return NextResponse.json({ error: 'Invalid cron expression' }, { status: 400 })
  }

  const cronJob = await prisma.cronJob.create({
    data: {
      name,
      schedule,
      command,
      enabled: enabled ?? true,
    },
  })

  await logActivity('cron_created', { cronJobId: cronJob.id, name: cronJob.name })

  return NextResponse.json(cronJob)
}
