import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: taskId, attachmentId } = await params
  const url = new URL(req.url)
  const metadataOnly = url.searchParams.get('metadata') === 'true'

  const attachment = await prisma.taskAttachment.findFirst({
    where: { id: attachmentId, taskId },
  })

  if (!attachment) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
  }

  // If metadata param is set, return metadata instead of file
  if (metadataOnly) {
    return NextResponse.json({
      id: attachment.id,
      taskId: attachment.taskId,
      filename: attachment.filename,
      contentType: attachment.contentType,
      mimeType: attachment.contentType,
      fileSize: attachment.size,
      size: attachment.size,
      fileType: attachment.fileType || 'other',
      description: attachment.description || '',
      uploadedBy: attachment.uploadedBy,
      createdAt: attachment.createdAt,
    })
  }

  // Decode base64 to binary and serve file
  const buffer = Buffer.from(attachment.data, 'base64')

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': attachment.contentType,
      'Content-Disposition': `attachment; filename="${attachment.filename}"`,
      'Content-Length': attachment.size.toString(),
    },
  })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: taskId, attachmentId } = await params

  const attachment = await prisma.taskAttachment.findFirst({
    where: { id: attachmentId, taskId },
  })

  if (!attachment) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
  }

  await prisma.taskAttachment.delete({
    where: { id: attachmentId },
  })

  return NextResponse.json({ success: true })
}
