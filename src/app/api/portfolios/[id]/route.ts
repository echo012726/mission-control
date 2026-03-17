import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const portfolio = await prisma.portfolio.findUnique({
      where: { id }
    })

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })
    }

    return NextResponse.json(portfolio)
  } catch (error) {
    console.error('Failed to fetch portfolio:', error)
    return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, color, budget } = body

    const portfolio = await prisma.portfolio.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(color && { color }),
        budget: budget !== undefined ? budget : null,
      }
    })

    return NextResponse.json(portfolio)
  } catch (error) {
    console.error('Failed to update portfolio:', error)
    return NextResponse.json({ error: 'Failed to update portfolio' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // First, unassign all tasks from this portfolio
    await prisma.task.updateMany({
      where: { portfolioId: id },
      data: { portfolioId: null }
    })

    // Then delete the portfolio
    await prisma.portfolio.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete portfolio:', error)
    return NextResponse.json({ error: 'Failed to delete portfolio' }, { status: 500 })
  }
}
