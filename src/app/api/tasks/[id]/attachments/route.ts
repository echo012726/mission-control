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
  })

  // Return with additional computed fields for the UI
  const result = attachments.map(a => ({
    id: a.id,
    taskId: a.taskId,
    filename: a.filename,
    contentType: a.contentType,
    mimeType: a.contentType,
    fileSize: a.size,
    size: a.size,
    fileType: a.fileType || 'other',
    description: a.description || '',
    uploadedBy: a.uploadedBy,
    createdAt: a.createdAt,
  }))

  return NextResponse.json(result)
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
  const file = (formData as unknown as { get: (name: string) => File | null }).get('file') as File | null
  const description = (formData as unknown as { get: (name: string) => string | null }).get('description') as string | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Determine file type based on extension
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']
  const docExts = ['pdf', 'doc', 'docx', 'txt', 'md']
  
  let fileType: string = 'other'
  if (imageExts.includes(ext)) fileType = 'image'
  else if (docExts.includes(ext)) fileType = 'document'

  // Read file as base64 (for SQLite simplicity)
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
      fileType,
      description: description || '',
      uploadedBy: 'user',
    },
  })

  return NextResponse.json({
    id: attachment.id,
    taskId: attachment.taskId,
    filename: attachment.filename,
    contentType: attachment.contentType,
    mimeType: attachment.contentType,
    fileSize: attachment.size,
    size: attachment.size,
    fileType: attachment.fileType,
    description: attachment.description,
    uploadedBy: attachment.uploadedBy,
    createdAt: attachment.createdAt,
  })
}
