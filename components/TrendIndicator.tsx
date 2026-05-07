import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function TrendIndicator({ trend }: { trend?: string | null }) {
  if (trend === 'up')   return <span className="flex items-center gap-1 text-emerald-400 text-xs"><TrendingUp className="w-3.5 h-3.5" />▲</span>
  if (trend === 'down') return <span className="flex items-center gap-1 text-red-400 text-xs"><TrendingDown className="w-3.5 h-3.5" />▼</span>
  return <span className="flex items-center gap-1 text-gray-500 text-xs"><Minus className="w-3.5 h-3.5" />─</span>
}
