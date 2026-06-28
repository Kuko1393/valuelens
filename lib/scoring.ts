import type { FinancialData } from './yahoo'

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

export function calculateScore(data: FinancialData, iv: number | null): Score {
  let bq = 0, fs = 0, val = 0, ltv = 0

  // Business Quality /30
  if (data.roic != null && data.roic > 15) bq += 10
  else if (data.roic != null && data.roic > 10) bq += 5

  const cagr = computeCAGR(data.revenue3Y)
  if (cagr != null && cagr > 5) bq += 10
  else if (cagr != null && cagr > 2) bq += 5

  if (data.grossMargin != null && data.grossMargin > 40) bq += 5
  else if (data.grossMargin != null && data.grossMargin > 25) bq += 3

  if (data.operatingMargin != null && data.operatingMargin > 20) bq += 5
  else if (data.operatingMargin != null && data.operatingMargin > 10) bq += 3

  bq = Math.max(0, Math.min(30, bq))

  // Financial Strength /25
  const nd = computeND(data)
  if (nd != null && nd < 0) fs += 10 // net cash
  else if (nd != null && nd < 1) fs += 10
  else if (nd != null && nd < 2) fs += 6
  else if (nd != null && nd < 3) fs += 3

  if (data.interestCoverage != null) {
    if (data.interestCoverage >= 999) fs += 10 // no debt
    else if (data.interestCoverage > 10) fs += 10
    else if (data.interestCoverage > 5) fs += 6
    else if (data.interestCoverage > 2) fs += 3
  }

  if (data.currentRatio != null && data.currentRatio > 1.5) fs += 5
  else if (data.currentRatio != null && data.currentRatio > 1) fs += 3

  fs = Math.max(0, Math.min(25, fs))

  // Valuation /30
  const mos = iv != null && data.price != null && data.price > 0
    ? ((iv - data.price) / iv) * 100 : null
  if (mos != null && mos > 30) val += 10
  else if (mos != null && mos > 20) val += 6
  else if (mos != null && mos > 10) val += 3

  if (data.fcfYield != null && data.fcfYield > 8) val += 10
  else if (data.fcfYield != null && data.fcfYield > 5) val += 6
  else if (data.fcfYield != null && data.fcfYield > 3) val += 3

  if (data.pe != null && data.pe > 0 && data.pe < 15) val += 10
  else if (data.pe != null && data.pe > 0 && data.pe < 20) val += 6
  else if (data.pe != null && data.pe > 0 && data.pe < 25) val += 3

  val = Math.max(0, Math.min(30, val))

  // Long Term Visibility /15
  if (data.revenue3Y && data.revenue3Y.length >= 2 && data.revenue3Y.every(r => r > 0)) ltv += 5
  if (data.roic != null && data.roic > 15) ltv += 5
  if (cagr != null && cagr > 5) ltv += 5

  ltv = Math.max(0, Math.min(15, ltv))

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

  // ABSOLUTE RULE: ROIC > 18% can NEVER be "Potential Value Trap"
  // Quality Value
  if (r > 15 && m > 20 && score.total > 60) return 'Quality Value'

  // Reasonably Valued Compounder
  if (r > 15 && m > -10 && m <= 20 && g > 5) return 'Reasonably Valued Compounder'
  if (r > 20 && m > -15) return 'Reasonably Valued Compounder'

  // Deep Value
  if (m > 30 && score.total < 60 && r < 12) return 'Deep Value'

  // Potential Value Trap — only if ROIC < 18%
  if (r < 18 && m > 20 && r < 8 && g < 0) return 'Potential Value Trap'

  // High quality but expensive
  if (r > 18) return 'Reasonably Valued Compounder'

  // Fallback
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

  const beatMagnitudes = valid
    .filter(e => e.surprisePercent != null)
    .map(e => e.surprisePercent!)
  const avgMagnitude = beatMagnitudes.length > 0
    ? beatMagnitudes.reduce((a, b) => a + b, 0) / beatMagnitudes.length
    : 0

  const magnitudeNorm = avgMagnitude > 5 ? 1.0 : avgMagnitude > 2 ? 0.7 : avgMagnitude > 0 ? 0.4 : 0

  const scoreRaw = beatRate * 0.7 + magnitudeNorm * 0.3

  if (scoreRaw >= 0.83) return 5
  if (scoreRaw >= 0.67) return 4
  if (scoreRaw >= 0.50) return 3
  if (scoreRaw >= 0.33) return 2
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
