import type { ReactNode } from 'react'

export interface MetricCardProps {
  label: string
  value: ReactNode
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: ReactNode
  description?: string
}

export function MetricCard({ label, value, change, trend = 'neutral', icon, description }: MetricCardProps) {
  const trendClass =
    trend === 'up'
      ? 'text-[var(--color-success-text)]'
      : trend === 'down'
        ? 'text-[var(--color-error-text)]'
        : 'text-[var(--color-text-muted)]'

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-xs)]">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">{label}</p>
        {icon && <div className="text-[var(--color-accent-text)]">{icon}</div>}
      </div>
      <div className="mt-3 flex items-end gap-2">
        <p className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">{value}</p>
        {change && <span className={`pb-0.5 text-xs font-medium ${trendClass}`}>{change}</span>}
      </div>
      {description && <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">{description}</p>}
    </div>
  )
}
