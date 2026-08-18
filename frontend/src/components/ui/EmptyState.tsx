import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent-text)]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold text-[var(--color-text)]">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
