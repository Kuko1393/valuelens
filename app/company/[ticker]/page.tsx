'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, RefreshCw, TrendingUp, DollarSign, BarChart2, Target, Star } from 'lucide-react'
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ReferenceDot
} from 'recharts'
import ScoreGauge from '@/components/ScoreGauge'
import CategoryBadge from '@/components/CategoryBadge'

type Tab = 'overview' | 'valuation' | 'financials' | 'score'

function fmt(n: number | null, dec = 1, prefix = '', suffix = '') {
  if (n == null) return '—'
  return `${prefix}${n.toFixed(dec)}${suffix}`
}
function fmtB(n: number | null) {
  if (n == null) return '—'
  if (Math.abs(n) >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (Math.abs(n) >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`
  return `$${(n / 1e6).toFixed(0)}M`
}

const CHART_STYLE = { fontSize: 11, fill: '#9ca3af' }
const GRID_COLOR  = '#1e2332'
const LINE_THEME  = ['#3b82f6', '#10b981', '#f59e0b']

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-[#0a0e1a] border border-[#2d3748] rounded-lg p-4">
      <p className="text-xs text-[#6b7280] mb-1">{label}</p>
      <p className="text-lg font-bold font-mono text-white">{value}</p>
      {sub && <p className="text-xs text-[#9ca3af] mt-0.5">{sub}</p>}
    </div>
  )
}

// ── Price Chart 1Y ────────────────────────────────────────────────────────────
function PriceChart({ data, currentPrice, high52w, low52w, intrinsicValue }: {
  data: { date: string; close: number }[]
  currentPrice: number
  high52w: number | null
  low52w: number | null
  intrinsicValue: number | null
}) {
  const prices   = data.map(d => d.close)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const start    = prices[0]
  const end      = currentPrice
  const pctChange = ((end - start) / start) * 100
  const isUp      = pctChange >= 0
  const lineColor = isUp ? '#10b981' : '#ef4444'
  const gradientId = 'priceGrad'

  // Thin out data for performance: ~1 point every 2 days on mobile, keep all on desktop
  const thinned = data.filter((_, i) => i % 2 === 0 || i === data.length - 1)

  // X-axis: show month labels without too much density
  const labelSet = new Set<string>()
  const xTicks = thinned
    .filter(d => {
      const month = d.date.slice(0, 7)
      if (labelSet.has(month)) return false
      labelSet.add(month); return true
    })
    .map(d => d.date)

  const fmtDate  = (d: string) => {
    const [, m] = d.split('-')
    return ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m]
  }
  const fmtPrice = (v: number) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v.toFixed(0)

  // Y-axis domain with 5% padding
  const pad    = (maxPrice - minPrice) * 0.05
  const yMin   = minPrice - pad
  const yMax   = maxPrice + pad

  return (
    <div className="bg-[#141824] border border-[#2d3748] rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-[#6b7280] uppercase tracking-wider mb-0.5">Prix — 52 semaines</p>
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold font-mono text-white">
              {currentPrice >= 1000 ? currentPrice.toFixed(0) : currentPrice.toFixed(2)}
            </span>
            <span className={`text-sm font-semibold font-mono ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
              {isUp ? '+' : ''}{pctChange.toFixed(1)}% sur 1 an
            </span>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          {high52w && <div className="text-xs text-[#6b7280]">52W High <span className="text-white font-mono">{fmtPrice(high52w)}</span></div>}
          {low52w  && <div className="text-xs text-[#6b7280] mt-0.5">52W Low <span className="text-white font-mono">{fmtPrice(low52w)}</span></div>}
          {high52w && low52w && (
            <div className="mt-1 text-xs text-[#6b7280]">
              Distance du high: <span className={currentPrice / high52w > 0.9 ? 'text-emerald-400' : 'text-[#f59e0b]'} style={{ fontFamily: 'monospace' }}>
                {(((currentPrice - high52w) / high52w) * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={thinned} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"   stopColor={lineColor} stopOpacity={0.15} />
              <stop offset="95%"  stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2332" vertical={false} />
          <XAxis
            dataKey="date"
            ticks={xTicks}
            tickFormatter={fmtDate}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            domain={[yMin, yMax]}
            tickFormatter={fmtPrice}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            axisLine={false} tickLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={{ background: '#0f1420', border: '1px solid #2d3748', borderRadius: 8, padding: '8px 12px' }}
            labelStyle={{ color: '#9ca3af', fontSize: 11 }}
            itemStyle={{ color: '#e5e7eb', fontSize: 12 }}
            formatter={(v: any) => [Number(v).toFixed(2), 'Price']}
            labelFormatter={(d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' })}
          />
          {/* Intrinsic value reference line */}
          {intrinsicValue && intrinsicValue > yMin && intrinsicValue < yMax && (
            <ReferenceLine
              y={intrinsicValue}
              stroke="#a78bfa"
              strokeDasharray="5 3"
              label={{ value: `IV ${fmtPrice(intrinsicValue)}`, position: 'insideTopRight', fill: '#a78bfa', fontSize: 10 }}
            />
          )}
          <Area
            type="monotone"
            dataKey="close"
            stroke={lineColor}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, fill: lineColor, stroke: '#0f1420', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

interface Threshold { max: number; color: string; label: string }

function RatioCard({ label, formula, value, format, thresholds }: {
  label: string; formula: string; value: number
  format: (v: number) => string; thresholds: Threshold[]
}) {
  const t = thresholds.find(th => value <= th.max) ?? thresholds[thresholds.length - 1]
  const pct = Math.min(100, (value / (thresholds[thresholds.length - 2]?.max ?? 5)) * 100)

  return (
    <div className="bg-[#0a0e1a] border border-[#2d3748] rounded-xl p-4">
      <p className="text-xs text-[#6b7280] mb-0.5">{label}</p>
      <p className="text-[10px] text-[#4b5563] mb-3">{formula}</p>
      <div className="flex items-end justify-between mb-2">
        <span className="text-2xl font-bold font-mono" style={{ color: t.color }}>{format(value)}</span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: t.color, background: `${t.color}18` }}>
          {t.label}
        </span>
      </div>
      <div className="h-1.5 bg-[#1e2332] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: t.color }} />
      </div>
    </div>
  )
}

export default function CompanyPage() {
  const { ticker } = useParams<{ ticker: string }>()
  const [data, setData]     = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(false)
  const [tab, setTab]       = useState<Tab>('overview')

  useEffect(() => {
    setLoading(true); setError(false)
    fetch(`/api/company/${ticker}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [ticker])

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-[#9ca3af]">
      <Loader2 className="w-5 h-5 animate-spin text-blue-400" /> Loading {ticker}…
    </div>
  )
  if (error || !data) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-[#9ca3af]">
      <p>Could not load data for <span className="font-mono font-bold text-white">{ticker}</span>.</p>
      <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm">← Back to screener</Link>
    </div>
  )

  // Chart data
  const years = ['FY-2', 'FY-1', 'FY']
  const revenueData  = data.revenue3Y?.map((v: number, i: number) => ({ year: years[i], value: v / 1e9 })) ?? []
  const ebitdaData   = data.ebitda3Y?.map((v: number, i: number) => ({ year: years[i], value: v / 1e9 })) ?? []
  const incomeData   = data.netIncome3Y?.map((v: number, i: number) => ({ year: years[i], value: v / 1e9 })) ?? []
  const fcfData      = data.freeCashFlow3Y?.map((v: number, i: number) => ({ year: years[i], value: v / 1e9 })) ?? []
  const earningsData = data.earningsHistory?.map((e: any) => ({
    period: e.period, estimate: e.epsEstimate, actual: e.epsActual
  })) ?? []

  // Derived balance sheet metrics
  const netDebt  = data.totalDebt != null && data.totalCash != null
    ? data.totalDebt - data.totalCash : null
  const bfr      = data.receivables != null || data.inventory != null || data.accountsPayable != null
    ? ((data.receivables ?? 0) + (data.inventory ?? 0) - (data.accountsPayable ?? 0)) : null
  const gearing  = netDebt != null && data.equity != null && data.equity > 0
    ? netDebt / data.equity : null
  const leverage = netDebt != null && data.ebitda != null && data.ebitda > 0
    ? netDebt / data.ebitda : null
  const dscr = data.shortTermDebt != null && data.ebitda != null && data.ebitda > 0
    ? data.shortTermDebt / data.ebitda : null

  // Currency label (USD for US stocks, local for European)
  const curr = data.exchange?.includes('Paris') || data.exchange?.includes('Frankfurt')
    || data.exchange?.includes('Amsterdam') ? '€' : '$'
  function fmtBs(v: number | null) {
    if (v == null) return '—'
    const abs = Math.abs(v)
    const sign = v < 0 ? '-' : ''
    if (abs >= 1e12) return `${sign}${curr}${(abs/1e12).toFixed(2)}T`
    if (abs >= 1e9)  return `${sign}${curr}${(abs/1e9).toFixed(2)}B`
    return `${sign}${curr}${(abs/1e6).toFixed(0)}M`
  }

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview',   label: 'Overview',   icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'valuation',  label: 'Valuation',  icon: <Target className="w-4 h-4" /> },
    { id: 'financials', label: 'Financials', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'score',      label: 'Score',      icon: <Star className="w-4 h-4" /> },
  ]

  const scoreBreakdown = [
    { label: 'Business Quality', value: data.score?.businessQuality ?? 0, max: 30 },
    { label: 'Financial Strength', value: data.score?.financialStrength ?? 0, max: 25 },
    { label: 'Valuation', value: data.score?.valuation ?? 0, max: 30 },
    { label: 'Long-Term Visibility', value: data.score?.longTermVisibility ?? 0, max: 15 },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#9ca3af] hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to screener
      </Link>

      {/* Hero */}
      <div className="bg-[#141824] border border-[#2d3748] rounded-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#0a0e1a] border border-[#2d3748] rounded-xl flex items-center justify-center">
              <span className="font-mono font-bold text-blue-400 text-sm">{ticker?.slice(0, 3)}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{data.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="font-mono text-[#9ca3af] text-sm">{ticker}</span>
                {data.exchange && <span className="text-[#6b7280] text-sm">· {data.exchange}</span>}
                {data.sector   && <span className="text-[#6b7280] text-sm">· {data.sector}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-3xl font-bold font-mono text-white">${data.price?.toFixed(2)}</p>
              <p className="text-sm text-[#9ca3af] mt-0.5">Current price</p>
            </div>
            <ScoreGauge score={data.score?.total ?? 0} size="lg" showLabel />
            <div className="hidden sm:block">
              <CategoryBadge category={data.category} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Price chart 1Y ── */}
      {data.priceHistory1Y && data.priceHistory1Y.length > 0 && (
        <PriceChart
          data={data.priceHistory1Y}
          currentPrice={data.price}
          high52w={data.high52w}
          low52w={data.low52w}
          intrinsicValue={data.intrinsicValue ?? null}
        />
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="P/E Ratio"        value={fmt(data.pe, 1, '', 'x')} />
        <KpiCard label="PEG Ratio"        value={fmt(data.peg, 2)} />
        <KpiCard label="EV / EBIT"        value={fmt(data.evEbit, 1, '', 'x')} />
        <KpiCard label="P / FCF"          value={fmt(data.pFcf, 1, '', 'x')} />
        <KpiCard label="Market Cap"       value={fmtB(data.marketCap)} />
        <KpiCard label="Margin of Safety" value={fmt(data.marginOfSafety, 1, '', '%')}
          sub={data.intrinsicValue ? `IV: $${data.intrinsicValue.toFixed(0)}` : undefined} />
      </div>

      {/* Tabs */}
      <div className="bg-[#141824] border border-[#2d3748] rounded-xl overflow-hidden">
        <div className="flex border-b border-[#2d3748] overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px
                ${tab === t.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-[#9ca3af] hover:text-white'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ── Overview ── */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard label="Gross Margin"     value={fmt(data.grossMargin, 1, '', '%')} />
                <KpiCard label="Operating Margin" value={fmt(data.operatingMargin, 1, '', '%')} />
                <KpiCard label="ROIC"             value={fmt(data.roic, 1, '', '%')} />
                <KpiCard label="FCF Yield"        value={fmt(data.fcfYield, 1, '', '%')} />
                <KpiCard label="Total Debt"       value={fmtB(data.totalDebt)} />
                <KpiCard label="Total Cash"       value={fmtB(data.totalCash)} />
                <KpiCard label="EBITDA"           value={fmtB(data.ebitda)} />
                <KpiCard label="Shares Out."      value={data.sharesOutstanding ? `${(data.sharesOutstanding / 1e9).toFixed(2)}B` : '—'} />
              </div>

              {earningsData.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4">EPS: Estimate vs Actual</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={earningsData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                      <XAxis dataKey="period" tick={CHART_STYLE} />
                      <YAxis tick={CHART_STYLE} />
                      <Tooltip
                        contentStyle={{ background: '#141824', border: '1px solid #2d3748', borderRadius: 8 }}
                        labelStyle={{ color: '#e5e7eb' }} itemStyle={{ color: '#9ca3af' }}
                      />
                      <Bar dataKey="estimate" name="Estimate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="actual"   name="Actual"   fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* ── Valuation ── */}
          {tab === 'valuation' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KpiCard label="Current Price"     value={`$${data.price?.toFixed(2)}`} />
                <KpiCard label="Intrinsic Value"   value={data.intrinsicValue ? `$${data.intrinsicValue.toFixed(2)}` : '—'}
                  sub="DCF / PE-based" />
                <KpiCard label="Margin of Safety"  value={fmt(data.marginOfSafety, 1, '', '%')}
                  sub={data.marginOfSafety > 0 ? 'Undervalued' : 'Overvalued'} />
              </div>

              {data.intrinsicValue && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4">Price vs Intrinsic Value</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={[
                      { name: 'Price', value: data.price, fill: '#3b82f6' },
                      { name: 'Intrinsic Value', value: data.intrinsicValue, fill: '#10b981' },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                      <XAxis dataKey="name" tick={CHART_STYLE} />
                      <YAxis tick={CHART_STYLE} tickFormatter={v => `$${v}`} />
                      <Tooltip
                        contentStyle={{ background: '#141824', border: '1px solid #2d3748', borderRadius: 8 }}
                        formatter={(v: any) => [`$${Number(v).toFixed(2)}`]}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {[{ fill: '#3b82f6' }, { fill: '#10b981' }].map((entry, i) => (
                          <rect key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="bg-[#0a0e1a] border border-[#2d3748] rounded-lg p-4 text-sm text-[#9ca3af] space-y-2">
                <p className="font-medium text-white">Valuation methodology</p>
                <p>Intrinsic value is estimated using a DCF model when FCF/share is available, or a PE-based formula otherwise.</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>DCF: 10-year projection, 7% growth, 10% discount, 2.5% terminal</li>
                  <li>PE-based: <code className="font-mono bg-[#1e2332] px-1 rounded">min(PE, 25) × PE × 0.8</code></li>
                </ul>
              </div>
            </div>
          )}

          {/* ── Financials ── */}
          {tab === 'financials' && (
            <div className="space-y-8">

              {/* ── Compte de résultat ── */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                  Compte de résultat — 3 exercices
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Chiffre d'affaires */}
                  {revenueData.length > 0 && (
                    <div className="bg-[#0a0e1a] border border-[#2d3748] rounded-xl p-4">
                      <p className="text-xs text-[#6b7280] mb-3">Chiffre d'affaires</p>
                      <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={revenueData} barSize={32}>
                          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                          <XAxis dataKey="year" tick={CHART_STYLE} axisLine={false} tickLine={false} />
                          <YAxis tick={CHART_STYLE} tickFormatter={v => `${v.toFixed(0)}B`} width={36} />
                          <Tooltip contentStyle={{ background: '#141824', border: '1px solid #2d3748', borderRadius: 8 }}
                            formatter={(v: any) => [`${Number(v).toFixed(1)}B`]} cursor={{ fill: '#1e2332' }} />
                          <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  {/* EBITDA */}
                  {ebitdaData.length > 0 && (
                    <div className="bg-[#0a0e1a] border border-[#2d3748] rounded-xl p-4">
                      <p className="text-xs text-[#6b7280] mb-3">EBITDA <span className="text-[#4b5563]">(EBIT + D&A)</span></p>
                      <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={ebitdaData} barSize={32}>
                          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                          <XAxis dataKey="year" tick={CHART_STYLE} axisLine={false} tickLine={false} />
                          <YAxis tick={CHART_STYLE} tickFormatter={v => `${v.toFixed(0)}B`} width={36} />
                          <Tooltip contentStyle={{ background: '#141824', border: '1px solid #2d3748', borderRadius: 8 }}
                            formatter={(v: any) => [`${Number(v).toFixed(1)}B`]} cursor={{ fill: '#1e2332' }} />
                          <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  {/* FCF */}
                  {fcfData.length > 0 && fcfData.some((d: any) => d.value !== 0) && (
                    <div className="bg-[#0a0e1a] border border-[#2d3748] rounded-xl p-4">
                      <p className="text-xs text-[#6b7280] mb-3">Free Cash Flow</p>
                      <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={fcfData} barSize={32}>
                          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                          <XAxis dataKey="year" tick={CHART_STYLE} axisLine={false} tickLine={false} />
                          <YAxis tick={CHART_STYLE} tickFormatter={v => `${v.toFixed(0)}B`} width={36} />
                          <ReferenceLine y={0} stroke="#4b5563" />
                          <Tooltip contentStyle={{ background: '#141824', border: '1px solid #2d3748', borderRadius: 8 }}
                            formatter={(v: any) => [`${Number(v).toFixed(1)}B`]} cursor={{ fill: '#1e2332' }} />
                          <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]}
                            label={false}
                            // negative bars in red
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Bilan (balance sheet) ── */}
              {(data.equity != null || netDebt != null || data.totalDebt != null) && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
                    Données bilancielles — dernier exercice
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Capitaux propres', value: data.equity,   color: '#10b981', hint: 'Equity (book value × shares)' },
                      { label: 'Dette totale',      value: data.totalDebt, color: '#ef4444', hint: 'Short-term + Long-term debt' },
                      { label: 'Dette LT (estim.)', value: data.longTermDebt, color: '#f97316', hint: 'Long-term portion (approx.)' },
                      { label: 'Trésorerie',        value: data.totalCash, color: '#34d399', hint: 'Cash & equivalents' },
                      { label: 'Dette nette',       value: netDebt,       color: netDebt != null ? (netDebt <= 0 ? '#10b981' : '#ef4444') : '#6b7280', hint: 'Total Debt − Cash' },
                      { label: 'EBITDA',            value: data.ebitda,   color: '#a78bfa', hint: 'Trailing twelve months' },
                      ...(bfr != null ? [{ label: 'BFR', value: bfr, color: bfr > 0 ? '#f59e0b' : '#10b981', hint: 'Créances + Stocks − Fournisseurs' }] : []),
                      ...(data.ppe != null ? [{ label: 'Immo. corp.', value: data.ppe, color: '#60a5fa', hint: 'PP&E net' }] : []),
                    ].map(({ label, value, color, hint }) => (
                      <div key={label} className="bg-[#0a0e1a] border border-[#2d3748] rounded-xl p-3">
                        <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-1">{label}</p>
                        <p className="text-sm font-bold font-mono" style={{ color: value != null ? color : '#6b7280' }}>
                          {fmtBs(value as number | null)}
                        </p>
                        <p className="text-[10px] text-[#4b5563] mt-0.5">{hint}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Ratios d'endettement ── */}
              {(gearing != null || leverage != null || dscr != null) && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
                    Ratios d'endettement
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Gearing */}
                    {gearing != null && (
                      <RatioCard
                        label="Gearing"
                        formula="Dette nette / Capitaux propres"
                        value={gearing}
                        format={v => `${v.toFixed(2)}x`}
                        thresholds={[
                          { max: 0.5,   color: '#10b981', label: 'Sain' },
                          { max: 1,     color: '#f59e0b', label: 'Modéré' },
                          { max: 2,     color: '#f97316', label: 'Élevé' },
                          { max: Infinity, color: '#ef4444', label: 'Très élevé' },
                        ]}
                      />
                    )}
                    {/* Leverage */}
                    {leverage != null && (
                      <RatioCard
                        label="Levier (Net Debt / EBITDA)"
                        formula="Dette nette / EBITDA"
                        value={leverage}
                        format={v => `${v.toFixed(2)}x`}
                        thresholds={[
                          { max: 1.5, color: '#10b981', label: 'Sain' },
                          { max: 3,   color: '#f59e0b', label: 'Acceptable' },
                          { max: 5,   color: '#f97316', label: 'Élevé' },
                          { max: Infinity, color: '#ef4444', label: 'Critique' },
                        ]}
                      />
                    )}
                    {/* DSCR */}
                    {dscr != null && (
                      <RatioCard
                        label="DSCR court terme"
                        formula="Dette CT / EBITDA"
                        value={dscr}
                        format={v => `${v.toFixed(2)}x`}
                        thresholds={[
                          { max: 0.3,  color: '#10b981', label: 'Très sain' },
                          { max: 0.75, color: '#f59e0b', label: 'Gérable' },
                          { max: 1.5,  color: '#f97316', label: 'Tendu' },
                          { max: Infinity, color: '#ef4444', label: 'Risqué' },
                        ]}
                      />
                    )}
                  </div>
                  <p className="text-xs text-[#4b5563] mt-3">
                    DSCR ici = Dette à moins d'un an / EBITDA (couverture court terme). Levier = Dette nette / EBITDA. Gearing = Dette nette / Capitaux propres.
                  </p>
                </div>
              )}

              {revenueData.length === 0 && ebitdaData.length === 0 && (
                <p className="text-center text-[#9ca3af] py-8">Données historiques non disponibles pour ce ticker.</p>
              )}
            </div>
          )}

          {/* ── Score ── */}
          {tab === 'score' && (
            <div className="space-y-6">
              <div className="flex items-center gap-6 flex-wrap">
                <ScoreGauge score={data.score?.total ?? 0} size="lg" showLabel label={`Total Score / 100`} />
                <div className="flex-1 space-y-1">
                  <p className="text-sm text-[#9ca3af]">Overall score out of 100 across 4 dimensions</p>
                  <CategoryBadge category={data.category} />
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {scoreBreakdown.map(s => (
                  <div key={s.label} className="flex flex-col items-center gap-2 bg-[#0a0e1a] border border-[#2d3748] rounded-xl p-4">
                    <ScoreGauge score={s.value} max={s.max} size="lg" showLabel label={s.label} />
                    <p className="text-xs text-[#6b7280]">{s.value} / {s.max}</p>
                  </div>
                ))}
              </div>

              <div className="bg-[#0a0e1a] border border-[#2d3748] rounded-lg p-4 text-sm text-[#9ca3af] space-y-2">
                <p className="font-medium text-white">Score methodology</p>
                <ul className="list-disc list-inside space-y-1 text-xs space-y-1">
                  <li><strong className="text-white">Business Quality (30pt)</strong>: ROIC, revenue growth, gross margin</li>
                  <li><strong className="text-white">Financial Strength (25pt)</strong>: Net debt / EBITDA, interest coverage</li>
                  <li><strong className="text-white">Valuation (30pt)</strong>: Margin of safety, FCF yield, P/E</li>
                  <li><strong className="text-white">Long-term Visibility (15pt)</strong>: Revenue consistency, ROIC, growth</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
