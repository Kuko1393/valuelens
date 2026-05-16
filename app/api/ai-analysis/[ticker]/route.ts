import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getFinancials } from '@/lib/yahoo'
import { calculateScore, classifyCompany, computeMarginOfSafety } from '@/lib/scoring'
import { estimateIntrinsicValue } from '@/lib/dcf'
import { getCache, setCache, TTL } from '@/lib/cache'

export const runtime = 'nodejs'

const fmtN = (v: number | null, d = 1, s = '') => v === null ? 'N/A' : `${v.toFixed(d)}${s}`
const fmtBig = (v: number | null) => !v ? 'N/A' : v >= 1e9 ? `${(v / 1e9).toFixed(1)}B` : `${(v / 1e6).toFixed(0)}M`

export async function GET(_req: NextRequest, { params }: { params: { ticker: string } }) {
  const ticker = params.ticker.toUpperCase()
  const cacheKey = `ai-analysis:${ticker}`
  const cached = await getCache<string>(cacheKey)
  if (cached) return NextResponse.json({ analysis: cached })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Clé API Anthropic non configurée' }, { status: 500 })

  const data = await getFinancials(ticker)
  if (!data) return NextResponse.json({ error: 'Données introuvables pour ' + ticker }, { status: 404 })

  const iv = estimateIntrinsicValue(
    data.freeCashFlow3Y?.[0] && data.sharesOutstanding ? data.freeCashFlow3Y[0] / data.sharesOutstanding : null,
    data.pe
  )
  const mos = computeMarginOfSafety(iv, data.price)
  const score = calculateScore(data, iv)
  const category = classifyCompany(score, mos)

  const prompt = `Tu es un analyste financier spécialisé value investing. Analyse cette entreprise et génère un rapport d'investissement structuré en français.

**${data.name} (${ticker})**
- Secteur: ${data.sector || 'N/A'}
- Prix: $${data.price.toFixed(2)} | Valeur intrinsèque estimée: ${iv ? '$' + iv.toFixed(2) : 'N/A'}
- Marge de sécurité: ${mos !== null ? (mos > 0 ? '+' : '') + mos.toFixed(1) + '%' : 'N/A'}
- Score ValueLens: ${score.total}/100 (${category})
- Business Quality: ${score.businessQuality}/30 | Financial Strength: ${score.financialStrength}/25 | Valuation: ${score.valuation}/30
- ROIC: ${fmtN(data.roic, 1, '%')} | Marge brute: ${fmtN(data.grossMargin, 1, '%')} | Marge opéra.: ${fmtN(data.operatingMargin, 1, '%')}
- FCF Yield: ${fmtN(data.fcfYield, 1, '%')} | P/E: ${fmtN(data.pe, 1, 'x')} | EV/EBIT: ${fmtN(data.evEbit, 1, 'x')}
- Capitalisation: ${fmtBig(data.marketCap)}
- Activité: ${data.description ? data.description.slice(0, 600) : 'N/A'}

Génère un rapport structuré avec exactement ces 5 sections (utilise ## comme titre) :

## Thèse d'investissement
## Forces
## Risques
## Valorisation
## Verdict

Sois concis (max 450 mots total), factuel, orienté value investing. Appuie-toi sur les données fournies. Pas de généralités.`

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    })
    const analysis = message.content[0].type === 'text' ? message.content[0].text : ''
    await setCache(cacheKey, analysis, TTL.METRICS)
    return NextResponse.json({ analysis })
  } catch (err) {
    console.error('Anthropic error:', err)
    return NextResponse.json({ error: 'Erreur lors de la génération Claude' }, { status: 500 })
  }
}
