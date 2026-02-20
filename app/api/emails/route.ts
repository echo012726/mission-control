import { NextResponse } from 'next/server'
import { getEmails } from '@/lib/backend/data'

export async function GET() {
  try {
    return NextResponse.json(await getEmails())
  } catch (error) {
    console.error('Error loading emails:', error)
    return NextResponse.json({ error: 'Failed to load emails' }, { status: 500 })
  }
}
