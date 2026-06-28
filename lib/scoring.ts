import type { FinancialData } from './yahoo'
import { SCORING_CONFIG } from '@/config/scoring.config'

export interface Score {
  total: number
  businessQuality: number
  financialStrength: number
  valuation: number
  longTermVisibility: number
}

export type Category =
  | 'Deep Value'
  | 'Quality Value'
  | 'Reasonably Valued Compounder'
  | 'Potential Value Trap'
  | null

export interface ScoringInput {
  data: FinancialData
  iv: number | null
  guidanceScore: number | null
  grossMargins3Y?: number[] | null
  sharesOutstanding3Y?: number[] | null
}

export function calculateScore(input: ScoringInput): Score {
  const { data, iv, guidanceScore, grossMargins3Y, sharesOutstanding3Y } = input
  const cfg = SCORING_CONFIG

  // ── Business Quality /30 ──
  let bq = 0

  if (data.roic != null && data.roic > cfg.businessQuality.roicThreshold) bq += 10
  else if (data.roic != null && data.roic > cfg.businessQuality.roicThreshold * 0.67) bq += 5

  const cagr = computeCAGR(data.revenue3Y)
  if (cagr != null && cagr > cfg.businessQuality.revenueCAGRThreshold) bq += 10
  else if (cagr != null && cagr > cfg.businessQuality.revenueCAGRThreshold * 0.4) bq += 5

  if (grossMargins3Y && grossMargins3Y.length >= 2) {
    const variance = Math.max(...grossMargins3Y) - Math.min(...grossMargins3Y)
    if (variance < cfg.businessQuality.grossMarginVarianceMax) bq += 5
    else if (variance < cfg.businessQuality.grossMarginVarianceMax * 2) bq += 3
  } else if (data.grossMargin != null && data.grossMargin > 40) {
    bq += 5
  } else if (data.grossMargin != null && data.grossMargin > 25) {
    bq += 3
  }

  if (guidanceScore != null && guidanceScore >= cfg.businessQuality.guidanceScoreMin) bq += 5
  else if (guidanceScore != null && guidanceScore >= 3) bq += 3

  bq = Math.max(0, Math.min(cfg.businessQuality.maxPoints, bq))

  // ── Financial Strength /25 ──
  let fs = 0

  const nd = computeND(data)
  if (nd != null && nd < 0) fs += 10
  else if (nd != null && nd < cfg.financialStrength.netDebtEbitdaMax * 0.5) fs += 10
  else if (nd != null && nd < cfg.financialStrength.netDebtEbitdaMax) fs += 6
  else if (nd != null && nd < cfg.financialStrength.netDebtEbitdaMax * 1.5) fs += 3

  if (data.interestCoverage != null) {
    if (data.interestCoverage >= 999) fs += 10
    else if (data.interestCoverage > cfg.financialStrength.interestCoverageMin * 2) fs += 10
    else if (data.interestCoverage > cfg.financialStrength.interestCoverageMin) fs += 6
    else if (data.interestCoverage > 2) fs += 3
  }

  if (sharesOutstanding3Y && sharesOutstanding3Y.length >= 2) {
    const oldest = sharesOutstanding3Y[sharesOutstanding3Y.length - 1]
    const latest = sharesOutstanding3Y[0]
    if (oldest > 0) {
      const annualDilution = ((latest / oldest) ** (1 / (sharesOutstanding3Y.length - 1)) - 1) * 100
      if (annualDilution <= 0) fs += 5
      else if (annualDilution < cfg.financialStrength.dilutionAnnualMax) fs += 3
    }
  } else if (data.currentRatio != null && data.currentRatio > 1.5) {
    fs += 5
  } else if (data.currentRatio != null && data.currentRatio > 1) {
    fs += 3
  }

  fs = Math.max(0, Math.min(cfg.financialStrength.maxPoints, fs))

  // ── Valuation /30 ──
  let val = 0

  const mos = iv != null && data.price != null && data.price > 0
    ? ((iv - data.price) / iv) * 100 : null

  if (mos != null && mos > cfg.valuation.mosSuperior) val += 10
  else if (mos != null && mos > cfg.valuation.mosGood) val += 5

  if (data.fcfYield != null && data.fcfYield > 8) val += 10
  else if (data.fcfYield != null && data.fcfYield > 5) val += 6
  else if (data.fcfYield != null && data.fcfYield > 3) val += 3

  const sectorMedian = data.sector
    ? cfg.valuation.evEbitSectorMedians[data.sector] ?? 16
    : 16
  if (data.evEbit != null && data.evEbit > 0 && data.evEbit < sectorMedian) val += 10
  else if (data.evEbit != null && data.evEbit > 0 && data.evEbit < sectorMedian * 1.3) val += 5

  val = Math.max(0, Math.min(cfg.valuation.maxPoints, val))

  // ── Long Term Visibility /15 ──
  let ltv = 0

  const isNonCyclical = data.sector != null &&
    cfg.longTermVisibility.nonCyclicalSectors.includes(data.sector)
  if (isNonCyclical) ltv += 5
  else if (data.roic != null && data.roic > 15 && cagr != null && cagr > 3) ltv += 3

  if (data.roic != null && data.roic > cfg.longTermVisibility.moatRoicThreshold) ltv += 5
  else if (data.roic != null && data.roic > 15) ltv += 3

  if (data.revenue3Y && data.revenue3Y.length >= 2 && data.revenue3Y.every(r => r > 0)) ltv += 5
  else if (cagr != null && cagr > 0) ltv += 2

  ltv = Math.max(0, Math.min(cfg.longTermVisibility.maxPoints, ltv))

  const total = Math.max(0, Math.min(100, bq + fs + val + ltv))

  return { total, businessQuality: bq, financialStrength: fs, valuation: val, longTermVisibility: ltv }
}

export function classifyCompany(
  score: Score,
  mos: number | null,
  roic: number | null | undefined,
  cagr3y: number | null | undefined
): Category {
  const r = roic ?? 0
  const m = mos ?? -999
  const g = cagr3y ?? 0

  if (r > 15 && m > 20 && score.total > 60) return 'Quality Value'
  if (r > 15 && m > -10 && m <= 20 && g > 5) return 'Reasonably Valued Compounder'
  if (r > 20 && m > -15) return 'Reasonably Valued Compounder'
  if (m > 30 && score.total < 60 && r < 12) return 'Deep Value'
  if (r < 18 && m > 20 && r < 8 && g < 0) return 'Potential Value Trap'
  if (r > 18) return 'Reasonably Valued Compounder'
  if (m > 15) return 'Deep Value'
  if (score.businessQuality >= 20) return 'Reasonably Valued Compounder'

  return null
}

export function computeMarginOfSafety(iv: number | null, price: number | null): number | null {
  if (!iv || iv <= 0 || !price || price <= 0) return null
  const mos = ((iv - price) / iv) * 100
  if (mos < -200 || mos > 95) return null
  return mos
}

export function calculateGuidanceScore(
  history: Array<{
    period: string
    epsEstimate: number | null
    epsActual: number | null
    surprisePercent: number | null
  }> | null
): number | null {
  if (!history || history.length === 0) return null
  const valid = history.filter(e => e.epsActual != null && e.epsEstimate != null)
  if (valid.length < 4) return null

  const beats = valid.filter(e => e.epsActual! > e.epsEstimate!).length
  const beatRate = beats / valid.length

  const mags = valid.filter(e => e.surprisePercent != null).map(e => e.surprisePercent!)
  const avgMag = mags.length > 0 ? mags.reduce((a, b) => a + b, 0) / mags.length : 0
  const magNorm = avgMag > 5 ? 1.0 : avgMag > 2 ? 0.7 : avgMag > 0 ? 0.4 : 0

  const raw = beatRate * 0.7 + magNorm * 0.3
  if (raw >= 0.83) return 5
  if (raw >= 0.67) return 4
  if (raw >= 0.50) return 3
  if (raw >= 0.33) return 2
  return 1
}

function computeCAGR(revenues: number[] | null): number | null {
  if (!revenues || revenues.length < 2) return null
  const latest = revenues[0]
  const oldest = revenues[revenues.length - 1]
  if (oldest <= 0) return null
  return ((latest / oldest) ** (1 / (revenues.length - 1)) - 1) * 100
}

function computeND(data: FinancialData): number | null {
  if (data.ebitda == null || data.ebitda <= 0) return null
  if (data.totalDebt == null && data.totalCash == null) return null
  return ((data.totalDebt ?? 0) - (data.totalCash ?? 0)) / data.ebitda
}
