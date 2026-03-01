import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const priority = searchParams.get('priority')
    const status = searchParams.get('status')
    const tags = searchParams.get('tags')

    const where: Record<string, unknown> = {}

    // Text search in title and description
    if (query) {
      where.OR = [
        { title: { contains: query } },
        { description: { contains: query } },
      ]
    }

    // Filter by priority
    if (priority) {
      where.priority = priority
    }

    // Filter by status
    if (status) {
      where.status = status
    }

    // Filter by tags (contains any of the specified tags)
    if (tags) {
      const tagList = tags.split(',')
      where.tags = {
        contains: tagList[0],
      }
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Failed to search tasks', error)
    return NextResponse.json({ error: 'Failed to search tasks' }, { status: 500 })
  }
}
