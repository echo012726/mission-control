import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json({ error: 'taskId required' }, { status: 400 })
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { customFields: true }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const customFields = task.customFields ? JSON.parse(task.customFields as string) : []
    return NextResponse.json({ customFields })
  } catch (error) {
    console.error('Error fetching custom fields:', error)
    return NextResponse.json({ error: 'Failed to fetch custom fields' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { taskId, customFields } = body

    if (!taskId || !customFields) {
      return NextResponse.json({ error: 'taskId and customFields required' }, { status: 400 })
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: { 
        customFields: JSON.stringify(customFields),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, customFields })
  } catch (error) {
    console.error('Error saving custom fields:', error)
    return NextResponse.json({ error: 'Failed to save custom fields' }, { status: 500 })
  }
}
