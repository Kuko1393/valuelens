import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

interface Signal {
  type: string
  label: string
  color: string
  company: any
  detail: string
  strength: number
}

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      where: { score: { not: null } },
      include: { metrics: true, valuation: true },
    })

    const signals: Signal[] = []

    for (const c of companies) {
      const m = c.metrics
      const v = c.valuation
      if (!m) continue

      const mos = m.marginOfSafety ?? -999
      const roic = m.roic ?? 0
      const score = c.score ?? 0
      const cagr = m.revenueCAGR3Y ?? 0
      const ath = m.distanceFromATH ?? 0
      const peg = v?.peg ?? 999
      const perf6m = m.performance6M ?? 0
      const guidance = m.guidanceScore ?? 0

      // Signal 1 — Anomalie de valorisation
      if (mos > 40 && score > 70) {
        signals.push({
          type: 'anomaly', label: 'Anomalie de valorisation', color: '#A855F7',
          company: c, strength: score * (1 + mos / 100),
          detail: `Score ${score}/100 + MoS +${mos.toFixed(0)}%`,
        })
      }

      // Signal 2 — Croissance + multiple comprime
      if (cagr > 15 && peg < 1.5 && score > 55) {
        signals.push({
          type: 'growth', label: 'Croissance + multiple comprime', color: '#3D9CF0',
          company: c, strength: cagr * (2 - peg),
          detail: `CAGR ${cagr.toFixed(0)}% + PEG ${peg.toFixed(1)}`,
        })
      }

      // Signal 3 — Quality Compounder en drawdown
      if (roic > 20 && ath < -30 && score > 65) {
        signals.push({
          type: 'drawdown', label: 'Quality Compounder en drawdown', color: '#00D46A',
          company: c, strength: roic * Math.abs(ath) / 10,
          detail: `ROIC ${roic.toFixed(0)}% + ATH ${ath.toFixed(0)}%`,
        })
      }

      // Signal 4 — ROIC en amelioration
      // proxy: high ROIIC suggests improving returns
      if ((m.roiic ?? 0) > 25 && roic > 10) {
        signals.push({
          type: 'improving', label: 'ROIC en amelioration structurelle', color: '#06B6D4',
          company: c, strength: (m.roiic ?? 0),
          detail: `ROIIC ${(m.roiic ?? 0).toFixed(0)}% + ROIC ${roic.toFixed(0)}%`,
        })
      }

      // Signal 5 — Decote sur guidance conservatrice
      if (perf6m < -5 && guidance >= 4) {
        signals.push({
          type: 'guidance_discount', label: 'Le marche punit un management fiable', color: '#F97316',
          company: c, strength: Math.abs(perf6m) * guidance,
          detail: `Perf 6M ${perf6m.toFixed(0)}% + Guidance ${guidance}/5`,
        })
      }
    }

    // Sort each type by strength desc
    signals.sort((a, b) => b.strength - a.strength)

    // Group by type
    const grouped: Record<string, Signal[]> = {}
    for (const s of signals) {
      if (!grouped[s.type]) grouped[s.type] = []
      grouped[s.type].push(s)
    }

    return NextResponse.json({ signals: grouped, total: signals.length })
  } catch (e) {
    console.error('[ideas] error:', e)
    return NextResponse.json({ signals: {}, total: 0 })
  }
}
