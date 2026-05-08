import { NextRequest, NextResponse } from 'next/server'
import { getFinancials } from '@/lib/yahoo'
import { prisma } from '@/lib/db'
import { generateAnalysis } from '@/lib/analysis'
import { calculateScore, classifyCompany, computeMarginOfSafety } from '@/lib/scoring'
import { estimateIntrinsicValue } from '@/lib/dcf'

export const runtime = 'nodejs'
export const maxDuration = 30

function detectCountry(ticker: string): string {
  if (ticker.endsWith('.PA')) return 'France'
  if (ticker.endsWith('.DE')) return 'Allemagne'
  if (ticker.endsWith('.AS')) return 'Pays-Bas'
  if (ticker.endsWith('.L'))  return 'Royaume-Uni'
  if (ticker.endsWith('.TO')) return 'Canada'
  if (ticker.endsWith('.SW')) return 'Suisse'
  if (ticker.endsWith('.MI')) return 'Italie'
  if (ticker.endsWith('.MC')) return 'Espagne'
  if (ticker.endsWith('.ST')) return 'Suède'
  if (ticker.endsWith('.CO')) return 'Danemark'
  if (ticker.endsWith('.HE')) return 'Finlande'
  return 'États-Unis'
}

function computeCagr(arr: number[] | null): number | null {
  if (!arr || arr.length < 2) return null
  const first = arr[0], last = arr[arr.length - 1]
  if (!first || first <= 0) return null
  return ((last / first) ** (1 / (arr.length - 1)) - 1) * 100
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker.toUpperCase()

  try {
    const fin = await getFinancials(ticker)
    if (!fin) return NextResponse.json({ error: 'Could not fetch financial data' }, { status: 404 })

    const iv  = estimateIntrinsicValue(
      fin.freeCashFlow3Y?.[0] && fin.sharesOutstanding
        ? fin.freeCashFlow3Y[0] / fin.sharesOutstanding : null,
      fin.pe
    )
    const mos         = computeMarginOfSafety(iv, fin.price)
    const revGrowth   = computeCagr(fin.revenue3Y)
    const debtToEbitda = fin.totalDebt && fin.ebitda && fin.ebitda > 0
      ? (fin.totalDebt - (fin.totalCash ?? 0)) / fin.ebitda
      : null

    const analysis = generateAnalysis(ticker, fin, mos, revGrowth, debtToEbitda)

    await prisma.investmentIdea.deleteMany({ where: { ticker } })
    const idea = await prisma.investmentIdea.create({
      data: {
        ticker,
        company: fin.name,
        country: detectCountry(ticker),
        sector: fin.sector ?? 'Unknown',
        thesis: analysis.thesis,
        catalysts: analysis.catalysts,
        valuation: analysis.valuation,
        risks: analysis.risks,
        per: fin.pe,
        evEbit: fin.evEbit,
        fcfYield: fin.fcfYield,
        revGrowth3Y: revGrowth,
        debtToEbitda,
        marginOfSafety: mos,
        valuationClass: analysis.valuationClass,
        implicitAssumptions: analysis.implicitAssumptions,
        weakPoints: analysis.weakPoints,
        hiddenRisks: analysis.hiddenRisks,
        marketingArgs: analysis.marketingArgs,
        whyBadIdea: analysis.whyBadIdea,
        discountScore: analysis.scoring.discount,
        catalystScore: analysis.scoring.catalyst,
        businessQualityScore: analysis.scoring.businessQuality,
        thesisSolidityScore: analysis.scoring.thesisSolidity,
        accessibilityScore: analysis.scoring.accessibility,
        sourceQualityScore: analysis.scoring.sourceQuality,
        totalScore: analysis.scoring.total,
        convictionLevel: analysis.conviction.level,
        convictionReason: analysis.conviction.reason,
      }
    })

    return NextResponse.json({ idea })
  } catch (err) {
    console.error('[analyze]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
