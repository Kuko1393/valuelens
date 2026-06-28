import { kv } from '@vercel/kv'

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    return await kv.get<T>(key)
  } catch {
    return null
  }
}

export async function setCache<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  try {
    await kv.set(key, value, { ex: ttlSeconds })
  } catch {}
}

export async function getOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  const cached = await getCache<T>(key)
  if (cached != null) return cached
  const fresh = await fetcher()
  await setCache(key, fresh, ttlSeconds)
  return fresh
}

export async function invalidateCompany(ticker: string): Promise<void> {
  const keys = [`company:${ticker}`, `quote:${ticker}`, `metrics:${ticker}`, `financials:${ticker}`]
  try {
    await Promise.all(keys.map(k => kv.del(k)))
  } catch {}
}

export const TTL = {
  PRICE: 900,
  METRICS: 43200,
  FINANCIALS: 604800,
  GUIDANCE: 2592000,
  SCREENER: 3600,
  IDEAS: 3600,
}
