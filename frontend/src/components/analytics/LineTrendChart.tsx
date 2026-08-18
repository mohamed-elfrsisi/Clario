import type { AnalyticsPoint } from '../../api/analyticsTypes'

interface LineTrendChartProps {
  points: AnalyticsPoint[]
  ariaLabel: string
}

export function LineTrendChart({ points, ariaLabel }: LineTrendChartProps) {
  const width = 760
  const height = 220
  const padding = { top: 20, right: 24, bottom: 36, left: 34 }
  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom
  const min = 0
  const max = 100
  const x = (index: number) => padding.left + (index * innerWidth) / Math.max(points.length - 1, 1)
  const y = (value: number) => padding.top + ((max - value) / (max - min)) * innerHeight
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(point.value)}`).join(' ')

  return (
    <div className="w-full overflow-x-auto" role="img" aria-label={ariaLabel}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto min-w-[520px] w-full" preserveAspectRatio="none">
        {[0, 25, 50, 75, 100].map((tick) => (
          <g key={tick}>
            <line x1={padding.left} x2={width - padding.right} y1={y(tick)} y2={y(tick)} stroke="var(--color-border)" strokeDasharray="3 5" />
            <text x={8} y={y(tick) + 4} fontSize="10" fill="var(--color-text-muted)">{tick}</text>
          </g>
        ))}
        <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle cx={x(index)} cy={y(point.value)} r="4.5" fill="var(--color-surface)" stroke="var(--color-accent)" strokeWidth="3" />
            <text x={x(index)} y={height - 12} textAnchor="middle" fontSize="10" fill="var(--color-text-muted)">{point.label}</text>
            <text x={x(index)} y={y(point.value) - 10} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--color-text)">{point.value}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}
