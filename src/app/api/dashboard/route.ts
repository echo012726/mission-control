import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// Simple key-value store for dashboard config
let dashboardConfig: Record<string, unknown> = {}

export async function GET() {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json(dashboardConfig)
}

export async function POST(req: NextRequest) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { widgets } = body

  if (!widgets || !Array.isArray(widgets)) {
    return NextResponse.json({ error: 'Widgets array required' }, { status: 400 })
  }

  dashboardConfig = {
    widgets,
    updatedAt: new Date().toISOString(),
  }

  return NextResponse.json(dashboardConfig)
}
