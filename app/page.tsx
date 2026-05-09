'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, SlidersHorizontal, X, ChevronUp, ChevronDown, ChevronsUpDown, Loader2, RefreshCw } from 'lucide-react'
import ScoreGauge from '@/components/ScoreGauge'
import CategoryBadge from '@/components/CategoryBadge'
import { SECTORS } from '@/config/tickers'
import type { ScreenerRow } from '@/app/api/screener/route'

type SortKey = keyof ScreenerRow
type SortDir = 'asc' | 'desc'

function fmtN(n: number | null, dec = 1, suffix = '') {
  if (n == null) return <span className="text-[#6b7280]">—</span>
  return <>{n.toFixed(dec)}{suffix}</>
}
function fmtCap(n: number | null) {
  if (n == null) return <span className="text-[#6b7280]">—</span>
  if (n >= 1e12) return <>{(n / 1e12).toFixed(1)}T</>
  if (n >= 1e9)  return <>{(n / 1e9).toFixed(1)}B</>
  return <>{(n / 1e6).toFixed(0)}M</>
}

const mosColor  = (v: number | null) => v == null ? '#6b7280' : v > 20 ? '#10b981' : v > 0 ? '#f59e0b' : '#ef4444'
const growColor = (v: number | null) => v == null ? '#6b7280' : v > 10 ? '#10b981' : v > 0 ? '#f59e0b' : '#ef4444'
const debtColor = (v: number | null) => v == null ? '#6b7280' : v < 1 ? '#10b981' : v < 3 ? '#f59e0b' : '#ef4444'

interface Filters { sector: string; minScore: number; maxPE: string; minMoS: string; category: string; q: string }
const DEFAULT: Filters = { sector: '', minScore: 0, maxPE: '', minMoS: '', category: '', q: '' }

export default function ScreenerPage() {
  const [companies, setCompanies] = useState<ScreenerRow[]>([])
  const [meta, setMeta]           = useState({ total: 0, cached: 0, universe: 0, sortBy: 'score', sortDir: 'desc' })
  const [loading, setLoading]     = useState(true)
  const [filters, setFilters]     = useState<Filters>(DEFAULT)
  const [applied, setApplied]     = useState<Filters>(DEFAULT)
  // sortKey / sortDir are sent to server — no client-side sort
  const [sortKey, setSortKey]     = useState<SortKey>('score')
  const [sortDir, setSortDir]     = useState<SortDir>('desc')
  const [drawer, setDrawer]       = useState(false)
  const [page, setPage]           = useState(1)

  // load is stable; all changing params are explicit arguments
  const load = useCallback(async (
    f: Filters, p: number, sk: SortKey, sd: SortDir
  ) => {
    setLoading(true)
    const ps = new URLSearchParams({ page: String(p), limit: '25', sortBy: sk, sortDir: sd })
    if (f.q)        ps.set('q', f.q)
    if (f.sector)   ps.set('sector', f.sector)
    if (f.minScore) ps.set('minScore', String(f.minScore))
    if (f.maxPE)    ps.set('maxPE', f.maxPE)
    if (f.minMoS)   ps.set('minMarginOfSafety', f.minMoS)
    if (f.category) ps.set('category', f.category)
    try {
      const r = await fetch(`/api/screener?${ps}`)
      const d = await r.json()
      setCompanies(d.companies ?? [])
      setMeta({ total: d.total ?? 0, cached: d.cached ?? 0, universe: d.universe ?? 0, sortBy: d.sortBy, sortDir: d.sortDir })
    } finally { setLoading(false) }
  }, [])

  // Re-fetch whenever filters, page, or sort changes — server handles everything
  useEffect(() => {
    load(applied, page, sortKey, sortDir)
  }, [applied, page, sortKey, sortDir, load])

  // Clicking a column header updates sort and resets to page 1
  const toggleSort = (k: SortKey) => {
    const newDir: SortDir = k === sortKey ? (sortDir === 'asc' ? 'desc' : 'asc') : 'desc'
    setSortKey(k)
    setSortDir(newDir)
    setPage(1)
  }

  const Th = ({ k, label, cls = '' }: { k: SortKey; label: string; cls?: string }) => (
    <th onClick={() => toggleSort(k)}
      className={`px-3 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider cursor-pointer select-none hover:text-white transition-colors whitespace-nowrap ${cls}`}>
      <span className="flex items-center gap-1">
        {label}
        {sortKey === k
          ? sortDir === 'asc'
            ? <ChevronUp className="w-3 h-3 text-blue-400" />
            : <ChevronDown className="w-3 h-3 text-blue-400" />
          : <ChevronsUpDown className="w-3 h-3 opacity-30" />}
      </span>
    </th>
  )

  const FilterPanel = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm flex items-center gap-2 text-white">
          <SlidersHorizontal className="w-4 h-4 text-blue-400" /> Filters
        </h2>
        <button onClick={() => setDrawer(false)} className="md:hidden text-[#6b7280] hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div>
        <label className="text-xs text-[#6b7280] mb-1 block">Ticker / Name</label>
        <input className="w-full bg-[#0a0e1a] border border-[#2d3748] rounded-md px-3 py-2 text-sm text-white placeholder-[#6b7280] focus:border-blue-500 focus:outline-none"
          placeholder="AAPL, Apple…"
          value={filters.q}
          onChange={e => setFilters(f => ({ ...f, q: e.target.value.toUpperCase() }))} />
      </div>

      <div>
        <label className="text-xs text-[#6b7280] mb-1 block">Sector</label>
        <select className="w-full bg-[#0a0e1a] border border-[#2d3748] rounded-md px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          value={filters.sector} onChange={e => setFilters(f => ({ ...f, sector: e.target.value }))}>
          <option value="">All sectors</option>
          {SECTORS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label className="text-xs text-[#6b7280] mb-1 block">
          Min score: <span className="text-white font-bold">{filters.minScore}</span>
        </label>
        <input type="range" min={0} max={100} step={5} className="w-full accent-blue-500"
          value={filters.minScore} onChange={e => setFilters(f => ({ ...f, minScore: Number(e.target.value) }))} />
        <div className="flex justify-between text-xs text-[#6b7280] mt-0.5"><span>0</span><span>100</span></div>
      </div>

      {[
        { label: 'Max P/E', key: 'maxPE', placeholder: 'e.g. 25' },
        { label: 'Min Margin of Safety (%)', key: 'minMoS', placeholder: 'e.g. 20' },
      ].map(({ label, key, placeholder }) => (
        <div key={key}>
          <label className="text-xs text-[#6b7280] mb-1 block">{label}</label>
          <input type="number" placeholder={placeholder}
            className="w-full bg-[#0a0e1a] border border-[#2d3748] rounded-md px-3 py-2 text-sm text-white placeholder-[#6b7280] focus:border-blue-500 focus:outline-none"
            value={(filters as any)[key]}
            onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))} />
        </div>
      ))}

      <div>
        <label className="text-xs text-[#6b7280] mb-1 block">Category</label>
        <select className="w-full bg-[#0a0e1a] border border-[#2d3748] rounded-md px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}>
          <option value="">All</option>
          {['Quality Value','Deep Value','Reasonably Valued Compounder','Potential Value Trap'].map(c =>
            <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <button onClick={() => { setPage(1); setApplied({ ...filters }); setDrawer(false) }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Apply filters
        </button>
        <button onClick={() => {
          setFilters(DEFAULT); setApplied(DEFAULT)
          setSortKey('score'); setSortDir('desc'); setPage(1)
        }}
          className="w-full bg-[#1e2332] hover:bg-[#2d3748] text-[#9ca3af] px-4 py-2 rounded-lg text-sm transition-colors">
          Reset all
        </button>
      </div>
    </div>
  )

  const SORT_LABELS: Partial<Record<SortKey, string>> = {
    score: 'score', pe: 'P/E', marginOfSafety: 'MoS', roic: 'ROIC',
    revGrowth3Y: 'rev growth', grossMargin: 'gross margin',
    fcfYield: 'FCF yield', marketCap: 'market cap', price: 'price',
    debtToEbitda: 'debt/EBITDA', ticker: 'ticker', name: 'name',
  }

  return (
    <div className="flex gap-5">
      {/* Sidebar desktop */}
      <aside className="hidden md:block w-56 flex-shrink-0">
        <div className="bg-[#141824] border border-[#2d3748] rounded-xl p-4 sticky top-20">
          <FilterPanel />
        </div>
      </aside>

      {/* Drawer mobile */}
      {drawer && <>
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setDrawer(false)} />
        <aside className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-[#141824] border-r border-[#2d3748] p-5 overflow-y-auto md:hidden">
          <FilterPanel />
        </aside>
      </>}

      {/* Main */}
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold">Stock Screener</h1>
            <p className="text-xs text-[#6b7280] mt-0.5">
              {loading
                ? 'Loading…'
                : `${meta.total} results · ${meta.cached}/${meta.universe} in cache · ↕ ${SORT_LABELS[sortKey] ?? sortKey} ${sortDir}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6b7280]" />
              <input
                className="bg-[#141824] border border-[#2d3748] rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder-[#6b7280] focus:border-blue-500 focus:outline-none w-40"
                placeholder="Quick search…"
                value={filters.q}
                onChange={e => {
                  const v = e.target.value.toUpperCase()
                  setFilters(f => ({ ...f, q: v }))
                  setApplied(f => ({ ...f, q: v }))
                  setPage(1)
                }}
              />
            </div>
            <button onClick={() => load(applied, page, sortKey, sortDir)} title="Refresh"
              className="p-1.5 bg-[#141824] border border-[#2d3748] rounded-lg text-[#6b7280] hover:text-white transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => setDrawer(true)}
              className="md:hidden flex items-center gap-1.5 bg-[#141824] border border-[#2d3748] rounded-lg px-3 py-1.5 text-sm text-[#9ca3af] hover:text-white transition-colors">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
            </button>
          </div>
        </div>

        {/* Table — data comes pre-sorted from server, no client-side sort */}
        <div className="bg-[#141824] border border-[#2d3748] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="bg-[#1e2332] border-b border-[#2d3748]">
                <tr>
                  <Th k="ticker"         label="Ticker" />
                  <Th k="name"           label="Company"      cls="min-w-[140px]" />
                  <Th k="sector"         label="Sector"       cls="hidden xl:table-cell" />
                  <Th k="price"          label="Price" />
                  <Th k="score"          label="Score" />
                  <Th k="category"       label="Category"     cls="hidden lg:table-cell" />
                  <Th k="marginOfSafety" label="MoS %" />
                  <Th k="roic"           label="ROIC %" />
                  <Th k="fcfYield"       label="FCF Yld" />
                  <Th k="pe"             label="P/E" />
                  <Th k="revGrowth3Y"    label="Rev ↗ 3Y"    cls="hidden lg:table-cell" />
                  <Th k="debtToEbitda"   label="Debt/EBITDA"  cls="hidden xl:table-cell" />
                  <Th k="marketCap"      label="Mkt Cap"      cls="hidden xl:table-cell" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2332]">
                {loading && companies.length === 0 ? (
                  <tr><td colSpan={15} className="py-14 text-center text-[#9ca3af]">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-400" />
                    Fetching financial data…
                  </td></tr>
                ) : companies.length === 0 ? (
                  <tr><td colSpan={15} className="py-10 text-center text-[#9ca3af]">No results match your filters.</td></tr>
                ) : companies.map(co => (
                  <tr key={co.ticker} className={`hover:bg-[#1e2332] transition-colors ${loading ? 'opacity-60' : ''}`}>
                    <td className="px-3 py-2.5">
                      <Link href={`/company/${co.ticker}`}
                        className="font-mono font-bold text-blue-400 hover:text-blue-300 transition-colors text-sm">
                        {co.ticker}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-white max-w-[160px] truncate text-sm">{co.name}</td>
                    <td className="px-3 py-2.5 text-[#9ca3af] text-xs hidden xl:table-cell max-w-[120px] truncate">{co.sector ?? '—'}</td>
                    <td className="px-3 py-2.5 font-mono text-white text-sm">${co.price.toFixed(2)}</td>
                    <td className="px-3 py-2.5"><ScoreGauge score={co.score} size="sm" showLabel={false} /></td>
                    <td className="px-3 py-2.5 hidden lg:table-cell"><CategoryBadge category={co.category} compact /></td>
                    <td className="px-3 py-2.5 font-mono text-xs font-medium" style={{ color: mosColor(co.marginOfSafety) }}>
                      {co.marginOfSafety != null ? `${co.marginOfSafety > 0 ? '+' : ''}${co.marginOfSafety.toFixed(1)}%` : <span className="text-[#6b7280]">—</span>}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs" style={{ color: co.roic != null ? (co.roic > 20 ? '#10b981' : co.roic > 10 ? '#f59e0b' : '#9ca3af') : '#6b7280' }}>
                      {fmtN(co.roic, 1, '%')}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[#9ca3af] text-xs">{fmtN(co.fcfYield, 1, '%')}</td>
                    <td className="px-3 py-2.5 font-mono text-[#9ca3af] text-xs">{fmtN(co.pe, 1, 'x')}</td>
                    <td className="px-3 py-2.5 font-mono text-xs hidden lg:table-cell" style={{ color: growColor(co.revGrowth3Y) }}>
                      {co.revGrowth3Y != null ? `${co.revGrowth3Y > 0 ? '+' : ''}${co.revGrowth3Y.toFixed(1)}%` : <span className="text-[#6b7280]">—</span>}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs hidden xl:table-cell" style={{ color: debtColor(co.debtToEbitda) }}>
                      {fmtN(co.debtToEbitda, 2, 'x')}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[#9ca3af] text-xs hidden xl:table-cell">{fmtCap(co.marketCap)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination — uses server total so it's always accurate */}
          {meta.total > 25 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#2d3748] text-xs text-[#9ca3af]">
              <span>
                Page {page} of {Math.ceil(meta.total / 25)} · {meta.total} results
              </span>
              <div className="flex gap-2">
                <button disabled={page === 1 || loading} onClick={() => setPage(1)}
                  className="px-2 py-1 bg-[#1e2332] rounded-md disabled:opacity-30 hover:text-white transition-colors">«</button>
                <button disabled={page === 1 || loading} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 bg-[#1e2332] rounded-md disabled:opacity-30 hover:text-white transition-colors">← Prev</button>
                <button disabled={page * 25 >= meta.total || loading} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 bg-[#1e2332] rounded-md disabled:opacity-30 hover:text-white transition-colors">Next →</button>
                <button disabled={page * 25 >= meta.total || loading} onClick={() => setPage(Math.ceil(meta.total / 25))}
                  className="px-2 py-1 bg-[#1e2332] rounded-md disabled:opacity-30 hover:text-white transition-colors">»</button>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-[#6b7280] text-center">
          {meta.cached < meta.universe
            ? `Cache warming: ${meta.cached}/${meta.universe} companies · refresh to load more`
            : `All ${meta.universe} companies loaded from cache`}
          {' · '}Data cached 12h · Not financial advice
        </p>
      </div>
    </div>
  )
}
