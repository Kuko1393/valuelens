'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, TrendingUp, Flame, Zap, BarChart3, Star, ChevronRight } from 'lucide-react'
import ScoreGauge from '@/components/ScoreGauge'
import CategoryBadge from '@/components/CategoryBadge'
import type { Idea } from '@/app/api/ideas/route'

type Filter = 'all' | 'deep-value' | 'quality-drawdown' | 'fcf-machine' | 'growth-compressed' | 'compounder'

const SIGNAL_META: Record<string, { label: string; icon: React.ReactNode; accent: string; bg: string }> = {
  'deep-value':        { label: 'Deep Value',        icon: <TrendingUp className="w-4 h-4" />, accent: '#3b82f6', bg: '#1e3a5f' },
  'quality-drawdown':  { label: 'Quality on Sale',   icon: <Flame className="w-4 h-4" />,      accent: '#10b981', bg: '#052e16' },
  'fcf-machine':       { label: 'FCF Machine',        icon: <Zap className="w-4 h-4" />,        accent: '#f59e0b', bg: '#1c1200' },
  'growth-compressed': { label: 'Growth Undervalued', icon: <BarChart3 className="w-4 h-4" />,  accent: '#a855f7', bg: '#1a0a2e' },
  'compounder':        { label: 'Elite Compounder',   icon: <Star className="w-4 h-4" />,       accent: '#f43f5e', bg: '#1c0010' },
}

function MetricPill({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] text-[#6b7280] uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-mono font-semibold ${good === true ? 'text-emerald-400' : good === false ? 'text-red-400' : 'text-white'}`}>
        {value}
      </span>
    </div>
  )
}

function IdeaCard({ idea }: { idea: Idea }) {
  const meta = SIGNAL_META[idea.signalKey] ?? { label: idea.signal, icon: <Star className="w-4 h-4" />, accent: '#6b7280', bg: '#1e2332' }

  return (
    <Link href={`/company/${idea.ticker}`}
      className="group block bg-[#141824] border border-[#2d3748] rounded-xl p-5 hover:border-[#4b5563] hover:bg-[#1a2035] transition-all">
      {/* Signal badge */}
      <div className="flex items-center justify-between mb-4">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ color: meta.accent, background: meta.bg, border: `1px solid ${meta.accent}30` }}>
          {meta.icon}{meta.label}
        </span>
        <ScoreGauge score={idea.score} size="sm" showLabel={false} />
      </div>

      {/* Company */}
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <span className="font-mono font-bold text-blue-400 text-base group-hover:text-blue-300 transition-colors">
            {idea.ticker}
          </span>
          <span className="font-mono text-white text-sm">${idea.price.toFixed(2)}</span>
        </div>
        <p className="text-sm text-[#9ca3af] mt-0.5 truncate">{idea.name}</p>
      </div>

      {/* Reason */}
      <p className="text-xs text-[#9ca3af] mb-4 leading-relaxed">{idea.reason}</p>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#1e2332]">
        {idea.pe != null && (
          <MetricPill label="P/E" value={`${idea.pe.toFixed(1)}x`} good={idea.pe < 15} />
        )}
        {idea.marginOfSafety != null && (
          <MetricPill label="MoS" value={`${idea.marginOfSafety > 0 ? '+' : ''}${idea.marginOfSafety.toFixed(1)}%`}
            good={idea.marginOfSafety > 20} />
        )}
        {idea.roic != null && (
          <MetricPill label="ROIC" value={`${idea.roic.toFixed(1)}%`} good={idea.roic > 15} />
        )}
        {idea.fcfYield != null && (
          <MetricPill label="FCF Yld" value={`${idea.fcfYield.toFixed(1)}%`} good={idea.fcfYield > 6} />
        )}
        {idea.revGrowth3Y != null && (
          <MetricPill label="Rev ↗" value={`${idea.revGrowth3Y > 0 ? '+' : ''}${idea.revGrowth3Y.toFixed(1)}%`}
            good={idea.revGrowth3Y > 8} />
        )}
        <div className="flex flex-col">
          <span className="text-[10px] text-[#6b7280] uppercase tracking-wider">Category</span>
          <CategoryBadge category={idea.category} compact />
        </div>
      </div>

      {/* CTA */}
      <div className="mt-3 flex items-center justify-end text-xs text-[#6b7280] group-hover:text-blue-400 transition-colors gap-1">
        View analysis <ChevronRight className="w-3 h-3" />
      </div>
    </Link>
  )
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',               label: 'All Ideas' },
  { key: 'deep-value',        label: 'Deep Value' },
  { key: 'quality-drawdown',  label: 'Quality on Sale' },
  { key: 'fcf-machine',       label: 'FCF Machine' },
  { key: 'growth-compressed', label: 'Growth Undervalued' },
  { key: 'compounder',        label: 'Elite Compounder' },
]

export default function IdeasPage() {
  const [ideas, setIdeas]     = useState<Idea[]>([])
  const [counts, setCounts]   = useState<Record<string, number>>({})
  const [universeLoaded, setUniverseLoaded] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState<Filter>('all')

  useEffect(() => {
    fetch('/api/ideas')
      .then(r => r.json())
      .then(d => {
        setIdeas(d.ideas ?? [])
        setCounts(d.counts ?? {})
        setUniverseLoaded(d.universeLoaded ?? 0)
      })
      .finally(() => setLoading(false))
  }, [])

  const visible = filter === 'all' ? ideas : ideas.filter(i => i.signalKey === filter)

  const countFor = (k: Filter) => k === 'all' ? ideas.length : (counts[k] ?? 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Investment Ideas</h1>
        <p className="text-sm text-[#9ca3af] mt-1">
          {loading
            ? 'Scanning universe…'
            : `${ideas.length} opportunities detected · ${universeLoaded} companies analysed`}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(f => {
          const count = countFor(f.key)
          const meta  = SIGNAL_META[f.key]
          return (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all border
                ${filter === f.key
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-[#141824] border-[#2d3748] text-[#9ca3af] hover:text-white hover:border-[#4b5563]'}`}>
              {meta?.icon ?? null}
              {f.label}
              <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${filter === f.key ? 'bg-blue-500 text-white' : 'bg-[#1e2332] text-[#6b7280]'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64 gap-3 text-[#9ca3af]">
          <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
          Scanning {universeLoaded} companies for opportunities…
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-[#9ca3af]">
          <p>No opportunities detected yet.</p>
          <p className="text-xs text-[#6b7280]">
            {universeLoaded === 0
              ? 'Cache is empty — visit the Screener first to load data.'
              : 'Try visiting the Screener to load more companies.'}
          </p>
          <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm">Go to Screener →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map(idea => <IdeaCard key={idea.ticker} idea={idea} />)}
        </div>
      )}

      {universeLoaded > 0 && (
        <p className="text-xs text-[#6b7280] text-center">
          Based on {universeLoaded} cached companies · Data may be up to 12h old · Not financial advice
        </p>
      )}
    </div>
  )
}
