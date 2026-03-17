import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

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
  const { name, color } = body

  const updateData: { name?: string; color?: string } = {}
  if (name) updateData.name = name
  if (color) updateData.color = color

  const label = await prisma.label.update({
    where: { id },
    data: updateData,
  })

  return NextResponse.json(label)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  
  await prisma.label.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
