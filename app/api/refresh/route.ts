import { NextRequest, NextResponse } from 'next/server'
import { TICKER_UNIVERSE } from '@/config/tickers'
import { getFinancials } from '@/lib/yahoo'
import { estimateIntrinsicValue } from '@/lib/dcf'
import { calculateScore, classifyCompany, computeMarginOfSafety, calculateGuidanceScore } from '@/lib/scoring'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ticker = req.nextUrl.searchParams.get('ticker')
  const tickers = ticker ? [ticker] : TICKER_UNIVERSE

  let success = 0, failed = 0
  const errors: string[] = []
  const { default: pLimit } = await import('p-limit')
  const limit = pLimit(3)

  const batchSize = 10
  for (let i = 0; i < tickers.length; i += batchSize) {
    const batch = tickers.slice(i, i + batchSize)
    await Promise.all(
      batch.map(t =>
        limit(async () => {
          try {
            const data = await getFinancials(t)
            if (!data || !data.price) {
              failed++
              errors.push(t)
              return
            }

            if (data.marketCap && data.marketCap < 55_000_000) {
              console.log(`[refresh] Skip ${t}: marketCap too small`)
              failed++
              return
            }

            const fcfPerShare =
              data.freeCashFlow3Y?.at(-1) != null && data.sharesOutstanding && data.sharesOutstanding > 0
                ? data.freeCashFlow3Y.at(-1)! / data.sharesOutstanding
                : null

            const iv = estimateIntrinsicValue(fcfPerShare, data.pe)
            const mos = computeMarginOfSafety(iv, data.price)
            const score = calculateScore(data, iv)
            const category = classifyCompany(score, mos)
            const guidanceScore = calculateGuidanceScore(data.earningsHistory)

            await prisma.company.upsert({
              where: { ticker: t },
              update: {
                name: data.name,
                sector: data.sector,
                exchange: data.exchange,
                marketCap: data.marketCap,
                score: score.total,
                category,
              },
              create: {
                ticker: t,
                name: data.name,
                sector: data.sector,
                exchange: data.exchange,
                marketCap: data.marketCap,
                score: score.total,
                category,
              },
            })

            const company = await prisma.company.findUnique({ where: { ticker: t } })
            if (!company) return

            await prisma.metric.upsert({
              where: { companyId: company.id },
              update: {
                roic: data.roic,
                revenueCAGR3Y: data.revenue3Y && data.revenue3Y.length >= 2
                  ? ((data.revenue3Y[0] / data.revenue3Y[data.revenue3Y.length - 1]) ** (1 / (data.revenue3Y.length - 1)) - 1) * 100
                  : null,
                netDebtEbitda: data.totalDebt && data.ebitda && data.ebitda > 0
                  ? (data.totalDebt - (data.totalCash ?? 0)) / data.ebitda : null,
                interestCoverage: data.interestCoverage,
                fcfYield: data.fcfYield,
                guidanceScore,
                marginOfSafety: mos,
              },
              create: {
                companyId: company.id,
                roic: data.roic,
                revenueCAGR3Y: null,
                netDebtEbitda: null,
                interestCoverage: data.interestCoverage,
                fcfYield: data.fcfYield,
                guidanceScore,
                marginOfSafety: mos,
              },
            })

            await prisma.valuation.upsert({
              where: { companyId: company.id },
              update: {
                pe: data.pe,
                peg: data.peg,
                evEbit: data.evEbit,
                pFcf: data.pFcf,
                intrinsicValue: iv,
              },
              create: {
                companyId: company.id,
                pe: data.pe,
                peg: data.peg,
                evEbit: data.evEbit,
                pFcf: data.pFcf,
                intrinsicValue: iv,
              },
            })

            success++
          } catch (e) {
            console.error(`[refresh] ${t} error:`, e)
            failed++
            errors.push(t)
          }
        })
      )
    )
    if (i + batchSize < tickers.length) {
      await new Promise(r => setTimeout(r, 500))
    }
  }

  return NextResponse.json({ success, failed, total: tickers.length, errors: errors.slice(0, 20) })
}
