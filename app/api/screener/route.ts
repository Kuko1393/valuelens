import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const sector = req.nextUrl.searchParams.get('sector')
  const category = req.nextUrl.searchParams.get('category')
  const sortBy = req.nextUrl.searchParams.get('sortBy') ?? 'score'
  const order = req.nextUrl.searchParams.get('order') === 'asc' ? 'asc' as const : 'desc' as const
  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? 50), 200)
  const offset = Number(req.nextUrl.searchParams.get('offset') ?? 0)

  const where: any = {}
  if (sector) where.sector = sector
  if (category) where.category = category

  const orderBy: any = sortBy === 'score'
    ? { score: order }
    : sortBy === 'marketCap'
      ? { marketCap: order }
      : { score: order }

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
}
