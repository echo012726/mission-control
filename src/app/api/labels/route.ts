import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const labels = await prisma.label.findMany({
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(labels)
}

export async function POST(req: NextRequest) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, color } = body

  if (!name) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 })
  }

  const label = await prisma.label.create({
    data: {
      name,
      color: color || '#6366f1',
    },
  })

  return NextResponse.json(label)
}
