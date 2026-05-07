'use client'

interface Props {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  max?: number
  label?: string
}

const sizes = {
  sm: { r: 18, stroke: 4, font: 'text-xs', wrap: 'w-10 h-10' },
  md: { r: 28, stroke: 5, font: 'text-sm', wrap: 'w-16 h-16' },
  lg: { r: 44, stroke: 6, font: 'text-base', wrap: 'w-24 h-24' },
}

function scoreColor(score: number, max: number) {
  const pct = score / max
  if (pct >= 0.8) return '#10b981'
  if (pct >= 0.6) return '#f59e0b'
  if (pct >= 0.4) return '#fb923c'
  return '#ef4444'
}

export default function ScoreGauge({ score, size = 'md', showLabel = true, max = 100, label }: Props) {
  const { r, stroke, font, wrap } = sizes[size]
  const cx = r + stroke
  const cy = r + stroke
  const svgSize = (r + stroke) * 2
  const circumference = 2 * Math.PI * r
  const pct = Math.min(Math.max(score / max, 0), 1)
  const dash = pct * circumference
  const color = scoreColor(score, max)

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`relative ${wrap} flex items-center justify-center`}>
        <svg width={svgSize} height={svgSize} className="-rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e2332" strokeWidth={stroke} />
          <circle
            cx={cx} cy={cy} r={r} fill="none"
            stroke={color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        </svg>
        <span className={`absolute ${font} font-bold mono`} style={{ color }}>
          {Math.round(score)}
        </span>
      </div>
      {showLabel && label && (
        <span className="text-xs text-sub text-center leading-tight">{label}</span>
      )}
    </div>
  )
}
