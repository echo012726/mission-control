import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// PATCH /api/filters/[id] - Update a saved filter
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()

  const updateData: { name?: string; filters?: string; order?: number } = {}

  if (body.name !== undefined) {
    updateData.name = body.name
  }
  if (body.filters !== undefined) {
    updateData.filters = JSON.stringify(body.filters)
  }
  if (body.order !== undefined) {
    updateData.order = body.order
  }

  const filter = await prisma.savedFilter.update({
    where: { id },
    data: updateData,
  })

  return NextResponse.json({
    ...filter,
    filters: JSON.parse(filter.filters),
  })
}

// DELETE /api/filters/[id] - Delete a saved filter
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  await prisma.savedFilter.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}
