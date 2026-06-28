import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const sector = req.nextUrl.searchParams.get('sector')
  const category = req.nextUrl.searchParams.get('category')
  const search = req.nextUrl.searchParams.get('search')
  const sortBy = req.nextUrl.searchParams.get('sortBy') ?? 'score'
  const order = req.nextUrl.searchParams.get('order') === 'asc' ? 'asc' as const : 'desc' as const
  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? 25), 200)
  const offset = Number(req.nextUrl.searchParams.get('offset') ?? 0)

  const scoreMin = req.nextUrl.searchParams.get('scoreMin')
  const roicMin = req.nextUrl.searchParams.get('roicMin')
  const mosMin = req.nextUrl.searchParams.get('mosMin')

  const where: any = {}
  if (sector) where.sector = sector
  if (category) where.category = category
  if (search && search.length >= 2) {
    where.OR = [
      { ticker: { contains: search.toUpperCase(), mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (scoreMin) where.score = { gte: Number(scoreMin) }

  const metricFilters: any = {}
  if (roicMin) metricFilters.roic = { gte: Number(roicMin) }
  if (mosMin) metricFilters.marginOfSafety = { gte: Number(mosMin) }
  if (Object.keys(metricFilters).length > 0) {
    where.metrics = metricFilters
  }

  const orderBy: any =
    sortBy === 'score' ? { score: order } :
    sortBy === 'marketCap' ? { marketCap: order } :
    sortBy === 'currentPrice' ? { currentPrice: order } :
    { score: order }

  try {
    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        include: { metrics: true, valuation: true },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.company.count({ where }),
    ])

    return NextResponse.json({ companies, total, limit, offset })
  } catch (e) {
    console.error('[screener] error:', e)
    return NextResponse.json({ companies: [], total: 0, limit, offset })
  }
}
