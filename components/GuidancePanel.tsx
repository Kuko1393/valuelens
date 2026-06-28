'use client'

import { useState, useEffect } from 'react'

interface EarningsEntry {
  period: string
  epsEstimate: number | null
  epsActual: number | null
  surprisePercent: number | null
}

interface GuidanceEntry {
  id: string
  year: number
  metric: string
  guidanceValue: string | null
  guidanceLow: string | null
  guidanceHigh: string | null
  actualValue: string | null
  beat: boolean | null
}

interface GuidanceData {
  history: GuidanceEntry[]
  earningsHistory: EarningsEntry[] | null
  guidanceScore: number | null
  source: string
  meta: { lastSearchedAt: string; dataQuality: string } | null
}

const SCORE_LABELS: Record<number, { label: string; cls: string }> = {
  5: { label: 'Beat & Raise — Management de confiance', cls: 'tag-green' },
  4: { label: 'Conservateur fiable', cls: 'tag-green' },
  3: { label: 'Correct — a surveiller', cls: 'tag-yellow' },
  2: { label: 'Peu fiable — prudence', cls: 'tag-red' },
  1: { label: 'Sur-prometteur — signal d\'evitement', cls: 'tag-red' },
}

export function GuidancePanel({ ticker }: { ticker: string }) {
  const [data, setData] = useState<GuidanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = () => {
    setLoading(true)
    fetch(`/api/guidance/${ticker}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [ticker])

  const handleForceRefresh = async () => {
    setRefreshing(true)
    try {
      await fetch(`/api/guidance/${ticker}?force=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: ticker }),
      })
      load()
    } catch {}
    setRefreshing(false)
  }

  if (loading) return <div className="skeleton" style={{ height: 200 }} />
  if (!data) return <div style={{ color: 'var(--muted)', padding: 24 }}>Donnees indisponibles</div>

  const scoreInfo = data.guidanceScore != null ? SCORE_LABELS[data.guidanceScore] : null

  return (
    <div>
      {/* Score header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 24, fontWeight: 700, color: 'var(--text-bright)' }}>
          {data.guidanceScore != null ? `${data.guidanceScore}/5` : 'N/D'}
        </div>
        {scoreInfo && (
          <span className={`tag ${scoreInfo.cls}`}>{scoreInfo.label}</span>
        )}
        {!scoreInfo && data.guidanceScore == null && (
          <span className="tag tag-gray">Donnees insuffisantes</span>
        )}
      </div>

      {/* Earnings History (Yahoo) */}
      {data.earningsHistory && data.earningsHistory.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.08em' }}>
            EPS: Estimations vs Resultats
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
            {data.earningsHistory.map((e, i) => {
              const beat = e.epsActual != null && e.epsEstimate != null && e.epsActual > e.epsEstimate
              const miss = e.epsActual != null && e.epsEstimate != null && e.epsActual <= e.epsEstimate
              return (
                <div key={i} className="card" style={{ padding: 10 }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>{e.period}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Est: {e.epsEstimate?.toFixed(2) ?? '—'}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-bright)' }}>
                        {e.epsActual?.toFixed(2) ?? '—'}
                      </div>
                    </div>
                    {beat && <span className="tag tag-green" style={{ fontSize: 10 }}>Beat</span>}
                    {miss && <span className="tag tag-red" style={{ fontSize: 10 }}>Miss</span>}
                  </div>
                  {e.surprisePercent != null && (
                    <div style={{ fontSize: 10, color: e.surprisePercent > 0 ? 'var(--accent)' : 'var(--danger)', marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>
                      {e.surprisePercent > 0 ? '+' : ''}{(e.surprisePercent * 100).toFixed(1)}%
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Guidance History (Brave+Claude) */}
      {data.history.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.08em' }}>
            Guidances Annuelles
          </div>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-dim)' }}>Annee</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-dim)' }}>Metrique</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-dim)' }}>Guidance</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-dim)' }}>Resultat</th>
                <th style={{ textAlign: 'center', padding: '6px 8px', color: 'var(--text-dim)' }}>Beat?</th>
              </tr>
            </thead>
            <tbody>
              {data.history.map(g => (
                <tr key={g.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '6px 8px', fontFamily: 'JetBrains Mono, monospace' }}>{g.year}</td>
                  <td style={{ padding: '6px 8px' }}>{g.metric}</td>
                  <td style={{ padding: '6px 8px', fontFamily: 'JetBrains Mono, monospace' }}>
                    {g.guidanceLow && g.guidanceHigh ? `${g.guidanceLow} - ${g.guidanceHigh}` : g.guidanceValue ?? '—'}
                  </td>
                  <td style={{ padding: '6px 8px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                    {g.actualValue ?? '—'}
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                    {g.beat === true && <span className="tag tag-green">Beat</span>}
                    {g.beat === false && <span className="tag tag-red">Miss</span>}
                    {g.beat == null && <span style={{ color: 'var(--muted)' }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--muted)' }}>
        <span>
          Source: {data.source === 'database' ? 'Base + Yahoo' : data.source === 'yahoo' ? 'Yahoo Finance' : 'Aucune'}
        </span>
        {data.meta?.lastSearchedAt && (
          <span>Derniere recherche: {new Date(data.meta.lastSearchedAt).toLocaleDateString('fr-FR')}</span>
        )}
        <button
          onClick={handleForceRefresh}
          disabled={refreshing}
          className="btn btn-ghost"
          style={{ padding: '3px 10px', fontSize: 11, marginLeft: 'auto' }}
        >
          {refreshing ? 'Recherche...' : 'Forcer la mise a jour'}
        </button>
      </div>
    </div>
  )
}
