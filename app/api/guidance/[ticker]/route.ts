import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, { params }: { params: { ticker: string } }) {
  const ticker = params.ticker.toUpperCase()
  try {
    const history = await prisma.guidanceHistory.findMany({ where: { ticker }, orderBy: { year: 'desc' }, take: 10 })
    const meta = await prisma.guidanceMeta.findUnique({ where: { ticker } })
    return NextResponse.json({ history, meta })
  } catch { return NextResponse.json({ history: [], meta: null }) }
}

export async function POST(req: NextRequest, { params }: { params: { ticker: string } }) {
  const ticker = params.ticker.toUpperCase()
  const body = await req.json().catch(() => ({}))
  const apiKey = process.env.BRAVE_SEARCH_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || !anthropicKey) return NextResponse.json({ error: 'API keys missing' }, { status: 500 })

  try {
    const searchRes = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(`"${body.name||ticker}" annual guidance results investor relations`)}&count=5`, {
      headers: { 'Accept': 'application/json', 'X-Subscription-Token': apiKey }
    })
    const searchData = await searchRes.json()
    const urls: string[] = (searchData.web?.results || []).slice(0, 3).map((r: any) => r.url)

    for (const url of urls) {
      try {
        const pageRes = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) })
        const html = await pageRes.text()
        const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 6000)

        const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514', max_tokens: 1000,
            messages: [{ role: 'user', content: `Extract annual guidances from this text as JSON array only. Format: [{"year":2023,"metric":"Revenue","guidance_low":"800","guidance_high":"850","actual_value":"872","beat":true,"source_url":"${url}"}]. Text: ${text}` }]
          })
        })
        const claudeData = await claudeRes.json()
        const content = claudeData.content?.[0]?.text || '[]'
        const guidances = JSON.parse(content.replace(/```json|```/g, '').trim())

        for (const g of (Array.isArray(guidances) ? guidances : [])) {
          await prisma.guidanceHistory.upsert({
            where: { ticker_year_metric: { ticker, year: g.year, metric: g.metric || 'Revenue' } },
            update: { guidanceLow: g.guidance_low, guidanceHigh: g.guidance_high, actualValue: g.actual_value, beat: g.beat, sourceUrl: g.source_url },
            create: { ticker, year: g.year, metric: g.metric || 'Revenue', guidanceLow: g.guidance_low, guidanceHigh: g.guidance_high, actualValue: g.actual_value, beat: g.beat, sourceUrl: g.source_url }
          })
        }
      } catch { continue }
    }

    await prisma.guidanceMeta.upsert({
      where: { ticker },
      update: { lastSearchedAt: new Date(), dataQuality: 'medium' },
      create: { ticker, lastReportDate: new Date(), lastSearchedAt: new Date(), dataQuality: 'medium' }
    })
    return NextResponse.json({ success: true })
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
