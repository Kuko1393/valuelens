import { NextRequest, NextResponse } from 'next/server'
import { getFinancials } from '@/lib/yahoo'
import { calculateScore, classifyCompany, computeMarginOfSafety } from '@/lib/scoring'
import { estimateIntrinsicValue } from '@/lib/dcf'
import { getCache, setCache, TTL } from '@/lib/cache'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, { params }: { params: { ticker: string } }) {
  const ticker = params.ticker.toUpperCase()
  const cached = await getCache(`company:${ticker}`)
  if (cached) return NextResponse.json(cached)

  const data = await getFinancials(ticker)
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const iv = estimateIntrinsicValue(
    data.freeCashFlow3Y?.[0] && data.sharesOutstanding ? data.freeCashFlow3Y[0] / data.sharesOutstanding : null,
    data.pe
  )
  const mos = computeMarginOfSafety(iv, data.price)
  const score = calculateScore(data, iv)
  const category = classifyCompany(score, mos)
  const result = { ...data, intrinsicValue: iv, marginOfSafety: mos, score, category }
  await setCache(`company:${ticker}`, result, TTL.METRICS)
  return NextResponse.json(result)
}
