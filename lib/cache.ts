import { kv } from '@vercel/kv'
export const TTL = { PRICE: 900, METRICS: 43200, FINANCIALS: 604800, GUIDANCE: 2592000 }
export async function getCache<T>(key: string): Promise<T | null> {
  try { return await kv.get<T>(key) } catch { return null }
}
export async function setCache(key: string, value: unknown, ttl: number): Promise<void> {
  try { await kv.set(key, value, { ex: ttl }) } catch (e) { console.error('KV error:', e) }
}
