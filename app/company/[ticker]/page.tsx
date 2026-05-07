'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, RefreshCw, TrendingUp, DollarSign, BarChart2, Target, Star } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
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
  const incomeData   = data.netIncome3Y?.map((v: number, i: number) => ({ year: years[i], value: v / 1e9 })) ?? []
  const fcfData      = data.freeCashFlow3Y?.map((v: number, i: number) => ({ year: years[i], value: v / 1e9 })) ?? []
  const earningsData = data.earningsHistory?.map((e: any) => ({
    period: e.period, estimate: e.epsEstimate, actual: e.epsActual
  })) ?? []

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
              {revenueData.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4">Revenue ($B)</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                      <XAxis dataKey="year" tick={CHART_STYLE} />
                      <YAxis tick={CHART_STYLE} tickFormatter={v => `$${v.toFixed(0)}B`} />
                      <Tooltip contentStyle={{ background: '#141824', border: '1px solid #2d3748', borderRadius: 8 }}
                        formatter={(v: any) => [`$${Number(v).toFixed(1)}B`]} />
                      <Line type="monotone" dataKey="value" stroke={LINE_THEME[0]} strokeWidth={2} dot={{ r: 4, fill: LINE_THEME[0] }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {incomeData.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4">Net Income ($B)</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={incomeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                      <XAxis dataKey="year" tick={CHART_STYLE} />
                      <YAxis tick={CHART_STYLE} tickFormatter={v => `$${v.toFixed(0)}B`} />
                      <Tooltip contentStyle={{ background: '#141824', border: '1px solid #2d3748', borderRadius: 8 }}
                        formatter={(v: any) => [`$${Number(v).toFixed(1)}B`]} />
                      <Line type="monotone" dataKey="value" stroke={LINE_THEME[1]} strokeWidth={2} dot={{ r: 4, fill: LINE_THEME[1] }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {fcfData.length > 0 && fcfData.some((d: any) => d.value !== 0) && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4">Free Cash Flow ($B)</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={fcfData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                      <XAxis dataKey="year" tick={CHART_STYLE} />
                      <YAxis tick={CHART_STYLE} tickFormatter={v => `$${v.toFixed(0)}B`} />
                      <ReferenceLine y={0} stroke="#4b5563" />
                      <Tooltip contentStyle={{ background: '#141824', border: '1px solid #2d3748', borderRadius: 8 }}
                        formatter={(v: any) => [`$${Number(v).toFixed(1)}B`]} />
                      <Bar dataKey="value" name="FCF" fill={LINE_THEME[2]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {revenueData.length === 0 && incomeData.length === 0 && (
                <p className="text-center text-[#9ca3af] py-8">Historical financial data not available for this ticker.</p>
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
