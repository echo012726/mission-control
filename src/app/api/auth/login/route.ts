import { NextRequest, NextResponse } from 'next/server'
import { login } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    
    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const success = await login(token)
    
    if (!success) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    return NextResponse.json({ success: true })
  } catch (_) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
