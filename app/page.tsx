'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

type Metrics = {
  roic: number | null
  revenueCAGR3Y: number | null
  netDebtEbitda: number | null
  interestCoverage: number | null
  fcfYield: number | null
  guidanceScore: number | null
  marginOfSafety: number | null
  distanceFromATH: number | null
  revenueGrowthYoY: number | null
}

type Company = {
  id: string
  ticker: string
  name: string
  sector: string | null
  exchange: string | null
  marketCap: number | null
  currentPrice: number | null
  score: number | null
  category: string | null
  metrics: Metrics | null
  valuation: { pe: number | null; peg: number | null; evEbit: number | null; pFcf: number | null; intrinsicValue: number | null } | null
}

function fmt(v: number | null | undefined, d = 1): string {
  if (v == null) return '—'
  return v.toFixed(d)
}

function fmtMcap(v: number | null | undefined): string {
  if (v == null) return '—'
  if (v >= 1e12) return `${(v / 1e12).toFixed(1)}T`
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(0)}M`
  return v.toFixed(0)
}

const SECTORS = ['Technology','Financial Services','Healthcare','Consumer Cyclical','Consumer Defensive','Industrials','Energy','Basic Materials','Real Estate','Utilities','Communication Services']
const CATEGORIES = ['Quality Value','Deep Value','Reasonably Valued Compounder','Potential Value Trap']
const PAGE_SIZE = 25

export default function Home() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sector, setSector] = useState('')
  const [category, setCategory] = useState('')
  const [sortBy, setSortBy] = useState('score')
  const [order, setOrder] = useState('desc')
  const [scoreMin, setScoreMin] = useState(0)
  const [roicMin, setRoicMin] = useState(0)
  const [refreshStatus, setRefreshStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [refreshMsg, setRefreshMsg] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (debouncedSearch.length >= 2) p.set('search', debouncedSearch)
      if (sector) p.set('sector', sector)
      if (category) p.set('category', category)
      if (scoreMin > 0) p.set('scoreMin', String(scoreMin))
      if (roicMin > 0) p.set('roicMin', String(roicMin))
      p.set('sortBy', sortBy)
      p.set('order', order)
      p.set('limit', String(PAGE_SIZE))
      p.set('offset', String(page * PAGE_SIZE))
      const res = await fetch(`/api/screener?${p}`)
      const data = await res.json()
      setCompanies(data.companies ?? [])
      setTotal(data.total ?? 0)
    } catch { setCompanies([]) }
    setLoading(false)
  }, [debouncedSearch, sector, category, sortBy, order, page, scoreMin, roicMin])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { setPage(0) }, [debouncedSearch, sector, category, scoreMin, roicMin])

  const handleRefresh = async () => {
    if (refreshStatus === 'loading') return
    setRefreshStatus('loading')
    setRefreshMsg('Mise a jour en cours...')
    try {
      const res = await fetch('/api/admin/refresh', { method: 'POST' })
      const data = await res.json()
      setRefreshStatus('done')
      setRefreshMsg(`${data.success}/${data.total} entreprises mises a jour`)
      fetchData()
      setTimeout(() => { setRefreshStatus('idle'); setRefreshMsg('') }, 5000)
    } catch {
      setRefreshStatus('error')
      setRefreshMsg('Erreur lors de la mise a jour')
      setTimeout(() => { setRefreshStatus('idle'); setRefreshMsg('') }, 3000)
    }
  }

  const toggleSort = (col: string) => {
    if (sortBy === col) setOrder(o => o === 'desc' ? 'asc' : 'desc')
    else { setSortBy(col); setOrder('desc') }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(6,10,18,.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 32, height: 56 }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-bright)' }}>Value<span style={{ color: 'var(--accent)' }}>Lens</span></span>
        {[{ href: '/', label: 'Screener' }, { href: '/ideas', label: 'Opportunites' }, { href: '/watchlist', label: 'Watchlists' }].map(l => (
          <Link key={l.href} href={l.href} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500, textDecoration: 'none', color: l.href === '/' ? 'var(--accent)' : 'var(--text-dim)', background: l.href === '/' ? 'var(--accent-dim)' : 'transparent' }}>{l.label}</Link>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={handleRefresh} disabled={refreshStatus === 'loading'} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}>
            {refreshStatus === 'loading' ? 'Mise a jour...' : 'Rafraichir'}
          </button>
          {refreshMsg && <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{refreshMsg}</span>}
        </div>
      </nav>

      <div style={{ maxWidth: 1500, margin: '0 auto', padding: '16px 24px', display: 'flex', gap: 16 }}>
        {/* Sidebar */}
        <aside style={{ width: 220, flexShrink: 0 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <input
                placeholder="Rechercher..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', fontSize: 12 }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>Secteur</label>
              <select value={sector} onChange={e => setSector(e.target.value)} style={{ width: '100%', fontSize: 12, marginTop: 4 }}>
                <option value="">Tous</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>Categorie</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', fontSize: 12, marginTop: 4 }}>
                <option value="">Toutes</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                Score min: {scoreMin}
              </label>
              <input type="range" min={0} max={90} step={5} value={scoreMin} onChange={e => setScoreMin(Number(e.target.value))}
                style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                ROIC min: {roicMin}%
              </label>
              <input type="range" min={0} max={50} step={5} value={roicMin} onChange={e => setRoicMin(Number(e.target.value))}
                style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 8 }}>
              {total} resultats
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="screener-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '10px 8px', position: 'sticky', left: 0, background: 'var(--card)', zIndex: 2 }}>Ticker</th>
                    <th style={{ padding: '10px 8px' }}>Nom</th>
                    <th style={{ padding: '10px 8px' }}>Secteur</th>
                    <th style={{ padding: '10px 8px' }} onClick={() => toggleSort('currentPrice')}>
                      Prix {sortBy === 'currentPrice' && (order === 'desc' ? '↓' : '↑')}
                    </th>
                    <th style={{ padding: '10px 8px' }}>ATH%</th>
                    <th style={{ padding: '10px 8px' }}>MoS%</th>
                    <th style={{ padding: '10px 8px' }} onClick={() => toggleSort('score')}>
                      Score {sortBy === 'score' && (order === 'desc' ? '↓' : '↑')}
                    </th>
                    <th style={{ padding: '10px 8px' }}>Guidance</th>
                    <th style={{ padding: '10px 8px' }}>Categorie</th>
                    <th style={{ padding: '10px 8px' }}>ROIC%</th>
                    <th style={{ padding: '10px 8px' }}>P/FCF</th>
                    <th style={{ padding: '10px 8px' }}>ND/EBITDA</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={12} style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Chargement...</td></tr>
                  ) : companies.length === 0 ? (
                    <tr><td colSpan={12} style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                      Aucun resultat. {total === 0 && 'Cliquez "Rafraichir" pour charger les donnees.'}
                    </td></tr>
                  ) : companies.map(c => {
                    const m = c.metrics
                    const v = c.valuation
                    return (
                      <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/company/${c.ticker}`}>
                        <td style={{ padding: '8px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--accent)', position: 'sticky', left: 0, background: 'var(--card)', zIndex: 1 }}>{c.ticker}</td>
                        <td style={{ padding: '8px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</td>
                        <td style={{ padding: '8px', color: 'var(--text-dim)', fontSize: 11 }}>{c.sector ?? '—'}</td>
                        <td style={{ padding: '8px', fontFamily: 'JetBrains Mono, monospace' }}>{c.currentPrice?.toFixed(2) ?? '—'}</td>
                        <td style={{ padding: '8px', fontFamily: 'JetBrains Mono, monospace', color: (m?.distanceFromATH ?? 0) > -10 ? 'var(--accent)' : 'var(--danger)' }}>{fmt(m?.distanceFromATH)}</td>
                        <td style={{ padding: '8px', fontFamily: 'JetBrains Mono, monospace', color: (m?.marginOfSafety ?? 0) > 0 ? 'var(--accent)' : 'var(--danger)' }}>{fmt(m?.marginOfSafety)}</td>
                        <td style={{ padding: '8px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: (c.score ?? 0) >= 70 ? 'var(--accent)' : (c.score ?? 0) >= 50 ? 'var(--warning)' : 'var(--danger)' }}>{c.score != null ? Math.round(c.score) : '—'}</td>
                        <td style={{ padding: '8px' }}>{m?.guidanceScore != null ? <span className={`tag ${m.guidanceScore >= 4 ? 'tag-green' : m.guidanceScore === 3 ? 'tag-yellow' : 'tag-red'}`}>{m.guidanceScore}/5</span> : <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                        <td style={{ padding: '8px' }}>{c.category ? <span className={`tag ${c.category === 'Quality Value' ? 'tag-green' : c.category === 'Deep Value' ? 'tag-blue' : c.category === 'Reasonably Valued Compounder' ? 'tag-gold' : 'tag-red'}`}>{c.category === 'Reasonably Valued Compounder' ? 'Compounder' : c.category}</span> : '—'}</td>
                        <td style={{ padding: '8px', fontFamily: 'JetBrains Mono, monospace', color: (m?.roic ?? 0) > 15 ? 'var(--accent)' : 'var(--text)' }}>{fmt(m?.roic)}</td>
                        <td style={{ padding: '8px', fontFamily: 'JetBrains Mono, monospace' }}>{fmt(v?.pFcf)}</td>
                        <td style={{ padding: '8px', fontFamily: 'JetBrains Mono, monospace', color: (m?.netDebtEbitda ?? 0) < 2 ? 'var(--accent)' : 'var(--danger)' }}>{fmt(m?.netDebtEbitda)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: 12 }}>
                  Precedent
                </button>
                <span style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'JetBrains Mono, monospace' }}>
                  Page {page + 1} / {totalPages}
                </span>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: 12 }}>
                  Suivant
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
