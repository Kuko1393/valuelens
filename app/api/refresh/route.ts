import { NextRequest, NextResponse } from 'next/server'
import { TICKER_UNIVERSE } from '@/config/tickers'
import { getFinancials } from '@/lib/yahoo'
import { setCache, TTL } from '@/lib/cache'
import { calculateScore, classifyCompany, computeMarginOfSafety } from '@/lib/scoring'
import { estimateIntrinsicValue } from '@/lib/dcf'
import type { ScreenerRow } from '@/app/api/screener/route'

export const runtime = 'nodejs'
export const maxDuration = 60

function computeCagr(arr: number[] | null): number | null {
  if (!arr || arr.length < 2) return null
  const first = arr[0], last = arr[arr.length - 1]
  if (!first || first <= 0) return null
  return ((last / first) ** (1 / (arr.length - 1)) - 1) * 100
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ticker = req.nextUrl.searchParams.get('ticker')
  // Each cron invocation refreshes a slice; pass offset= to stagger across the full universe
  const offset = Number(req.nextUrl.searchParams.get('offset') ?? 0)
  const batchSize = 50
  const tickers = ticker
    ? [ticker]
    : TICKER_UNIVERSE.slice(offset, offset + batchSize)

  let refreshed = 0
  const failed: string[] = []

  for (const t of tickers) {
    try {
      const data = await getFinancials(t)
      if (!data) { failed.push(t); continue }

      // Update company cache
      await setCache(`company:${t}`, data, TTL.METRICS)

      // Rebuild and update screener cache
      const iv = estimateIntrinsicValue(
        data.freeCashFlow3Y?.[0] && data.sharesOutstanding
          ? data.freeCashFlow3Y[0] / data.sharesOutstanding : null,
        data.pe
      )
      const mos   = computeMarginOfSafety(iv, data.price)
      const score = calculateScore(data, iv)
      const cat   = classifyCompany(score, mos)

      const row: ScreenerRow = {
        ticker: data.ticker, name: data.name,
        sector: data.sector, exchange: data.exchange,
        price: data.price, marketCap: data.marketCap,
        score: score.total, category: cat,
        pe: data.pe, marginOfSafety: mos, trend3M: null,
        grossMargin: data.grossMargin, fcfYield: data.fcfYield,
        roic: data.roic, revGrowth3Y: computeCagr(data.revenue3Y),
        debtToEbitda: data.totalDebt && data.ebitda && data.ebitda > 0
          ? (data.totalDebt - (data.totalCash ?? 0)) / data.ebitda
          : null,
      }
      await setCache(`screener:${t}`, row, TTL.METRICS)

      refreshed++
    } catch {
      failed.push(t)
    }
  }

  return NextResponse.json({
    refreshed,
    total: tickers.length,
    failed,
    offset,
    universe: TICKER_UNIVERSE.length,
  })
}
