import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

export interface ErrorStateProps {
  title?: string
  description?: string
  action?: ReactNode
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We could not load this content. Please try again.',
  action,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center" role="alert">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-error-bg)] text-[var(--color-error-text)]">
        <AlertCircle className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold text-[var(--color-text)]">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
