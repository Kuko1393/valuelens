import { NextRequest, NextResponse } from 'next/server'
import { getFinancials } from '@/lib/yahoo'
import { calculateScore, classifyCompany, computeMarginOfSafety, calculateGuidanceScore } from '@/lib/scoring'
import { estimateIntrinsicValue } from '@/lib/dcf'
import { getCache, setCache, TTL } from '@/lib/cache'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(_req: NextRequest, { params }: { params: { ticker: string } }) {
  const ticker = params.ticker.toUpperCase()
  const cached = await getCache(`company:${ticker}`)
  if (cached) return NextResponse.json(cached)

  const data = await getFinancials(ticker)
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const fcfPerShare =
    data.freeCashFlow3Y?.at(-1) != null && data.sharesOutstanding && data.sharesOutstanding > 0
      ? data.freeCashFlow3Y.at(-1)! / data.sharesOutstanding
      : null

  const iv = estimateIntrinsicValue(fcfPerShare, data.pe)
  const mos = computeMarginOfSafety(iv, data.price)
  const score = calculateScore(data, iv)
  const category = classifyCompany(score, mos)
  const guidanceScore = calculateGuidanceScore(data.earningsHistory)

  const result = {
    ...data,
    fcfPerShare,
    intrinsicValue: iv,
    marginOfSafety: mos,
    score,
    category,
    guidanceScore,
  }
  await setCache(`company:${ticker}`, result, TTL.METRICS)
  return NextResponse.json(result)
}
