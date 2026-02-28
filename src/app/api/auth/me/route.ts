import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET() {
  const authenticated = await getSession()
  
  if (!authenticated) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({ authenticated: true, user: { name: 'Admin' } })
}
