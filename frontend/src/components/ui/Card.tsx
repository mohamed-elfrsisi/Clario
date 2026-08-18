import type { HTMLAttributes, ReactNode } from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: 'default' | 'subtle'
}

export function Card({ children, variant = 'default', className = '', ...props }: CardProps) {
  const surface =
    variant === 'subtle'
      ? 'bg-[var(--color-surface-secondary)]'
      : 'bg-[var(--color-surface)] shadow-[var(--shadow-sm)]'

  return (
    <div
      className={`rounded-[var(--radius-lg)] border border-[var(--color-border)] ${surface} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
