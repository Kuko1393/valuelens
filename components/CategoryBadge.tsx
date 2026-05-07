type Category = 'Deep Value' | 'Quality Value' | 'Reasonably Valued Compounder' | 'Potential Value Trap'

const styles: Record<Category, string> = {
  'Quality Value':                 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/50',
  'Deep Value':                    'bg-blue-900/50 text-blue-400 border border-blue-700/50',
  'Reasonably Valued Compounder':  'bg-purple-900/50 text-purple-400 border border-purple-700/50',
  'Potential Value Trap':          'bg-red-900/50 text-red-400 border border-red-700/50',
}

const short: Record<Category, string> = {
  'Quality Value':                 'Quality Value',
  'Deep Value':                    'Deep Value',
  'Reasonably Valued Compounder':  'Compounder',
  'Potential Value Trap':          'Value Trap',
}

export default function CategoryBadge({ category, compact = false }: { category: string; compact?: boolean }) {
  const cat = category as Category
  const cls = styles[cat] ?? 'bg-gray-800 text-gray-400 border border-gray-700'
  const label = compact ? (short[cat] ?? category) : (cat ?? category)
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${cls}`}>
      {label}
    </span>
  )
}
