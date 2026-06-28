import { NextRequest, NextResponse } from 'next/server'
import { TICKER_UNIVERSE } from '@/config/tickers'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(req: NextRequest) {
  const { default: pLimit } = await import('p-limit')
  const limit = pLimit(3)

  const results = { success: 0, failed: 0, errors: [] as string[], total: TICKER_UNIVERSE.length }
  const batchSize = 10

  for (let i = 0; i < TICKER_UNIVERSE.length; i += batchSize) {
    const batch = TICKER_UNIVERSE.slice(i, i + batchSize)
    await Promise.all(
      batch.map(ticker =>
        limit(async () => {
          try {
            const res = await fetch(`${req.nextUrl.origin}/api/refresh?ticker=${ticker}`, {
              headers: { authorization: `Bearer ${process.env.CRON_SECRET ?? 'dev'}` },
            })
            if (res.ok) results.success++
            else {
              results.failed++
              results.errors.push(ticker)
            }
          } catch {
            results.failed++
            results.errors.push(ticker)
          }
        })
      )
    )
    await new Promise(r => setTimeout(r, 500))
  }

  return NextResponse.json(results)
}
