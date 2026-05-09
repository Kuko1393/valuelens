import { NextRequest, NextResponse } from 'next/server'
import { getFinancials } from '@/lib/yahoo'
import { calculateScore, classifyCompany, computeMarginOfSafety, computeRevCAGR } from '@/lib/scoring'
import { estimateIntrinsicValue } from '@/lib/dcf'
import { getCache, setCache, TTL } from '@/lib/cache'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, { params }: { params: { ticker: string } }) {
  const ticker = params.ticker.toUpperCase()
  const cached = await getCache(`company:${ticker}`)
  // Only use cache if it has a computed score (old entries lack this field)
  if (cached && (cached as any).score) return NextResponse.json(cached)

  const data = await getFinancials(ticker)
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const iv       = estimateIntrinsicValue(
    data.freeCashFlow3Y?.[0] && data.sharesOutstanding
      ? data.freeCashFlow3Y[0] / data.sharesOutstanding : null,
    data.pe
  )
  const mos      = computeMarginOfSafety(iv, data.price)
  const score    = calculateScore(data, iv)
  // Pass ROIC so classification is correct for high-ROIC companies (fix ADBE / WKL cases)
  const category = classifyCompany(score, mos, data.roic)
  const result   = { ...data, intrinsicValue: iv, marginOfSafety: mos, score, category }

  // Cache company detail
  await setCache(`company:${ticker}`, result, TTL.METRICS)

  // Also update screener cache so both show the same score (Bug #4 fix)
  const debtToEbitda = data.totalDebt && data.ebitda && data.ebitda > 0
    ? (data.totalDebt - (data.totalCash ?? 0)) / data.ebitda : null
  const screenerRow = {
    ticker: data.ticker, name: data.name,
    sector: data.sector, exchange: data.exchange,
    price: data.price, marketCap: data.marketCap,
    score: score.total, category,
    pe: data.pe, marginOfSafety: mos, trend3M: null,
    grossMargin: data.grossMargin, fcfYield: data.fcfYield,
    roic: data.roic, revGrowth3Y: computeRevCAGR(data.revenue3Y),
    debtToEbitda,
  }
  await setCache(`screener:${ticker}`, screenerRow, TTL.METRICS)

  return NextResponse.json(result)
}
