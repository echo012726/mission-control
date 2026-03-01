import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: taskId } = await params

  const attachments = await prisma.taskAttachment.findMany({
    where: { taskId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      taskId: true,
      filename: true,
      contentType: true,
      size: true,
      uploadedBy: true,
      createdAt: true,
      // Don't return the actual data in the list view
    },
  })

  return NextResponse.json(attachments)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: taskId } = await params

  // Check task exists
  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Read file as base64
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const base64Data = buffer.toString('base64')

  // Limit file size to 5MB
  if (buffer.length > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
  }

  const attachment = await prisma.taskAttachment.create({
    data: {
      taskId,
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      data: base64Data,
      size: buffer.length,
      uploadedBy: 'user',
    },
  })

  return NextResponse.json({
    id: attachment.id,
    filename: attachment.filename,
    contentType: attachment.contentType,
    size: attachment.size,
    uploadedBy: attachment.uploadedBy,
    createdAt: attachment.createdAt,
  })
}
