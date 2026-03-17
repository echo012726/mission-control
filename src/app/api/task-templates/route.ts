import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const isDev = process.env.NODE_ENV !== 'production'
  
  if (!isDev) {
    const authenticated = await getSession()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')

  const where = category && category !== 'all' ? { category } : {}

  const templates = await prisma.taskTemplate.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(templates)
}

export async function POST(req: NextRequest) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, description, taskData, category } = body

  if (!name || !taskData) {
    return NextResponse.json({ error: 'Name and taskData required' }, { status: 400 })
  }

  const template = await prisma.taskTemplate.create({
    data: {
      name,
      description: description || null,
      category: category || 'general',
      taskData: typeof taskData === 'string' ? taskData : JSON.stringify(taskData),
    },
  })

  return NextResponse.json(template)
}
