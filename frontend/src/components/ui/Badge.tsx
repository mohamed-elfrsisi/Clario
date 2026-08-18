import type { ReactNode } from 'react'

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'accent'

export interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  success: 'bg-[var(--color-success-bg)] text-[var(--color-success-text)] ring-[var(--color-success-border)]',
  warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] ring-[var(--color-warning-border)]',
  error: 'bg-[var(--color-error-bg)] text-[var(--color-error-text)] ring-[var(--color-error-border)]',
  info: 'bg-[var(--color-info-bg)] text-[var(--color-info-text)] ring-[var(--color-info-border)]',
  neutral: 'bg-[var(--color-neutral-bg)] text-[var(--color-text-secondary)] ring-[var(--color-border)]',
  accent: 'bg-[var(--color-accent-soft)] text-[var(--color-accent-text)] ring-[var(--color-accent-border)]',
}

export function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium leading-none ring-1 ring-inset ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
