import { NextResponse } from 'next/server'
import { getMemories } from '@/lib/backend/data'

export async function GET() {
  try {
    return NextResponse.json(await getMemories())
  } catch (error) {
    console.error('Error loading memories:', error)
    return NextResponse.json({ error: 'Failed to load memories' }, { status: 500 })
  }
}
