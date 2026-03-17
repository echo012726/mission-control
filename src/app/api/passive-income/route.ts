import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// Simple in-memory cache (in production, use Redis)
let cache: { data: unknown; timestamp: number } | null = null
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

interface GumroadSale {
  id: string
  created_at: string
  amount: number
  currency: string
  product_name: string
  buyer_email?: string
}

interface GumroadResponse {
  sales: GumroadSale[]
  total: number
}

async function fetchGumroadSales(): Promise<{
  totalRevenue: number
  monthlyRevenue: number
  lastMonthRevenue: number
  salesCount: number
  recentSales: GumroadSale[]
}> {
  const token = process.env.GUMROAD_ACCESS_TOKEN
  
  if (!token) {
    return {
      totalRevenue: 0,
      monthlyRevenue: 0,
      lastMonthRevenue: 0,
      salesCount: 0,
      recentSales: []
    }
  }

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  try {
    // Fetch all sales (Gumroad limits to 10 per page, so we fetch a reasonable amount)
    const allSales: GumroadSale[] = []
    let page = 1
    let hasMore = true

    while (hasMore && page <= 10) {
      const response = await fetch(
        `https://api.gumroad.com/v2/sales?access_token=${token}&page=${page}`,
        { next: { revalidate: 3600 } }
      )
      
      if (!response.ok) {
        console.error('Gumroad API error:', response.statusText)
        break
      }

      const data: GumroadResponse = await response.json()
      
      if (data.sales && data.sales.length > 0) {
        allSales.push(...data.sales)
        page++
      } else {
        hasMore = false
      }
    }

    // Calculate totals
    let totalRevenue = 0
    let monthlyRevenue = 0
    let lastMonthRevenue = 0

    for (const sale of allSales) {
      const saleDate = new Date(sale.created_at)
      const amount = sale.amount / 100 // Gumroad amounts are in cents
      
      totalRevenue += amount

      if (saleDate >= thisMonthStart) {
        monthlyRevenue += amount
      } else if (saleDate >= lastMonthStart && saleDate <= lastMonthEnd) {
        lastMonthRevenue += amount
      }
    }

    // Get 5 most recent sales
    const recentSales = allSales
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
      lastMonthRevenue: Math.round(lastMonthRevenue * 100) / 100,
      salesCount: allSales.length,
      recentSales
    }
  } catch (error) {
    console.error('Error fetching Gumroad sales:', error)
    return {
      totalRevenue: 0,
      monthlyRevenue: 0,
      lastMonthRevenue: 0,
      salesCount: 0,
      recentSales: []
    }
  }
}

export async function GET(req: NextRequest) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check cache first
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data)
  }

  // Get KDP data from database
  let kdpData = {
    monthlyRoyalties: 0,
    lastUpdated: null as string | null
  }

  try {
    const kdpEntry = await prisma.task.findFirst({
      where: {
        title: 'KDP Monthly Royalties'
      },
      orderBy: { updatedAt: 'desc' }
    })

    if (kdpEntry) {
      kdpData = {
        monthlyRoyalties: parseFloat(kdpEntry.description || '0') || 0,
        lastUpdated: kdpEntry.updatedAt.toISOString()
      }
    }
  } catch (error) {
    console.error('Error fetching KDP data:', error)
  }

  // Fetch Gumroad data
  const gumroadData = await fetchGumroadSales()

  const result = {
    gumroad: gumroadData,
    kdp: kdpData,
    updatedAt: new Date().toISOString()
  }

  // Update cache
  cache = {
    data: result,
    timestamp: Date.now()
  }

  return NextResponse.json(result)
}

// Manual endpoint to update KDP royalties
export async function POST(req: NextRequest) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { monthlyRoyalties } = body

  if (typeof monthlyRoyalties !== 'number') {
    return NextResponse.json({ error: 'monthlyRoyalties must be a number' }, { status: 400 })
  }

  try {
    // Upsert KDP entry
    await prisma.task.upsert({
      where: {
        id: 'kdp-royalties-manual'
      },
      update: {
        description: monthlyRoyalties.toString(),
        updatedAt: new Date()
      },
      create: {
        id: 'kdp-royalties-manual',
        title: 'KDP Monthly Royalties',
        description: monthlyRoyalties.toString(),
        status: 'done',
        priority: 'low',
        tags: '["passive-income","kdp"]',
        labels: '[]'
      }
    })

    // Clear cache
    cache = null

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating KDP data:', error)
    return NextResponse.json({ error: 'Failed to update KDP data' }, { status: 500 })
  }
}
