import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getFinancials } from '@/lib/yahoo'
import { calculateGuidanceScore } from '@/lib/scoring'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(_req: NextRequest, { params }: { params: { ticker: string } }) {
  const ticker = params.ticker.toUpperCase()
  try {
    const [history, meta, data] = await Promise.all([
      prisma.guidanceHistory.findMany({ where: { ticker }, orderBy: { year: 'desc' }, take: 10 }).catch(() => []),
      prisma.guidanceMeta.findUnique({ where: { ticker } }).catch(() => null),
      getFinancials(ticker),
    ])

    const earningsHistory = data?.earningsHistory ?? null
    const guidanceScore = calculateGuidanceScore(earningsHistory)

    return NextResponse.json({
      history,
      meta,
      earningsHistory,
      guidanceScore,
      source: history.length > 0 ? 'database' : earningsHistory ? 'yahoo' : 'none',
    })
  } catch {
    return NextResponse.json({ history: [], meta: null, earningsHistory: null, guidanceScore: null, source: 'error' })
  }
}

export async function POST(req: NextRequest, { params }: { params: { ticker: string } }) {
  const ticker = params.ticker.toUpperCase()
  const body = await req.json().catch(() => ({}))
  const apiKey = process.env.BRAVE_SEARCH_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey || !anthropicKey) {
    return NextResponse.json({
      error: 'Brave Search or Anthropic API key not configured',
      fallback: 'Yahoo earningsHistory only',
    }, { status: 501 })
  }

  try {
    const searchRes = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(`"${body.name || ticker}" annual guidance results investor relations`)}&count=5`,
      { headers: { Accept: 'application/json', 'X-Subscription-Token': apiKey } }
    )
    const searchData = await searchRes.json()
    const urls: string[] = (searchData.web?.results || []).slice(0, 3).map((r: any) => r.url)

    let extracted = 0
    for (const url of urls) {
      try {
        const pageRes = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ValueLens/1.0)' },
          signal: AbortSignal.timeout(8000),
        })
        const html = await pageRes.text()
        const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 6000)

        const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            messages: [{
              role: 'user',
              content: `Tu es un analyste financier expert. Extrait toutes les guidances annuelles depuis ce texte. Retourne UNIQUEMENT du JSON valide, aucun markdown.
Format: [{"year":2023,"metric":"Revenue","guidance_low":"800","guidance_high":"850","actual_value":"872","beat":true,"source_url":"${url}"}]
metric doit etre: Revenue | EPS | EBIT | Net Income | Operating Income
Si resultat reel absent: actual_value null, beat null.
Texte: ${text}`,
            }],
          }),
        })
        const claudeData = await claudeRes.json()
        const content = claudeData.content?.[0]?.text || '[]'
        const guidances = JSON.parse(content.replace(/```json|```/g, '').trim())

        for (const g of (Array.isArray(guidances) ? guidances : [])) {
          if (!g.year || !g.metric) continue
          await prisma.guidanceHistory.upsert({
            where: { ticker_year_metric: { ticker, year: g.year, metric: g.metric } },
            update: {
              guidanceLow: g.guidance_low ?? null,
              guidanceHigh: g.guidance_high ?? null,
              actualValue: g.actual_value ?? null,
              beat: g.beat ?? null,
              sourceUrl: url,
            },
            create: {
              ticker,
              year: g.year,
              metric: g.metric,
              guidanceValue: g.guidance_value ?? null,
              guidanceLow: g.guidance_low ?? null,
              guidanceHigh: g.guidance_high ?? null,
              actualValue: g.actual_value ?? null,
              beat: g.beat ?? null,
              sourceUrl: url,
            },
          })
          extracted++
        }
      } catch { continue }
    }

    await prisma.guidanceMeta.upsert({
      where: { ticker },
      update: { lastSearchedAt: new Date(), dataQuality: extracted > 3 ? 'high' : extracted > 0 ? 'medium' : 'low' },
      create: { ticker, lastReportDate: new Date(), lastSearchedAt: new Date(), dataQuality: extracted > 0 ? 'medium' : 'low' },
    })

    return NextResponse.json({ success: true, extracted })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
