'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ScoreGauge, CategoryBadge } from '@/components/UI'

const SIGNALS: Record<string, { label: string; color: string }> = {
  quality:    { label: '⭐ Quality Compounder',          color: 'var(--accent)' },
  value:      { label: '📉 Deep Value + Piotroski fort', color: 'var(--info)' },
  compounder: { label: '🔄 Compounder + FCF élevé',     color: 'var(--warning)' },
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'quality' | 'value' | 'compounder'>('all')

  useEffect(() => {
    Promise.all([
      fetch('/api/screener?sortBy=score&sortDir=desc&limit=200').then(r => r.json()),
    ]).then(([screenerData]) => {
      const rows = screenerData.data || []
      const out: any[] = []

      // Quality Compounders: score > 65, Piotroski ≥ 6, FCF conv > 0.8
      rows
        .filter((r: any) => r.score > 65 && (r.piotroskiFScore ?? 0) >= 6 && (r.fcfConversionRatio ?? 0) > 0.8)
        .forEach((r: any) => out.push({
          ...r, signal: 'quality',
          detail: `Score ${r.score}/100 · Piotroski ${r.piotroskiFScore}/9 · FCF Conv ${r.fcfConversionRatio?.toFixed(2)}`,
        }))

      // Deep Value + Piotroski fort
      rows
        .filter((r: any) => (r.marginOfSafety ?? 0) > 25 && (r.piotroskiFScore ?? 0) >= 7 && !out.find(x => x.ticker === r.ticker))
        .forEach((r: any) => out.push({
          ...r, signal: 'value',
          detail: `MoS +${r.marginOfSafety?.toFixed(0)}% · Piotroski ${r.piotroskiFScore}/9`,
        }))

      // Compounders with high FCF yield
      rows
        .filter((r: any) => (r.fcfYield ?? 0) > 6 && (r.roic ?? 0) > 12 && !out.find(x => x.ticker === r.ticker))
        .forEach((r: any) => out.push({
          ...r, signal: 'compounder',
          detail: `FCF Yield ${r.fcfYield?.toFixed(1)}% · ROIC ${r.roic?.toFixed(1)}%`,
        }))

      setIdeas(out.slice(0, 48))
    }).finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? ideas : ideas.filter(i => i.signal === filter)
  const counts = ideas.reduce((acc, i) => { acc[i.signal] = (acc[i.signal] || 0) + 1; return acc }, {} as Record<string, number>)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(6,10,18,.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 32, height: 56 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-bright)' }}>Value<span style={{ color: 'var(--accent)' }}>Lens</span></span>
        </Link>
        {[{ href: '/', label: 'Screener' }, { href: '/ideas', label: 'Opportunités' }, { href: '/watchlist', label: 'Watchlists' }].map(l => (
          <Link key={l.href} href={l.href} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500, textDecoration: 'none', color: l.href === '/ideas' ? 'var(--accent)' : 'var(--text-dim)', background: l.href === '/ideas' ? 'var(--accent-dim)' : 'transparent' }}>{l.label}</Link>
        ))}
      </nav>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: 'var(--text-bright)' }}>
            Top Opportunités
          </h1>
          <p style={{ margin: '0 0 16px', color: 'var(--text-dim)', fontSize: 14 }}>
            Sélection automatique selon score, Piotroski F-Score, FCF Conversion et ROIC
          </p>
          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 8 }}>
            {([['all', 'Toutes', ideas.length], ['quality', '⭐ Quality', counts.quality || 0], ['value', '📉 Deep Value', counts.value || 0], ['compounder', '🔄 Compounders', counts.compounder || 0]] as const).map(([key, label, count]) => (
              <button key={key} onClick={() => setFilter(key as any)}
                style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'Space Grotesk,sans-serif', border: '1px solid var(--border)', background: filter === key ? 'var(--accent)' : 'var(--surface)', color: filter === key ? '#000' : 'var(--text-dim)' }}>
                {label} ({count})
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 140 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 64, color: 'var(--muted)' }}>
            Aucune opportunité dans cette catégorie — rafraîchissez les données.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
            {filtered.map(idea => {
              const sig = SIGNALS[idea.signal]
              return (
                <div key={idea.ticker} className="card card-hover" onClick={() => { window.location.href = '/?ticker=' + idea.ticker }} style={{ padding: 16, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-bright)', fontSize: 14 }}>{idea.name?.slice(0, 24)}</div>
                      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: 'var(--accent)' }}>{idea.ticker}</div>
                    </div>
                    <ScoreGauge score={idea.score} size={42} />
                  </div>
                  <div style={{ marginBottom: 10, padding: '5px 10px', borderRadius: 6, background: `${sig.color}15`, border: `1px solid ${sig.color}30` }}>
                    <div style={{ fontSize: 11, color: sig.color, fontWeight: 600 }}>{sig.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{idea.detail}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 14, fontWeight: 600 }}>{idea.price?.toFixed(2) || '—'}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>Prix</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, fontWeight: 600, color: (idea.marginOfSafety ?? 0) > 0 ? 'var(--accent)' : 'var(--danger)' }}>
                        {idea.marginOfSafety != null ? `${(idea.marginOfSafety ?? 0) > 0 ? '+' : ''}${idea.marginOfSafety.toFixed(1)}%` : '—'}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>MoS</div>
                    </div>
                    <CategoryBadge category={idea.category} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
