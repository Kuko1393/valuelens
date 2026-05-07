'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Target, TrendingUp, AlertTriangle, CheckCircle, XCircle,
  BarChart3, Zap, Loader2, RefreshCw, X, Star, Shield, Brain,
  ChevronRight, Plus
} from 'lucide-react'
import type { InvestmentIdea } from '@prisma/client'

// ── Types ─────────────────────────────────────────────────────────────────────

type ConvictionFilter = 'all' | 'Élevée' | 'Moyenne' | 'Faible'

// ── Helpers ───────────────────────────────────────────────────────────────────

const convictionStyle: Record<string, { text: string; bg: string; border: string }> = {
  'Élevée': { text: '#10b981', bg: '#052e16', border: '#065f46' },
  'Moyenne': { text: '#f59e0b', bg: '#1c1200', border: '#78350f' },
  'Faible':  { text: '#ef4444', bg: '#1c0010', border: '#7f1d1d' },
}

const valStyle: Record<string, string> = {
  'Décote probable':    '#10b981',
  'Valorisation neutre': '#f59e0b',
  'Valorisation élevée': '#ef4444',
  'Données insuffisantes': '#6b7280',
}

function pct(score: number, max: number) { return Math.round((score / max) * 100) }
function barColor(p: number) { return p >= 80 ? '#10b981' : p >= 50 ? '#f59e0b' : '#ef4444' }

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreBar({ label, score, max }: { label: string; score: number; max: number }) {
  const p = pct(score, max)
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-[#9ca3af]">{label}</span>
        <span className="text-xs font-mono font-semibold text-white">{score}/{max}</span>
      </div>
      <div className="h-1.5 bg-[#1e2332] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${p}%`, background: barColor(p) }} />
      </div>
    </div>
  )
}

function BulletList({ items, icon: Icon, color }: { items: string[]; icon: any; color: string }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-[#d1d5db]">
          <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color }} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function Section({ icon: Icon, title, children, accent = '#3b82f6' }: any) {
  return (
    <div>
      <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4" style={{ color: accent }} />
        {title}
      </h3>
      {children}
    </div>
  )
}

// ── Idea Card ─────────────────────────────────────────────────────────────────

function IdeaCard({ idea, onClick }: { idea: InvestmentIdea; onClick: () => void }) {
  const cv = convictionStyle[idea.convictionLevel] ?? convictionStyle['Faible']
  const totalPct = pct(idea.totalScore, 100)

  return (
    <button onClick={onClick} className="group w-full text-left bg-[#141824] border border-[#2d3748] rounded-xl p-5 hover:border-[#4b5563] transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-blue-400 text-base group-hover:text-blue-300 transition-colors">{idea.ticker}</span>
            <span className="text-xs px-2 py-0.5 rounded-full border font-medium"
              style={{ color: cv.text, background: cv.bg, borderColor: cv.border }}>
              {idea.convictionLevel}
            </span>
          </div>
          <p className="text-sm text-[#9ca3af] mt-0.5 truncate max-w-[220px]">{idea.company}</p>
          <p className="text-xs text-[#6b7280]">{idea.country} · {idea.sector}</p>
        </div>
        {/* Score circle */}
        <div className="flex flex-col items-end">
          <span className="text-3xl font-bold font-mono" style={{ color: barColor(totalPct) }}>
            {Math.round(idea.totalScore)}
          </span>
          <span className="text-xs text-[#6b7280]">/ 100</span>
        </div>
      </div>

      {/* Thesis excerpt */}
      <p className="text-xs text-[#9ca3af] line-clamp-2 mb-3 leading-relaxed">{idea.thesis}</p>

      {/* Valuation class */}
      <div className="flex items-center gap-1.5 mb-3">
        <BarChart3 className="w-3.5 h-3.5" style={{ color: valStyle[idea.valuationClass] ?? '#6b7280' }} />
        <span className="text-xs font-medium" style={{ color: valStyle[idea.valuationClass] ?? '#6b7280' }}>
          {idea.valuationClass}
        </span>
      </div>

      {/* Score bars mini */}
      <div className="grid grid-cols-3 gap-x-3 gap-y-2">
        <ScoreBar label="Décote"    score={idea.discountScore}        max={30} />
        <ScoreBar label="Catalyseur" score={idea.catalystScore}       max={25} />
        <ScoreBar label="Qualité"   score={idea.businessQualityScore} max={15} />
      </div>

      <div className="mt-3 flex items-center justify-end text-xs text-[#6b7280] group-hover:text-blue-400 transition-colors gap-1">
        Voir l'analyse complète <ChevronRight className="w-3 h-3" />
      </div>
    </button>
  )
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

function DetailModal({ idea, onClose }: { idea: InvestmentIdea; onClose: () => void }) {
  const cv = convictionStyle[idea.convictionLevel] ?? convictionStyle['Faible']
  const scrollRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={scrollRef} className="bg-[#0f1420] border border-[#2d3748] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Sticky header */}
        <div className="sticky top-0 bg-[#0f1420] border-b border-[#2d3748] px-6 py-4 flex items-start justify-between z-10">
          <div>
            <div className="flex items-center gap-3">
              <Link href={`/company/${idea.ticker}`}
                className="font-mono font-bold text-blue-400 hover:text-blue-300 text-xl transition-colors">
                {idea.ticker}
              </Link>
              <span className="text-xs px-2.5 py-1 rounded-full border font-semibold"
                style={{ color: cv.text, background: cv.bg, borderColor: cv.border }}>
                Conviction {idea.convictionLevel}
              </span>
            </div>
            <p className="text-[#9ca3af] text-sm mt-0.5">{idea.company} · {idea.country} · {idea.sector}</p>
          </div>
          <button onClick={onClose} className="text-[#6b7280] hover:text-white transition-colors mt-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-7">
          {/* Score overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#141824] border border-[#2d3748] rounded-xl p-4">
              <p className="text-xs text-[#6b7280] mb-1">Score Total</p>
              <p className="text-4xl font-bold font-mono" style={{ color: barColor(pct(idea.totalScore, 100)) }}>
                {Math.round(idea.totalScore)}<span className="text-lg text-[#6b7280]">/100</span>
              </p>
            </div>
            <div className="bg-[#141824] border border-[#2d3748] rounded-xl p-4">
              <p className="text-xs text-[#6b7280] mb-1">Conviction</p>
              <p className="text-xl font-bold" style={{ color: cv.text }}>{idea.convictionLevel}</p>
              <p className="text-xs text-[#9ca3af] mt-1 leading-relaxed">{idea.convictionReason}</p>
            </div>
          </div>

          {/* Metrics snapshot */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { label: 'P/E', value: idea.per != null ? `${idea.per.toFixed(1)}x` : '—' },
              { label: 'EV/EBIT', value: idea.evEbit != null ? `${idea.evEbit.toFixed(1)}x` : '—' },
              { label: 'FCF Yield', value: idea.fcfYield != null ? `${idea.fcfYield.toFixed(1)}%` : '—' },
              { label: 'Rev ↗ 3Y', value: idea.revGrowth3Y != null ? `${idea.revGrowth3Y > 0 ? '+' : ''}${idea.revGrowth3Y.toFixed(1)}%` : '—' },
              { label: 'Debt/EBITDA', value: idea.debtToEbitda != null ? `${idea.debtToEbitda.toFixed(1)}x` : '—' },
              { label: 'MoS', value: idea.marginOfSafety != null ? `${idea.marginOfSafety.toFixed(1)}%` : '—' },
            ].map(m => (
              <div key={m.label} className="bg-[#141824] border border-[#2d3748] rounded-lg p-3 text-center">
                <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-1">{m.label}</p>
                <p className="text-sm font-mono font-bold text-white">{m.value}</p>
              </div>
            ))}
          </div>

          {/* Thesis */}
          <Section icon={Target} title="Thèse d'Investissement">
            <p className="text-sm text-[#d1d5db] leading-relaxed">{idea.thesis}</p>
          </Section>

          {/* Catalysts */}
          <Section icon={Zap} title="Catalyseurs Potentiels" accent="#f59e0b">
            <BulletList items={idea.catalysts} icon={CheckCircle} color="#10b981" />
          </Section>

          {/* Valuation */}
          <Section icon={BarChart3} title="Analyse de Valorisation">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                style={{ color: valStyle[idea.valuationClass] ?? '#6b7280', background: '#1e2332' }}>
                {idea.valuationClass}
              </span>
            </div>
            <p className="text-sm text-[#d1d5db] leading-relaxed">{idea.valuation}</p>
          </Section>

          {/* Risks */}
          <Section icon={AlertTriangle} title="Risques Identifiés" accent="#ef4444">
            <BulletList items={idea.risks} icon={XCircle} color="#ef4444" />
          </Section>

          {/* Challenge section */}
          <div className="bg-[#120a0a] border border-[#7f1d1d]/40 rounded-xl p-5 space-y-5">
            <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
              <Brain className="w-5 h-5" /> Challenge de la Thèse
            </h3>

            {[
              { title: 'Hypothèses Implicites', items: idea.implicitAssumptions },
              { title: 'Points Faibles',        items: idea.weakPoints },
              { title: 'Risques Non Mentionnés',items: idea.hiddenRisks },
              { title: 'Arguments Marketing',   items: idea.marketingArgs },
            ].map(({ title, items }) => (
              <div key={title}>
                <p className="text-xs font-semibold text-red-300 mb-1.5">{title}</p>
                <ul className="space-y-1">
                  {items.map((item, i) => (
                    <li key={i} className="text-xs text-[#9ca3af] pl-3">· {item}</li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <p className="text-xs font-semibold text-red-300 mb-1.5">Pourquoi cette idée pourrait être mauvaise</p>
              <p className="text-sm text-[#9ca3af] leading-relaxed">{idea.whyBadIdea}</p>
            </div>
          </div>

          {/* Score detail */}
          <Section icon={Star} title="Score Détaillé" accent="#f59e0b">
            <div className="space-y-3">
              <ScoreBar label="Décote potentielle (/30)"    score={idea.discountScore}        max={30} />
              <ScoreBar label="Catalyseur identifiable (/25)" score={idea.catalystScore}      max={25} />
              <ScoreBar label="Qualité du business (/15)"   score={idea.businessQualityScore} max={15} />
              <ScoreBar label="Solidité de la thèse (/15)"  score={idea.thesisSolidityScore}  max={15} />
              <ScoreBar label="Accessibilité France (/10)"  score={idea.accessibilityScore}   max={10} />
              <ScoreBar label="Qualité de la source (/5)"   score={idea.sourceQualityScore}   max={5}  />
              <div className="pt-2 border-t border-[#2d3748] flex justify-between items-center">
                <span className="text-sm font-semibold text-white">Total</span>
                <span className="text-lg font-bold font-mono" style={{ color: barColor(pct(idea.totalScore, 100)) }}>
                  {Math.round(idea.totalScore)} / 100
                </span>
              </div>
            </div>
          </Section>

          <p className="text-xs text-[#6b7280] text-center">
            Analysé le {new Date(idea.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            {' · '}Propulsé par Claude (Anthropic) · Pas de conseil en investissement
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Analyze Trigger ───────────────────────────────────────────────────────────

function AnalyzeTicker({ onDone }: { onDone: () => void }) {
  const [ticker, setTicker] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const run = async () => {
    if (!ticker.trim()) return
    setLoading(true); setError('')
    try {
      const r = await fetch(`/api/ideas/analyze/${ticker.trim().toUpperCase()}`, { method: 'POST' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Error')
      setTicker('')
      onDone()
    } catch (e: any) {
      setError(e.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="flex gap-2 items-center">
      <input
        className="bg-[#141824] border border-[#2d3748] rounded-lg px-3 py-2 text-sm text-white placeholder-[#6b7280] focus:border-blue-500 focus:outline-none w-36"
        placeholder="AAPL, MC.PA…"
        value={ticker}
        onChange={e => setTicker(e.target.value.toUpperCase())}
        onKeyDown={e => e.key === 'Enter' && run()}
        disabled={loading}
      />
      <button onClick={run} disabled={loading || !ticker.trim()}
        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        {loading ? 'Analyse…' : 'Analyser'}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const FILTERS: { key: ConvictionFilter; label: string }[] = [
  { key: 'all',     label: 'Toutes' },
  { key: 'Élevée',  label: '🟢 Conviction Élevée' },
  { key: 'Moyenne', label: '🟡 Conviction Moyenne' },
  { key: 'Faible',  label: '🔴 Conviction Faible' },
]

export default function IdeasPage() {
  const [ideas, setIdeas]         = useState<InvestmentIdea[]>([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState<InvestmentIdea | null>(null)
  const [filter, setFilter]       = useState<ConvictionFilter>('all')

  const fetchIdeas = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/ideas/list')
      const d = await r.json()
      setIdeas(d.ideas ?? [])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchIdeas() }, [])

  const visible = filter === 'all' ? ideas : ideas.filter(i => i.convictionLevel === filter)

  const countFor = (k: ConvictionFilter) =>
    k === 'all' ? ideas.length : ideas.filter(i => i.convictionLevel === k).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Investment Ideas</h1>
          <p className="text-sm text-[#9ca3af] mt-1">
            {loading ? 'Chargement…' : `${ideas.length} analyses · propulsé par Claude`}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <AnalyzeTicker onDone={fetchIdeas} />
          <button onClick={fetchIdeas} title="Rafraîchir"
            className="p-2 bg-[#141824] border border-[#2d3748] rounded-lg text-[#6b7280] hover:text-white transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Conviction filters */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border
              ${filter === f.key
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-[#141824] border-[#2d3748] text-[#9ca3af] hover:text-white hover:border-[#4b5563]'}`}>
            {f.label}
            <span className={`text-xs px-1.5 rounded-full ${filter === f.key ? 'bg-blue-500 text-white' : 'bg-[#1e2332] text-[#6b7280]'}`}>
              {countFor(f.key)}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64 gap-3 text-[#9ca3af]">
          <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
          Chargement des analyses…
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-[#9ca3af]">
          <Brain className="w-12 h-12 text-[#2d3748]" />
          <div className="text-center">
            <p className="font-medium text-white">Aucune analyse pour l'instant</p>
            <p className="text-sm mt-1">
              Entrez un ticker ci-dessus et cliquez <strong className="text-white">Analyser</strong> pour générer
              une thèse d'investissement complète avec Claude.
            </p>
          </div>
          <p className="text-xs text-[#6b7280]">Exemples : AAPL · MC.PA · ASML.AS · NOVO-B.CO</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map(idea => (
            <IdeaCard key={idea.id} idea={idea} onClick={() => setSelected(idea)} />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && <DetailModal idea={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
