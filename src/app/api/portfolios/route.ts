import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const portfolios = await prisma.portfolio.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(portfolios)
  } catch (error) {
    console.error('Failed to fetch portfolios:', error)
    return NextResponse.json({ error: 'Failed to fetch portfolios' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, color, budget } = body

    if (!name || !color) {
      return NextResponse.json({ error: 'Name and color are required' }, { status: 400 })
    }

    const portfolio = await prisma.portfolio.create({
      data: {
        name,
        color,
        budget: budget || null,
      }
    })

    return NextResponse.json(portfolio)
  } catch (error) {
    console.error('Failed to create portfolio:', error)
    return NextResponse.json({ error: 'Failed to create portfolio' }, { status: 500 })
  }
}
