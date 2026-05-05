import { NextRequest, NextResponse } from 'next/server'
import { TICKER_UNIVERSE } from '@/config/tickers'
import { getFinancials } from '@/lib/yahoo'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const ticker = req.nextUrl.searchParams.get('ticker')
  const tickers = ticker ? [ticker] : TICKER_UNIVERSE.slice(0, 50)
  let refreshed = 0
  for (const t of tickers) {
    try { await getFinancials(t); refreshed++ } catch { continue }
  }
  return NextResponse.json({ refreshed, total: tickers.length })
}
