import { useI18n } from '../../i18n/hooks'
import type { OpportunityComparisonPoint } from '../../api/analyticsTypes'

interface ComparisonChartProps {
  points: OpportunityComparisonPoint[]
  ariaLabel: string
}

export function ComparisonChart({ points, ariaLabel }: ComparisonChartProps) {
  const { t } = useI18n()
  const width = 760
  const height = 270
  const left = 40
  const right = 20
  const top = 20
  const bottom = 56
  const plotWidth = width - left - right
  const groupWidth = plotWidth / Math.max(points.length, 1)
  const barWidth = Math.min(28, groupWidth * 0.24)
  const y = (value: number) => top + ((100 - value) / 100) * (height - top - bottom)

  return (
    <div className="w-full overflow-x-auto" role="img" aria-label={ariaLabel}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto min-w-[560px] w-full">
        {[0, 25, 50, 75, 100].map((tick) => (
          <g key={tick}>
            <line x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} stroke="var(--color-border)" strokeDasharray="3 5" />
            <text x={10} y={y(tick) + 4} fontSize="10" fill="var(--color-text-muted)">{tick}</text>
          </g>
        ))}
        {points.map((point, index) => {
          const center = left + groupWidth * index + groupWidth / 2
          const fitX = center - barWidth - 3
          const alignmentX = center + 3
          return (
            <g key={point.label}>
              <rect x={fitX} y={y(point.opportunityFit)} width={barWidth} height={y(0) - y(point.opportunityFit)} rx="5" fill="var(--color-accent)" />
              <rect x={alignmentX} y={y(point.careerAlignment)} width={barWidth} height={y(0) - y(point.careerAlignment)} rx="5" fill="var(--color-text)" opacity="0.82" />
              <text x={center} y={height - 28} textAnchor="middle" fontSize="10" fill="var(--color-text-secondary)">{point.label}</text>
            </g>
          )
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-[var(--color-text-secondary)]">
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-[var(--color-accent)]" />{t('Opportunity Fit')}</span>
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-[var(--color-text)] opacity-80" />{t('Career Alignment')}</span>
      </div>
    </div>
  )
}
