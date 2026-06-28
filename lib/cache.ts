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

export const TTL = {
  PRICE: 15 * 60,
  METRICS: 12 * 60 * 60,
  FINANCIALS: 7 * 24 * 60 * 60,
  GUIDANCE: 30 * 24 * 60 * 60,
}
