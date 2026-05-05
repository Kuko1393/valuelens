import type { FinancialData } from './yahoo'

export interface Score {
  total: number; businessQuality: number; financialStrength: number
  valuation: number; longTermVisibility: number
}
export type Category = 'Deep Value' | 'Quality Value' | 'Reasonably Valued Compounder' | 'Potential Value Trap'

export function calculateScore(data: FinancialData, iv: number | null): Score {
  let bq=0, fs=0, val=0, ltv=0
  if (data.roic !== null && data.roic > 15) bq += 10
  else if (data.roic !== null && data.roic > 10) bq += 5
  const cagr = computeCAGR(data.revenue3Y)
  if (cagr !== null && cagr > 5) bq += 10; else if (cagr !== null && cagr > 2) bq += 5
  if (data.grossMargin !== null && data.grossMargin > 30) bq += 5
  const nd = computeND(data)
  if (nd !== null && nd < 1) fs += 10; else if (nd !== null && nd < 2) fs += 6
  const ic = computeIC(data)
  if (ic !== null && ic > 10) fs += 10; else if (ic !== null && ic > 5) fs += 6
  fs += 5
  const mos = iv && data.price > 0 ? ((iv - data.price) / iv) * 100 : null
  if (mos !== null && mos > 30) val += 10; else if (mos !== null && mos > 20) val += 6; else if (mos !== null && mos > 10) val += 3
  if (data.fcfYield !== null && data.fcfYield > 8) val += 10; else if (data.fcfYield !== null && data.fcfYield > 5) val += 6
  if (data.pe !== null && data.pe < 15) val += 10; else if (data.pe !== null && data.pe < 20) val += 6
  if (data.revenue3Y?.every(r => r > 0)) ltv += 5
  if (data.roic !== null && data.roic > 15) ltv += 5
  if (cagr !== null && cagr > 5) ltv += 5
  const total = Math.round((bq/30)*30 + (fs/25)*25 + (val/30)*30 + (ltv/15)*15)
  return { total: Math.min(100,total), businessQuality: Math.min(30,bq), financialStrength: Math.min(25,fs), valuation: Math.min(30,val), longTermVisibility: Math.min(15,ltv) }
}

export function classifyCompany(score: Score, mos: number | null): Category {
  const hq = score.businessQuality >= 20; const uv = mos !== null && mos > 20
  if (hq && uv) return 'Quality Value'
  if (!hq && uv && mos !== null && mos > 30) return 'Deep Value'
  if (hq && !uv) return 'Reasonably Valued Compounder'
  return 'Potential Value Trap'
}

export function computeMarginOfSafety(iv: number | null, price: number): number | null {
  if (!iv || price <= 0) return null; return ((iv - price) / iv) * 100
}

function computeCAGR(revenues: number[] | null): number | null {
  if (!revenues || revenues.length < 2) return null
  const [l, o] = [revenues[0], revenues[revenues.length - 1]]; if (o <= 0) return null
  return ((l / o) ** (1 / (revenues.length - 1)) - 1) * 100
}
function computeND(data: FinancialData): number | null {
  if (!data.totalDebt || !data.ebitda || data.ebitda <= 0) return null
  return (data.totalDebt - (data.totalCash || 0)) / data.ebitda
}
function computeIC(data: FinancialData): number | null {
  if (!data.ebitda || !data.interestExpense || data.interestExpense >= 0) return null
  return data.ebitda / Math.abs(data.interestExpense)
}
