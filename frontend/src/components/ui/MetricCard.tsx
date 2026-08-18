import type { ReactNode } from 'react'

export interface MetricCardProps {
  label: string
  value: ReactNode
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: ReactNode
  description?: string
  accent?: 'blue' | 'green' | 'yellow' | 'red'
}

export function MetricCard({ label, value, change, trend = 'neutral', icon, description, accent = 'blue' }: MetricCardProps) {
  const trendClass =
    trend === 'up'
      ? 'text-[var(--color-success-text)]'
      : trend === 'down'
        ? 'text-[var(--color-error-text)]'
        : 'text-[var(--color-text-muted)]'

  const accentClass = {
    blue: 'bg-[var(--color-blue)]',
    green: 'bg-[var(--color-green)]',
    yellow: 'bg-[var(--color-yellow)]',
    red: 'bg-[var(--color-red)]',
  }[accent]

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-xs)]">
      <div className={`absolute inset-x-0 top-0 h-1 ${accentClass}`} aria-hidden="true" />
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
