import { NextResponse } from 'next/server'
import { getAgents } from '@/lib/backend/data'

export async function GET() {
  try {
    return NextResponse.json(await getAgents())
  } catch (error) {
    console.error('Error loading agent status:', error)
    return NextResponse.json({ error: 'Failed to load agent status' }, { status: 500 })
  }
}
