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

  const attachment = await prisma.taskAttachment.findFirst({
    where: { id: attachmentId, taskId },
  })

  if (!attachment) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
  }

  // Decode base64 to binary
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
