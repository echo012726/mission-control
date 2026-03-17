import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (status) {
      where.status = status
    }

    const approvals = await prisma.approval.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(approvals)
  } catch (error) {
    console.error('Failed to fetch approvals', error)
    return NextResponse.json({ error: 'Failed to fetch approvals' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { taskId, type, requestedBy, reason } = body

    if (!taskId || !type) {
      return NextResponse.json({ error: 'Task ID and type are required' }, { status: 400 })
    }

    const approval = await prisma.approval.create({
      data: {
        taskId,
        type,
        status: 'pending',
        requestedBy: requestedBy || null,
        reason: reason || null,
      },
    })

    return NextResponse.json(approval)
  } catch (error) {
    console.error('Failed to create approval', error)
    return NextResponse.json({ error: 'Failed to create approval' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, status, reviewedBy, reason } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 })
    }

    const approval = await prisma.approval.update({
      where: { id },
      data: {
        status,
        reviewedBy: reviewedBy || null,
        reason: reason || null,
      },
    })

    return NextResponse.json(approval)
  } catch (error) {
    console.error('Failed to update approval', error)
    return NextResponse.json({ error: 'Failed to update approval' }, { status: 500 })
  }
}
