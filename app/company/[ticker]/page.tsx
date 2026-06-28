'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ScoreGauge, CategoryBadge, GuidanceBadge } from '@/components/UI'
import { GuidancePanel } from '@/components/GuidancePanel'

function N({ v, d = 1, suffix = '' }: { v: number | null | undefined; d?: number; suffix?: string }) {
  if (v == null) return <span style={{ color: 'var(--muted)' }}>—</span>
  return <>{v.toFixed(d)}{suffix}</>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 20, marginBottom: 16 }}>
      <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: 'var(--text-bright)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{title}</h3>
      {children}
    </div>
  )
}

function MetricRow({ label, value, suffix = '', good }: { label: string; value: any; suffix?: string; good?: boolean | null }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>{label}</span>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600, color: good === true ? 'var(--accent)' : good === false ? 'var(--danger)' : 'var(--text-bright)' }}>
        {value == null ? '—' : `${typeof value === 'number' ? value.toFixed(1) : value}${suffix}`}
      </span>
    </div>
  )
}

export default function CompanyPage() {
  const params = useParams()
  const ticker = (params.ticker as string)?.toUpperCase()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ticker) return
    fetch(`/api/company/${ticker}`)
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [ticker])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 120, marginBottom: 16 }} />)}
      </div>
    </div>
  )

  if (!data) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>404</div>
        <div>Entreprise non trouvee : {ticker}</div>
        <Link href="/" style={{ color: 'var(--accent)', marginTop: 12, display: 'inline-block' }}>Retour au screener</Link>
      </div>
    </div>
  )

  const score = data.score
  const dcf = data.dcfScenarios
  const cagr = data.revenue3Y && data.revenue3Y.length >= 2
    ? ((data.revenue3Y[0] / data.revenue3Y[data.revenue3Y.length - 1]) ** (1 / (data.revenue3Y.length - 1)) - 1) * 100
    : null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(6,10,18,.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 32, height: 56 }}>
        <Link href="/" style={{ textDecoration: 'none', fontWeight: 700, fontSize: 15, color: 'var(--text-bright)' }}>
          Value<span style={{ color: 'var(--accent)' }}>Lens</span>
        </Link>
        {[{ href: '/', label: 'Screener' }, { href: '/ideas', label: 'Opportunites' }, { href: '/watchlist', label: 'Watchlists' }].map(l => (
          <Link key={l.href} href={l.href} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500, textDecoration: 'none', color: 'var(--text-dim)' }}>{l.label}</Link>
        ))}
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
        {/* Header */}
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-bright)' }}>{data.name}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: 'var(--accent)' }}>{ticker}</span>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>{data.exchange}</span>
                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{data.sector}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 700, color: 'var(--text-bright)' }}>
                  {data.price?.toFixed(2) ?? '—'}
                </div>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>{data.currency}</span>
                {data.distanceFromATH != null && (
                  <span className={`tag ${data.distanceFromATH > -10 ? 'tag-green' : data.distanceFromATH > -30 ? 'tag-yellow' : 'tag-red'}`}>
                    ATH: {data.distanceFromATH.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              {score && <ScoreGauge score={score.total} size={64} />}
              <div>
                {data.category && <CategoryBadge category={data.category} />}
                <div style={{ marginTop: 6 }}><GuidanceBadge score={data.guidanceScore} /></div>
                {data.marginOfSafety != null && (
                  <div style={{ marginTop: 6 }}>
                    <span className={`tag ${data.marginOfSafety > 15 ? 'tag-green' : data.marginOfSafety > 0 ? 'tag-yellow' : 'tag-red'}`}>
                      MoS: {data.marginOfSafety > 0 ? '+' : ''}{data.marginOfSafety.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 16 }}>
          {/* Quality */}
          <Section title="Qualite Economique">
            <MetricRow label="ROIC" value={data.roic} suffix="%" good={data.roic != null ? data.roic > 15 : null} />
            <MetricRow label="Revenue CAGR 3Y" value={cagr} suffix="%" good={cagr != null ? cagr > 5 : null} />
            <MetricRow label="Revenue Growth YoY" value={data.revenueGrowthYoY} suffix="%" />
            <MetricRow label="Marge brute" value={data.grossMargin} suffix="%" good={data.grossMargin != null ? data.grossMargin > 40 : null} />
            <MetricRow label="Marge operationnelle" value={data.operatingMargin} suffix="%" />
            <MetricRow label="FCF/Action" value={data.fcfPerShare} />
            <MetricRow label="FCF Yield" value={data.fcfYield} suffix="%" good={data.fcfYield != null ? data.fcfYield > 5 : null} />
            <MetricRow label="CapEx Intensity" value={data.capexIntensity != null ? data.capexIntensity * 100 : null} suffix="%" />
            <MetricRow label="Accruals Ratio" value={data.accrualsRatio != null ? data.accrualsRatio * 100 : null} suffix="%" good={data.accrualsRatio != null ? data.accrualsRatio < 0 : null} />
            <MetricRow label="ROIIC" value={data.roiic} suffix="%" good={data.roiic != null ? data.roiic > 15 : null} />
          </Section>

          {/* Financial Strength */}
          <Section title="Solidite Financiere">
            <MetricRow label="Net Debt / EBITDA" value={(() => { if (!data.ebitda || data.ebitda <= 0) return null; return ((data.totalDebt ?? 0) - (data.totalCash ?? 0)) / data.ebitda })()}
              good={(() => { if (!data.ebitda || data.ebitda <= 0) return null; const nd = ((data.totalDebt ?? 0) - (data.totalCash ?? 0)) / data.ebitda; return nd < 2 })()}
            />
            <MetricRow label="Interest Coverage" value={data.interestCoverage === 999 ? 'No debt' : data.interestCoverage} good={data.interestCoverage != null ? data.interestCoverage > 5 : null} />
            <MetricRow label="Current Ratio" value={data.currentRatio} good={data.currentRatio != null ? data.currentRatio > 1.5 : null} />
            <MetricRow label="Quick Ratio" value={data.quickRatio} good={data.quickRatio != null ? data.quickRatio > 1 : null} />
            <MetricRow label="DSO" value={data.dso} suffix="j" />
            <MetricRow label="DPO" value={data.dpo} suffix="j" />
            <MetricRow label="Cash Conversion Cycle" value={data.cashConversionCycle} suffix="j" good={data.cashConversionCycle != null ? data.cashConversionCycle < 60 : null} />
          </Section>

          {/* Valuation */}
          <Section title="Valorisation">
            <MetricRow label="P/E" value={data.pe} />
            <MetricRow label="PEG" value={data.peg} good={data.peg != null ? data.peg < 1.5 : null} />
            <MetricRow label="EV/EBIT" value={data.evEbit} good={data.evEbit != null ? data.evEbit < 20 : null} />
            <MetricRow label="P/FCF" value={data.pFcf} good={data.pFcf != null ? data.pFcf < 20 : null} />
            <div style={{ borderTop: '2px solid var(--border)', marginTop: 10, paddingTop: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 8 }}>DCF 3 Scenarios</div>
              {dcf ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {(['bear', 'base', 'bull'] as const).map(scenario => {
                    const s = dcf[scenario]
                    return (
                      <div key={scenario} className="card" style={{ padding: 10, textAlign: 'center' }}>
                        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: scenario === 'bear' ? 'var(--danger)' : scenario === 'bull' ? 'var(--accent)' : 'var(--warning)', marginBottom: 4 }}>{scenario}</div>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 700, color: 'var(--text-bright)' }}>
                          {s.intrinsicValue?.toFixed(0) ?? '—'}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                          g={((s.growthRate ?? 0) * 100).toFixed(0)}% r={((s.discountRate ?? 0) * 100).toFixed(0)}%
                        </div>
                        {s.marginOfSafety != null && (
                          <div style={{ fontSize: 11, fontWeight: 600, color: s.marginOfSafety > 0 ? 'var(--accent)' : 'var(--danger)', marginTop: 2 }}>
                            MoS: {s.marginOfSafety > 0 ? '+' : ''}{s.marginOfSafety.toFixed(0)}%
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>Donnees insuffisantes pour le DCF</div>
              )}
            </div>
          </Section>

          {/* Score Breakdown */}
          <Section title="Decomposition du Score">
            {score && (
              <div>
                {[
                  { label: 'Business Quality', value: score.businessQuality, max: 30 },
                  { label: 'Financial Strength', value: score.financialStrength, max: 25 },
                  { label: 'Valuation', value: score.valuation, max: 30 },
                  { label: 'Long Term Visibility', value: score.longTermVisibility, max: 15 },
                ].map(dim => (
                  <div key={dim.label} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                      <span style={{ color: 'var(--text-dim)' }}>{dim.label}</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: 'var(--text-bright)' }}>{dim.value}/{dim.max}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(dim.value / dim.max) * 100}%`, background: dim.value / dim.max > 0.7 ? 'var(--accent)' : dim.value / dim.max > 0.4 ? 'var(--warning)' : 'var(--danger)', borderRadius: 3, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 8, fontSize: 14, fontWeight: 700 }}>
                  <span style={{ color: 'var(--text-dim)' }}>Total</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-bright)' }}>{score.total}/100</span>
                </div>
              </div>
            )}
          </Section>
        </div>

        {/* Guidance */}
        <Section title="Score de Guidance">
          <GuidancePanel ticker={ticker} />
        </Section>

        {/* Revenue & Financials */}
        {(data.revenue3Y || data.freeCashFlow3Y || data.netIncome3Y) && (
          <Section title="Evolution Financiere (3 ans)">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
              {data.revenue3Y && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6, fontWeight: 600 }}>Revenue</div>
                  {data.revenue3Y.map((r: number, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ flex: 1, height: 16, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(r / Math.max(...data.revenue3Y)) * 100}%`, background: 'var(--info)', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-bright)', minWidth: 60, textAlign: 'right' }}>
                        {(r / 1e9).toFixed(1)}B
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {data.freeCashFlow3Y && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6, fontWeight: 600 }}>Free Cash Flow</div>
                  {data.freeCashFlow3Y.map((r: number, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ flex: 1, height: 16, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(r / Math.max(...data.freeCashFlow3Y)) * 100}%`, background: 'var(--accent)', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-bright)', minWidth: 60, textAlign: 'right' }}>
                        {(r / 1e9).toFixed(1)}B
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {data.netIncome3Y && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6, fontWeight: 600 }}>Net Income</div>
                  {data.netIncome3Y.map((r: number, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ flex: 1, height: 16, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(r / Math.max(...data.netIncome3Y)) * 100}%`, background: 'var(--gold)', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-bright)', minWidth: 60, textAlign: 'right' }}>
                        {(r / 1e9).toFixed(1)}B
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}
