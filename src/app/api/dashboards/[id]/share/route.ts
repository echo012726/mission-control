import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

const DEFAULT_USER = 'default'

// POST /api/dashboards/[id]/share - Generate share link
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { expiresInDays, password } = body // expiresInDays: number, password: optional string

    const dashboard = await prisma.dashboardConfig.findFirst({
      where: { id, userId: DEFAULT_USER }
    })

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
    }

    // Generate unique share token
    const shareToken = randomBytes(16).toString('hex')

    // Calculate expiration if provided
    let shareExpiresAt = null
    if (expiresInDays && expiresInDays > 0) {
      shareExpiresAt = new Date()
      shareExpiresAt.setDate(shareExpiresAt.getDate() + expiresInDays)
    }

    // Hash password if provided
    let sharePassword = null
    if (password) {
      // Simple hash for now - in production use bcrypt
      const crypto = await import('crypto')
      sharePassword = crypto.createHash('sha256').update(password).digest('hex')
    }

    const updated = await prisma.dashboardConfig.update({
      where: { id },
      data: {
        shareToken,
        shareExpiresAt,
        sharePassword
      }
    })

    // Return the share URL (would need base URL in production)
    return NextResponse.json({
      shareToken: updated.shareToken,
      shareUrl: `/share/${updated.shareToken}`,
      expiresAt: updated.shareExpiresAt,
      hasPassword: !!updated.sharePassword
    })
  } catch (error) {
    console.error('Dashboard share error:', error)
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
  }
}

// DELETE /api/dashboards/[id]/share - Revoke share link
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const dashboard = await prisma.dashboardConfig.findFirst({
      where: { id, userId: DEFAULT_USER }
    })

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
    }

    await prisma.dashboardConfig.update({
      where: { id },
      data: {
        shareToken: null,
        shareExpiresAt: null,
        sharePassword: null
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Dashboard unshare error:', error)
    return NextResponse.json({ error: 'Failed to revoke share link' }, { status: 500 })
  }
}
