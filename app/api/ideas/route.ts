import { NextResponse } from 'next/server'
import { getCache } from '@/lib/cache'
import { TICKER_UNIVERSE } from '@/config/tickers'
import type { ScreenerRow } from '@/app/api/screener/route'

export const runtime = 'nodejs'

export interface Idea {
  ticker: string; name: string; sector: string | null
  price: number; score: number; category: string
  signal: string; signalKey: string; reason: string
  pe: number | null; marginOfSafety: number | null
  roic: number | null; revGrowth3Y: number | null; fcfYield: number | null
}

function detect(rows: ScreenerRow[]): Idea[] {
  const ideas: Idea[] = []
  const seen = new Set<string>()

  function push(r: ScreenerRow, signalKey: string, signal: string, reason: string) {
    if (seen.has(r.ticker)) return
    seen.add(r.ticker)
    ideas.push({
      ticker: r.ticker, name: r.name, sector: r.sector,
      price: r.price, score: r.score, category: r.category,
      signal, signalKey, reason,
      pe: r.pe, marginOfSafety: r.marginOfSafety,
      roic: r.roic, revGrowth3Y: r.revGrowth3Y, fcfYield: r.fcfYield,
    })
  }

  // 1. Deep Value — cheap absolute + large MoS
  rows.filter(r => r.pe != null && r.pe < 12 && r.marginOfSafety != null && r.marginOfSafety > 25)
    .forEach(r => push(r, 'deep-value', 'Deep Value',
      `P/E ${r.pe!.toFixed(1)}x with ${r.marginOfSafety!.toFixed(1)}% margin of safety`))

  // 2. Quality on Sale — high ROIC + undervalued
  rows.filter(r => r.roic != null && r.roic > 15 && r.grossMargin != null && r.grossMargin > 35 && r.marginOfSafety != null && r.marginOfSafety > 15)
    .forEach(r => push(r, 'quality-drawdown', 'Quality on Sale',
      `ROIC ${r.roic!.toFixed(1)}% · GM ${r.grossMargin!.toFixed(1)}% · MoS ${r.marginOfSafety!.toFixed(1)}%`))

  // 3. FCF Machine — high free cash flow yield + reasonable PE
  rows.filter(r => r.fcfYield != null && r.fcfYield > 6 && r.pe != null && r.pe < 22)
    .forEach(r => push(r, 'fcf-machine', 'FCF Machine',
      `FCF yield ${r.fcfYield!.toFixed(1)}% at ${r.pe!.toFixed(1)}x earnings`))

  // 4. Growth Undervalued — revenue growing fast + low multiple
  rows.filter(r => r.revGrowth3Y != null && r.revGrowth3Y > 10 && r.pe != null && r.pe < 22)
    .forEach(r => push(r, 'growth-compressed', 'Growth Undervalued',
      `Revenue CAGR ${r.revGrowth3Y!.toFixed(1)}%/yr but only ${r.pe!.toFixed(1)}x earnings`))

  // 5. High-Score Compounder — top score, great fundamentals
  rows.filter(r => r.score >= 60 && r.roic != null && r.roic > 20 && r.grossMargin != null && r.grossMargin > 40)
    .forEach(r => push(r, 'compounder', 'Elite Compounder',
      `Score ${r.score}/100 · ROIC ${r.roic!.toFixed(1)}% · GM ${r.grossMargin!.toFixed(1)}%`))

  return ideas.sort((a, b) => b.score - a.score)
}

export async function GET() {
  // Read all cached screener rows (fast, no Yahoo Finance calls)
  const { default: pLimit } = await import('p-limit')
  const lim = pLimit(20)
  const cached = (
    await Promise.all(TICKER_UNIVERSE.map(t => lim(() => getCache<ScreenerRow>(`screener:${t}`))))
  ).filter(Boolean) as ScreenerRow[]

  const ideas = detect(cached)

  const byCat = {
    'deep-value':        ideas.filter(i => i.signalKey === 'deep-value').length,
    'quality-drawdown':  ideas.filter(i => i.signalKey === 'quality-drawdown').length,
    'fcf-machine':       ideas.filter(i => i.signalKey === 'fcf-machine').length,
    'growth-compressed': ideas.filter(i => i.signalKey === 'growth-compressed').length,
    'compounder':        ideas.filter(i => i.signalKey === 'compounder').length,
  }

  return NextResponse.json({ ideas, counts: byCat, total: ideas.length, universeLoaded: cached.length })
}
