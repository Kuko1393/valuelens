'use client'

import { useState, useEffect, useCallback } from 'react'

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
  metrics: {
    roic: number | null
    revenueCAGR3Y: number | null
    netDebtEbitda: number | null
    interestCoverage: number | null
    fcfYield: number | null
    guidanceScore: number | null
    marginOfSafety: number | null
    distanceFromATH: number | null
  } | null
  valuation: {
    pe: number | null
    peg: number | null
    evEbit: number | null
    pFcf: number | null
    intrinsicValue: number | null
  } | null
}

function formatNum(v: number | null | undefined, decimals = 1): string {
  if (v == null) return '—'
  return v.toFixed(decimals)
}

function formatMcap(v: number | null | undefined): string {
  if (v == null) return '—'
  if (v >= 1e12) return `${(v / 1e12).toFixed(1)}T`
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(0)}M`
  return v.toFixed(0)
}

function categoryColor(cat: string | null): string {
  switch (cat) {
    case 'Quality Value': return 'text-green-400'
    case 'Deep Value': return 'text-yellow-400'
    case 'Reasonably Valued Compounder': return 'text-blue-400'
    case 'Potential Value Trap': return 'text-red-400'
    default: return 'text-gray-400'
  }
}

function scoreColor(s: number | null): string {
  if (s == null) return 'text-gray-400'
  if (s >= 70) return 'text-green-400'
  if (s >= 50) return 'text-blue-400'
  if (s >= 30) return 'text-yellow-400'
  return 'text-red-400'
}

export default function Home() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sector, setSector] = useState('')
  const [category, setCategory] = useState('')
  const [sortBy, setSortBy] = useState('score')
  const [order, setOrder] = useState('desc')
  const [refreshStatus, setRefreshStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [refreshMsg, setRefreshMsg] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (sector) params.set('sector', sector)
      if (category) params.set('category', category)
      params.set('sortBy', sortBy)
      params.set('order', order)
      params.set('limit', '200')
      const res = await fetch(`/api/screener?${params}`)
      const data = await res.json()
      setCompanies(data.companies ?? [])
      setTotal(data.total ?? 0)
    } catch {
      setCompanies([])
    }
    setLoading(false)
  }, [sector, category, sortBy, order])

  useEffect(() => { fetchData() }, [fetchData])

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

  return (
    <main className="min-h-screen bg-primary text-white p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">ValueLens</h1>
            <p className="text-gray-400 text-sm mt-1">
              {total} entreprises &middot; Value Investing Screener
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshStatus === 'loading'}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                refreshStatus === 'loading'
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-accent hover:bg-blue-500 text-white cursor-pointer'
              }`}
            >
              {refreshStatus === 'loading' ? 'Mise a jour...' : 'Rafraichir les donnees'}
            </button>
            {refreshMsg && <span className="text-sm text-gray-400">{refreshMsg}</span>}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={sector}
            onChange={e => setSector(e.target.value)}
            className="bg-secondary border border-gray-700 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Tous les secteurs</option>
            {['Technology','Financial Services','Healthcare','Consumer Cyclical',
              'Consumer Defensive','Industrials','Energy','Basic Materials',
              'Real Estate','Utilities','Communication Services'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="bg-secondary border border-gray-700 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Toutes les categories</option>
            <option value="Quality Value">Quality Value</option>
            <option value="Deep Value">Deep Value</option>
            <option value="Reasonably Valued Compounder">Compounder</option>
            <option value="Potential Value Trap">Value Trap</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-gray-300 text-left">
              <tr>
                <th className="p-3 sticky left-0 bg-secondary z-10">Ticker</th>
                <th className="p-3">Nom</th>
                <th className="p-3">Secteur</th>
                <th className="p-3 cursor-pointer hover:text-white" onClick={() => toggleSort('score')}>
                  Score {sortBy === 'score' && (order === 'desc' ? '↓' : '↑')}
                </th>
                <th className="p-3">Categorie</th>
                <th className="p-3 cursor-pointer hover:text-white" onClick={() => toggleSort('currentPrice')}>
                  Prix {sortBy === 'currentPrice' && (order === 'desc' ? '↓' : '↑')}
                </th>
                <th className="p-3">ATH%</th>
                <th className="p-3 cursor-pointer hover:text-white" onClick={() => toggleSort('marketCap')}>
                  Mcap {sortBy === 'marketCap' && (order === 'desc' ? '↓' : '↑')}
                </th>
                <th className="p-3">ROIC%</th>
                <th className="p-3">P/E</th>
                <th className="p-3">FCF Yield%</th>
                <th className="p-3">MoS%</th>
                <th className="p-3">Guidance</th>
                <th className="p-3">ND/EBITDA</th>
                <th className="p-3">Int.Cov</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={15} className="p-8 text-center text-gray-400">Chargement...</td></tr>
              ) : companies.length === 0 ? (
                <tr><td colSpan={15} className="p-8 text-center text-gray-400">
                  Aucune donnee. Cliquez &quot;Rafraichir les donnees&quot; pour commencer.
                </td></tr>
              ) : companies.map(c => (
                <tr key={c.id} className="border-t border-gray-800 hover:bg-secondary/50 transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/company/${c.ticker}`}>
                  <td className="p-3 font-mono font-bold sticky left-0 bg-primary z-10">{c.ticker}</td>
                  <td className="p-3 max-w-[200px] truncate">{c.name}</td>
                  <td className="p-3 text-gray-400 text-xs">{c.sector ?? '—'}</td>
                  <td className={`p-3 font-bold ${scoreColor(c.score)}`}>
                    {c.score != null ? Math.round(c.score) : '—'}
                  </td>
                  <td className={`p-3 text-xs ${categoryColor(c.category)}`}>
                    {c.category ?? '—'}
                  </td>
                  <td className="p-3 font-mono">{c.currentPrice != null ? c.currentPrice.toFixed(2) : '—'}</td>
                  <td className={`p-3 ${(c.metrics?.distanceFromATH ?? 0) > -10 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatNum(c.metrics?.distanceFromATH)}
                  </td>
                  <td className="p-3 text-gray-300">{formatMcap(c.marketCap)}</td>
                  <td className="p-3">{formatNum(c.metrics?.roic)}</td>
                  <td className="p-3">{formatNum(c.valuation?.pe)}</td>
                  <td className="p-3">{formatNum(c.metrics?.fcfYield)}</td>
                  <td className={`p-3 ${(c.metrics?.marginOfSafety ?? 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatNum(c.metrics?.marginOfSafety)}
                  </td>
                  <td className="p-3">{c.metrics?.guidanceScore != null ? `${c.metrics.guidanceScore}/5` : '—'}</td>
                  <td className="p-3">{formatNum(c.metrics?.netDebtEbitda)}</td>
                  <td className="p-3">{formatNum(c.metrics?.interestCoverage, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
