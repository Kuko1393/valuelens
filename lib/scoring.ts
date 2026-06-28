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

  // Financial Strength /25
  const nd = computeND(data)
  if (nd != null && nd < 1) fs += 10
  else if (nd != null && nd < 2) fs += 6
  else if (nd != null && nd < 3) fs += 3

  if (data.interestCoverage != null && data.interestCoverage > 10) fs += 10
  else if (data.interestCoverage != null && data.interestCoverage > 5) fs += 6
  else if (data.interestCoverage != null && data.interestCoverage > 2) fs += 3

  if (data.currentRatio != null && data.currentRatio > 1.5) fs += 5
  else if (data.currentRatio != null && data.currentRatio > 1) fs += 3

  // Valuation /30
  const mos = iv && data.price && data.price > 0 ? ((iv - data.price) / iv) * 100 : null
  if (mos != null && mos > 30) val += 10
  else if (mos != null && mos > 20) val += 6
  else if (mos != null && mos > 10) val += 3

  if (data.fcfYield != null && data.fcfYield > 8) val += 10
  else if (data.fcfYield != null && data.fcfYield > 5) val += 6
  else if (data.fcfYield != null && data.fcfYield > 3) val += 3

  if (data.pe != null && data.pe > 0 && data.pe < 15) val += 10
  else if (data.pe != null && data.pe > 0 && data.pe < 20) val += 6
  else if (data.pe != null && data.pe > 0 && data.pe < 25) val += 3

  // Long Term Visibility /15
  if (data.revenue3Y && data.revenue3Y.length >= 2 && data.revenue3Y.every(r => r > 0)) ltv += 5
  if (data.roic != null && data.roic > 15) ltv += 5
  if (cagr != null && cagr > 5) ltv += 5

  const total = Math.round(
    (Math.min(30, bq) / 30) * 30 +
    (Math.min(25, fs) / 25) * 25 +
    (Math.min(30, val) / 30) * 30 +
    (Math.min(15, ltv) / 15) * 15
  )

  return {
    total: Math.min(100, total),
    businessQuality: Math.min(30, bq),
    financialStrength: Math.min(25, fs),
    valuation: Math.min(30, val),
    longTermVisibility: Math.min(15, ltv),
  }
}

export function classifyCompany(score: Score, mos: number | null): Category {
  const hq = score.businessQuality >= 20
  const uv = mos != null && mos > 20
  if (hq && uv) return 'Quality Value'
  if (!hq && uv && mos != null && mos > 30) return 'Deep Value'
  if (hq && !uv) return 'Reasonably Valued Compounder'
  return 'Potential Value Trap'
}

export function computeMarginOfSafety(iv: number | null, price: number | null): number | null {
  if (!iv || !price || price <= 0) return null
  const mos = ((iv - price) / iv) * 100
  return Math.max(-500, Math.min(100, mos))
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
  if (valid.length < 2) return null

  const beats = valid.filter(e => e.epsActual! > e.epsEstimate!).length
  const beatRate = beats / valid.length

  const beatMagnitudes = valid
    .filter(e => e.surprisePercent != null)
    .map(e => e.surprisePercent!)
  const avgMagnitude = beatMagnitudes.length > 0
    ? beatMagnitudes.reduce((a, b) => a + b, 0) / beatMagnitudes.length
    : 0

  let scoreFromRate = 1
  if (beatRate >= 0.80) scoreFromRate = 5
  else if (beatRate >= 0.65) scoreFromRate = 4
  else if (beatRate >= 0.45) scoreFromRate = 3
  else if (beatRate >= 0.25) scoreFromRate = 2

  const magnitudeBonus = avgMagnitude > 15 ? 0.5 : avgMagnitude > 5 ? 0.3 : avgMagnitude > 0 ? 0.1 : 0

  return Math.min(5, Math.round(scoreFromRate + magnitudeBonus))
}

function computeCAGR(revenues: number[] | null): number | null {
  if (!revenues || revenues.length < 2) return null
  const latest = revenues[0]
  const oldest = revenues[revenues.length - 1]
  if (oldest <= 0) return null
  return ((latest / oldest) ** (1 / (revenues.length - 1)) - 1) * 100
}

function computeND(data: FinancialData): number | null {
  if (!data.totalDebt || !data.ebitda || data.ebitda <= 0) return null
  return (data.totalDebt - (data.totalCash || 0)) / data.ebitda
}
