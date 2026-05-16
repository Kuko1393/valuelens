import { NextRequest, NextResponse } from 'next/server'
import { getBatchFinancials } from '@/lib/yahoo'
import { calculateScore, classifyCompany, computeMarginOfSafety } from '@/lib/scoring'
import { estimateIntrinsicValue } from '@/lib/dcf'
import { TICKER_UNIVERSE } from '@/config/tickers'
import { getCache, setCache, TTL } from '@/lib/cache'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sector = searchParams.get('sector') || ''
  const category = searchParams.get('category') || ''
  const minScore = parseInt(searchParams.get('minScore') || '0')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const sortBy = searchParams.get('sortBy') || 'score'
  const sortDir = searchParams.get('sortDir') || 'desc'

  const cacheKey = `screener:${sector}:${category}:${minScore}:${page}:${sortBy}:${sortDir}`
  const cached = await getCache(cacheKey)
  if (cached) return NextResponse.json(cached)

  const tickers = TICKER_UNIVERSE.slice(0, 80)
  const allResults = []
  for (let i = 0; i < tickers.length; i += 20) {
    const batch = tickers.slice(i, i + 20)
    const financials = await getBatchFinancials(batch)
    for (const data of financials) {
      const iv = estimateIntrinsicValue(
        data.freeCashFlow3Y?.[0] && data.sharesOutstanding ? data.freeCashFlow3Y[0] / data.sharesOutstanding : null,
        data.pe
      )
      const mos = computeMarginOfSafety(iv, data.price)
      const score = calculateScore(data, iv)
      const cat = classifyCompany(score, mos)
      allResults.push({
        ticker: data.ticker, name: data.name, sector: data.sector,
        price: data.price, intrinsicValue: iv, marginOfSafety: mos,
        score: score.total, category: cat, fcfYield: data.fcfYield,
        pe: data.pe, roic: data.roic, marketCap: data.marketCap,
        priceHistory3M: data.priceHistory3M?.slice(-12) || [],
      })
    }
  }

  let filtered = allResults
  if (sector) filtered = filtered.filter(r => r.sector === sector)
  if (category) {
    const cats = category.split(',').filter(Boolean)
    if (cats.length > 0) filtered = filtered.filter(r => cats.includes(r.category))
  }
  filtered = filtered.filter(r => r.score >= minScore)
  filtered.sort((a, b) => {
    const av = (a as any)[sortBy] ?? -Infinity; const bv = (b as any)[sortBy] ?? -Infinity
    return sortDir === 'desc' ? bv - av : av - bv
  })

  const total = filtered.length
  const result = { data: filtered.slice((page-1)*limit, page*limit), total, page, limit }
  await setCache(cacheKey, result, TTL.METRICS)
  return NextResponse.json(result)
}
