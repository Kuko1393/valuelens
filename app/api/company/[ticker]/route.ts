import { NextRequest, NextResponse } from 'next/server'
import { getFinancials } from '@/lib/yahoo'
import { calculateScore, classifyCompany, computeMarginOfSafety, calculateGuidanceScore } from '@/lib/scoring'
import { estimateIntrinsicValue, estimateDCFScenarios } from '@/lib/dcf'
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
      ? (data.freeCashFlow3Y.at(-1)! / data.sharesOutstanding) * (ticker.endsWith('.L') ? 0.01 : 1)
      : null

  const iv = estimateIntrinsicValue(fcfPerShare, data.pe)
  const mos = computeMarginOfSafety(iv, data.price)
  const cagr = data.revenue3Y && data.revenue3Y.length >= 2
    ? ((data.revenue3Y[0] / data.revenue3Y[data.revenue3Y.length - 1]) ** (1 / (data.revenue3Y.length - 1)) - 1) * 100
    : null
  const score = calculateScore(data, iv)
  const category = classifyCompany(score, mos, data.roic, cagr)
  const guidanceScore = calculateGuidanceScore(data.earningsHistory)
  const dcfScenarios = estimateDCFScenarios(fcfPerShare, data.price)

  const result = {
    ...data,
    fcfPerShare,
    intrinsicValue: iv,
    marginOfSafety: mos,
    score,
    category,
    guidanceScore,
    dcfScenarios,
  }
  await setCache(`company:${ticker}`, result, TTL.METRICS)
  return NextResponse.json(result)
}
