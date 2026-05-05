const useKV = !!(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
)

const memCache = new Map<string, { value: unknown; expiry: number }>()

export const TTL = {
  PRICE: 15 * 60,
  METRICS: 12 * 60 * 60,
  FINANCIALS: 7 * 24 * 60 * 60,
  GUIDANCE: 30 * 24 * 60 * 60,
}

export async function getCache<T>(key: string): Promise<T | null> {
  if (useKV) {
    try {
      const { kv } = await import('@vercel/kv')
      return await kv.get<T>(key)
    } catch {
      return null
    }
  }
  const item = memCache.get(key)
  if (!item) return null
  if (Date.now() > item.expiry) { memCache.delete(key); return null }
  return item.value as T
}

export async function setCache<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  if (useKV) {
    try {
      const { kv } = await import('@vercel/kv')
      await kv.set(key, value, { ex: ttlSeconds })
    } catch {}
    return
  }
  memCache.set(key, { value, expiry: Date.now() + ttlSeconds * 1000 })
}
