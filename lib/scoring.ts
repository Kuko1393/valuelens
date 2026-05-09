import type { FinancialData } from './yahoo'

export interface Score {
  total: number; businessQuality: number; financialStrength: number
  valuation: number; longTermVisibility: number
}
export type Category = 'Deep Value' | 'Quality Value' | 'Reasonably Valued Compounder' | 'Potential Value Trap'

// ── Guidance score from EPS beat rate ────────────────────────────────────────
export function calculateGuidanceScore(history: FinancialData['earningsHistory']): number {
  if (!history || history.length === 0) return 3 // neutral — no data
  const valid = history.filter(e => e.epsActual != null && e.epsEstimate != null)
  if (valid.length === 0) return 3
  const beats = valid.filter(e => e.epsActual! > e.epsEstimate!).length
  const rate   = beats / valid.length
  if (rate >= 0.80) return 5
  if (rate >= 0.65) return 4
  if (rate >= 0.45) return 3
  if (rate >= 0.25) return 2
  return 1
}

export function calculateScore(data: FinancialData, iv: number | null): Score {
  let bq=0, fs=0, val=0, ltv=0

  // ── Business Quality /30 ─────────────────────────────────────────────────
  // ROIC: graduated scale (was binary 10/5)
  if (data.roic !== null) {
    if      (data.roic > 30) bq += 10
    else if (data.roic > 20) bq += 8
    else if (data.roic > 15) bq += 6
    else if (data.roic > 10) bq += 3
  }

  // Revenue CAGR: graduated scale (was binary 10/5)
  const cagr = computeCAGR(data.revenue3Y)
  if (cagr !== null) {
    if      (cagr > 12) bq += 10
    else if (cagr > 7)  bq += 8
    else if (cagr > 3)  bq += 6
    else if (cagr > 0)  bq += 3
    // negative CAGR → +0
  }

  // Gross margin: graduated scale (was flat 5)
  if (data.grossMargin !== null) {
    if      (data.grossMargin > 60) bq += 10
    else if (data.grossMargin > 40) bq += 7
    else if (data.grossMargin > 25) bq += 4
  }

  // ── Financial Strength /25 ───────────────────────────────────────────────
  // Net Debt / EBITDA — null data handled neutrally (no more 0-penalise)
  const nd = computeND(data)
  if (nd !== null) {
    if      (nd < 0) fs += 10 // net cash
    else if (nd < 1) fs += 9
    else if (nd < 2) fs += 6
    else if (nd < 3) fs += 3
    // nd >= 3 → +0
  } else if (data.totalDebt != null && data.ebitda != null && data.ebitda > 0) {
    // Approximate when interestExpense unavailable
    const approx = (data.totalDebt - (data.totalCash ?? 0)) / data.ebitda
    if      (approx < 0) fs += 10
    else if (approx < 1) fs += 9
    else if (approx < 2) fs += 6
    else if (approx < 3) fs += 3
  } else {
    fs += 5 // neutral — don't penalise missing balance sheet data
  }

  // Interest coverage — neutral (5) when data missing, not 0
  const ic = computeIC(data)
  if (ic !== null) {
    if      (ic > 10) fs += 10
    else if (ic > 5)  fs += 6
    else if (ic > 3)  fs += 3
  } else {
    fs += 5 // neutral
  }

  fs += 5 // baseline credit for being a going concern

  // ── Valuation /30 ────────────────────────────────────────────────────────
  const mos = iv && data.price > 0 ? ((iv - data.price) / iv) * 100 : null
  if (mos !== null) {
    if      (mos > 30) val += 12
    else if (mos > 20) val += 8
    else if (mos > 10) val += 4
  }

  // FCF yield
  if (data.fcfYield !== null) {
    if      (data.fcfYield > 8) val += 8
    else if (data.fcfYield > 5) val += 5
    else if (data.fcfYield > 3) val += 3
  }

  // P/E
  if (data.pe !== null && data.pe > 0) {
    if      (data.pe < 10) val += 6
    else if (data.pe < 15) val += 4
    else if (data.pe < 20) val += 2
  }

  // EV/EBIT (was ignored in scoring — now included)
  if (data.evEbit !== null && data.evEbit > 0) {
    if      (data.evEbit < 8)  val += 4
    else if (data.evEbit < 12) val += 3
    else if (data.evEbit < 16) val += 2
    else if (data.evEbit < 22) val += 1
  }

  // ── Long-term Visibility /15 ──────────────────────────────────────────────
  if (data.revenue3Y?.every(r => r > 0)) ltv += 5
  if (data.roic !== null && data.roic > 15) ltv += 5
  if (cagr !== null && cagr > 5) ltv += 5

  const total = Math.round((bq/30)*30 + (fs/25)*25 + (val/30)*30 + (ltv/15)*15)
  return {
    total: Math.min(100, total),
    businessQuality:    Math.min(30, bq),
    financialStrength:  Math.min(25, fs),
    valuation:          Math.min(30, val),
    longTermVisibility: Math.min(15, ltv),
  }
}

// ROIC-aware classification — fixes the ADBE / WKL false "Value Trap" cases
export function classifyCompany(score: Score, mos: number | null, roic: number | null = null): Category {
  // High quality: strong business quality score OR proven high ROIC
  const hq = score.businessQuality >= 18 || (roic !== null && roic > 15)
  // Undervalued: MoS > 20% (intrinsic value > market price by at least 20%)
  const uv = mos !== null && mos > 20

  if (hq && uv)  return 'Quality Value'
  if (hq && !uv) return 'Reasonably Valued Compounder'
  if (!hq && uv) return 'Deep Value'
  return 'Potential Value Trap'   // low quality + not undervalued
}

export function computeMarginOfSafety(iv: number | null, price: number): number | null {
  if (!iv || price <= 0) return null
  return ((iv - price) / iv) * 100
}

function computeCAGR(revenues: number[] | null): number | null {
  if (!revenues || revenues.length < 2) return null
  const [first, last] = [revenues[0], revenues[revenues.length - 1]]
  if (!first || first <= 0) return null
  return ((last / first) ** (1 / (revenues.length - 1)) - 1) * 100
}

function computeND(data: FinancialData): number | null {
  if (data.totalDebt == null || data.ebitda == null || data.ebitda <= 0) return null
  return (data.totalDebt - (data.totalCash ?? 0)) / data.ebitda
}

function computeIC(data: FinancialData): number | null {
  if (!data.ebitda || !data.interestExpense || data.interestExpense >= 0) return null
  return data.ebitda / Math.abs(data.interestExpense)
}

// Exported for screener route CAGR calculation
export { computeCAGR as computeRevCAGR }
