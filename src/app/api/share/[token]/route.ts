import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/share/[token] - Get shared dashboard (public, no auth)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const dashboard = await prisma.dashboardConfig.findFirst({
      where: { shareToken: token }
    })

    if (!dashboard) {
      return NextResponse.json({ error: 'Share link not found or expired' }, { status: 404 })
    }

    // Check if expired
    if (dashboard.shareExpiresAt && new Date() > dashboard.shareExpiresAt) {
      return NextResponse.json({ error: 'Share link has expired' }, { status: 404 })
    }

    // If password protected, check for password in query
    const url = new URL(req.url)
    const providedPassword = url.searchParams.get('password')
    
    if (dashboard.sharePassword) {
      if (!providedPassword) {
        return NextResponse.json({ 
          error: 'Password required',
          hasPassword: true 
        }, { status: 401 })
      }
      
      const crypto = await import('crypto')
      const hashedPassword = crypto.createHash('sha256').update(providedPassword).digest('hex')
      
      if (hashedPassword !== dashboard.sharePassword) {
        return NextResponse.json({ 
          error: 'Invalid password',
          hasPassword: true 
        }, { status: 401 })
      }
    }

    // Return dashboard data (read-only)
    return NextResponse.json({
      id: dashboard.id,
      name: dashboard.name,
      widgets: JSON.parse(dashboard.widgets),
      settings: JSON.parse(dashboard.settings),
      isShared: true,
      expiresAt: dashboard.shareExpiresAt
    })
  } catch (error) {
    console.error('Shared dashboard GET error:', error)
    return NextResponse.json({ error: 'Failed to load shared dashboard' }, { status: 500 })
  }
}
