'use client'

// ScoreGauge
export function ScoreGauge({ score, size = 48 }: { score: number; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 70 ? 'var(--accent)' : score >= 50 ? 'var(--warning)' : 'var(--danger)'
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth="3"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="3"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          className="score-ring" style={{ filter: `drop-shadow(0 0 4px ${color}40)` }}/>
      </svg>
      <span style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
        fontSize: size < 44 ? 9 : 11, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color }}>
        {score}
      </span>
    </div>
  )
}

// CategoryBadge
const CAT_CONFIG: Record<string, { cls: string; short: string }> = {
  'Deep Value': { cls: 'tag-blue', short: 'Deep Value' },
  'Quality Value': { cls: 'tag-green', short: 'Quality Value' },
  'Reasonably Valued Compounder': { cls: 'tag-gold', short: 'Compounder' },
  'Potential Value Trap': { cls: 'tag-red', short: 'Value Trap' },
}
export function CategoryBadge({ category }: { category: string }) {
  const cfg = CAT_CONFIG[category] || { cls: 'tag-gray', short: category }
  return <span className={`tag ${cfg.cls}`}>{cfg.short}</span>
}

// GuidanceBadge
export function GuidanceBadge({ score }: { score: number | null }) {
  if (!score) return <span className="tag tag-gray">N/D</span>
  const cfg = score >= 4 ? { cls: 'tag-green', label: `${score}/5 ★` }
    : score === 3 ? { cls: 'tag-yellow', label: `${score}/5` }
    : { cls: 'tag-red', label: `${score}/5` }
  return <span className={`tag ${cfg.cls}`}>{cfg.label}</span>
}

// TrendIndicator
export function TrendIndicator({ history }: { history: { date: string; close: number }[] }) {
  if (!history || history.length < 2) return <span className="tag tag-gray">—</span>
  const first = history[0].close; const last = history[history.length - 1].close
  const pct = ((last - first) / first) * 100
  if (pct > 2) return <span className="tag tag-green mono">▲ {pct.toFixed(1)}%</span>
  if (pct < -2) return <span className="tag tag-red mono">▼ {Math.abs(pct).toFixed(1)}%</span>
  return <span className="tag tag-gray mono">◆ {pct.toFixed(1)}%</span>
}
