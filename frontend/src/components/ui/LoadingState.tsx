import type { ReactNode } from 'react'

export interface LoadingStateProps {
  label?: string
  rows?: number
  className?: string
  children?: ReactNode
}

export function LoadingState({ label = 'Loading…', rows = 3, className = '', children }: LoadingStateProps) {
  return (
    <div className={`space-y-3 ${className}`} role="status" aria-live="polite">
      {children ?? Array.from({ length: rows }, (_, index) => (
        <div key={index} className="animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-tertiary)]" style={{ height: index === 0 ? 20 : 14, width: `${88 - index * 10}%` }} />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  )
}
