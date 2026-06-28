'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ScoreGauge, CategoryBadge } from '@/components/UI'

const SIGNAL_META: Record<string, { emoji: string; title: string }> = {
  anomaly: { emoji: '🟣', title: 'Anomalies de valorisation' },
  growth: { emoji: '🔵', title: 'Croissance + multiple comprime' },
  drawdown: { emoji: '🟢', title: 'Quality Compounders en drawdown' },
  improving: { emoji: '🔷', title: 'ROIC en amelioration structurelle' },
  guidance_discount: { emoji: '🟠', title: 'Decote sur guidance conservatrice' },
}

export default function IdeasPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/ideas')
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  const signals = data?.signals ?? {}

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(6,10,18,.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 32, height: 56 }}>
        <Link href="/" style={{ textDecoration: 'none', fontWeight: 700, fontSize: 15, color: 'var(--text-bright)' }}>
          Value<span style={{ color: 'var(--accent)' }}>Lens</span>
        </Link>
        {[{ href: '/', label: 'Screener' }, { href: '/ideas', label: 'Opportunites' }, { href: '/watchlist', label: 'Watchlists' }].map(l => (
          <Link key={l.href} href={l.href} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500, textDecoration: 'none', color: l.href === '/ideas' ? 'var(--accent)' : 'var(--text-dim)', background: l.href === '/ideas' ? 'var(--accent-dim)' : 'transparent' }}>{l.label}</Link>
        ))}
      </nav>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: 24 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: 'var(--text-bright)' }}>
          Opportunites detectees
        </h1>
        <p style={{ margin: '0 0 24px', color: 'var(--text-dim)', fontSize: 14 }}>
          Signaux calcules automatiquement depuis les donnees en base — {data?.total ?? 0} signaux actifs
        </p>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 140 }} />)}
          </div>
        ) : (
          Object.entries(SIGNAL_META).map(([type, meta]) => {
            const items = signals[type] ?? []
            return (
              <div key={type} style={{ marginBottom: 32 }}>
                <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: 'var(--text-bright)' }}>
                  {meta.emoji} {meta.title}
                  <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 400, marginLeft: 8 }}>
                    ({items.length})
                  </span>
                </h2>
                {items.length === 0 ? (
                  <div style={{ padding: '20px 0', color: 'var(--muted)', fontSize: 13 }}>
                    Aucune opportunite detectee pour ce signal actuellement
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
                    {items.slice(0, 8).map((s: any) => {
                      const c = s.company
                      return (
                        <Link key={c.ticker} href={`/company/${c.ticker}`} style={{ textDecoration: 'none' }}>
                          <div className="card card-hover" style={{ padding: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-bright)', fontSize: 13 }}>{c.name?.slice(0, 28)}</div>
                                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--accent)' }}>{c.ticker}</div>
                              </div>
                              <ScoreGauge score={Math.round(c.score ?? 0)} size={38} />
                            </div>
                            <div style={{ padding: '4px 8px', borderRadius: 4, background: `${s.color}15`, border: `1px solid ${s.color}30`, marginBottom: 8 }}>
                              <div style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.label}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{s.detail}</div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600 }}>
                                {c.currentPrice?.toFixed(2) ?? '—'}
                              </div>
                              {c.category && <CategoryBadge category={c.category} />}
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
