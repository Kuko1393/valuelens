import { NextRequest, NextResponse } from 'next/server'
import { getCache, setCache, TTL } from '@/lib/cache'
import { getFinancials } from '@/lib/yahoo'
import { calculateScore, classifyCompany, computeMarginOfSafety } from '@/lib/scoring'
import { estimateIntrinsicValue } from '@/lib/dcf'
import { TICKER_UNIVERSE } from '@/config/tickers'

export const runtime = 'nodejs'
export const maxDuration = 60

export interface ScreenerRow {
  ticker: string; name: string; sector: string | null; exchange: string | null
  price: number; marketCap: number | null; score: number; category: string
  pe: number | null; marginOfSafety: number | null; trend3M: string | null
  grossMargin: number | null; fcfYield: number | null
  roic: number | null; revGrowth3Y: number | null; debtToEbitda: number | null
}

function computeCagr(arr: number[] | null): number | null {
  if (!arr || arr.length < 2) return null
  const first = arr[0], last = arr[arr.length - 1]
  if (!first || first <= 0) return null
  return ((last / first) ** (1 / (arr.length - 1)) - 1) * 100
}

async function buildRow(ticker: string): Promise<ScreenerRow | null> {
  const data = await getFinancials(ticker)
  if (!data) return null

  const iv = estimateIntrinsicValue(
    data.freeCashFlow3Y?.[0] && data.sharesOutstanding
      ? data.freeCashFlow3Y[0] / data.sharesOutstanding : null,
    data.pe
  )
  const mos   = computeMarginOfSafety(iv, data.price)
  const score = calculateScore(data, iv)
  const cat   = classifyCompany(score, mos, data.roic) // roic fixes ADBE/WKL classification

  const debtToEbitda =
    data.totalDebt && data.ebitda && data.ebitda > 0
      ? (data.totalDebt - (data.totalCash ?? 0)) / data.ebitda
      : null

  return {
    ticker: data.ticker, name: data.name,
    sector: data.sector, exchange: data.exchange,
    price: data.price, marketCap: data.marketCap,
    score: score.total, category: cat,
    pe: data.pe, marginOfSafety: mos, trend3M: null,
    grossMargin: data.grossMargin, fcfYield: data.fcfYield,
    roic: data.roic, revGrowth3Y: computeCagr(data.revenue3Y),
    debtToEbitda,
  }
}

async function getRow(ticker: string): Promise<ScreenerRow | null> {
  const key    = `screener:${ticker}`
  const cached = await getCache<ScreenerRow>(key)
  if (cached) return cached
  const row = await buildRow(ticker)
  if (row) await setCache(key, row, TTL.METRICS)
  return row
}

function serverSort(rows: ScreenerRow[], sortBy: keyof ScreenerRow, sortDir: 'asc' | 'desc'): ScreenerRow[] {
  return [...rows].sort((a, b) => {
    const av = a[sortBy] as any
    const bv = b[sortBy] as any
    if (av == null && bv == null) return 0
    if (av == null) return 1   // nulls always last
    if (bv == null) return -1
    if (typeof av === 'string') {
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    }
    return sortDir === 'asc' ? av - bv : bv - av
  })
}

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams

  // Filters
  const sector   = sp.get('sector')
  const minScore = Number(sp.get('minScore') ?? 0)
  const maxPE    = sp.get('maxPE')               ? Number(sp.get('maxPE'))               : null
  const minMoS   = sp.get('minMarginOfSafety')   ? Number(sp.get('minMarginOfSafety'))   : null
  const category = sp.get('category')
  const q        = sp.get('q')?.toUpperCase()

  // Sort (server-side — applied before pagination so all pages are consistent)
  const validKeys = new Set<string>([
    'ticker','name','sector','price','marketCap','score','category',
    'pe','marginOfSafety','grossMargin','fcfYield','roic','revGrowth3Y','debtToEbitda',
  ])
  const rawSortBy = sp.get('sortBy') ?? 'score'
  const sortBy  = validKeys.has(rawSortBy) ? rawSortBy as keyof ScreenerRow : 'score'
  const sortDir = (sp.get('sortDir') === 'asc') ? 'asc' : 'desc'

  // Pagination
  const page  = Math.max(1, Number(sp.get('page') ?? 1))
  const limit = Math.min(100, Math.max(1, Number(sp.get('limit') ?? 25)))

  const { default: pLimit } = await import('p-limit')

  // ── 1. Read ALL cached rows in parallel (fast KV reads) ───────────────────
  const readLim = pLimit(20)
  const cacheResults = await Promise.all(
    TICKER_UNIVERSE.map(t => readLim(() => getCache<ScreenerRow>(`screener:${t}`)))
  )

  const cachedRows: ScreenerRow[] = []
  const uncached: string[] = []
  TICKER_UNIVERSE.forEach((t, i) => {
    if (cacheResults[i]) cachedRows.push(cacheResults[i]!)
    else uncached.push(t)
  })

  // ── 2. Live-fetch a small batch of uncached tickers ────────────────────────
  const LIVE_BATCH = q ? 5 : 8
  const toLive = q
    ? uncached.filter(t => t.toUpperCase().startsWith(q)).slice(0, LIVE_BATCH)
    : uncached.slice(0, LIVE_BATCH)

  const fetchLim = pLimit(3)
  const fresh = (
    await Promise.all(toLive.map(t => fetchLim(() => getRow(t))))
  ).filter(Boolean) as ScreenerRow[]

  // ── 3. Filter across ALL available data ───────────────────────────────────
  let all = [...cachedRows, ...fresh]

  if (q)             all = all.filter(r => r.ticker.includes(q) || r.name.toUpperCase().includes(q))
  if (sector)        all = all.filter(r => r.sector === sector)
  if (minScore)      all = all.filter(r => r.score >= minScore)
  if (maxPE !== null)  all = all.filter(r => r.pe !== null && r.pe <= maxPE)
  if (minMoS !== null) all = all.filter(r => r.marginOfSafety !== null && r.marginOfSafety >= minMoS)
  if (category)      all = all.filter(r => r.category === category)

  // ── 4. Sort THEN paginate (correct order) ─────────────────────────────────
  const sorted = serverSort(all, sortBy, sortDir)
  const total  = sorted.length
  const companies = sorted.slice((page - 1) * limit, page * limit)

  return NextResponse.json({
    companies,
    total,
    page,
    limit,
    sortBy,
    sortDir,
    cached: cachedRows.length,
    universe: TICKER_UNIVERSE.length,
  })
}
