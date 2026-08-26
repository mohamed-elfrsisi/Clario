import type { InputHTMLAttributes, ReactNode } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  leading?: ReactNode
}

export function Input({ label, hint, error, leading, id, className = '', ...props }: InputProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined)

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
          {label}
        </label>
      )}
      <div className="relative">
        {leading && (
          <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-[var(--color-text-muted)]">
            {leading}
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={hint || error ? `${inputId}-hint` : undefined}
          className={`min-h-11 w-full rounded-[var(--radius-md)] border bg-[var(--color-input-bg)] px-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-placeholder)] transition-colors focus:border-[var(--color-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] disabled:cursor-not-allowed disabled:bg-[var(--color-surface-secondary)] ${leading ? 'ps-9' : ''} ${error ? 'border-[var(--color-error)]' : 'border-[var(--color-input-border)]'} ${className}`}
          {...props}
        />
      </div>
      {(hint || error) && (
        <p id={`${inputId}-hint`} className={`mt-1.5 text-xs ${error ? 'text-[var(--color-error-text)]' : 'text-[var(--color-text-muted)]'}`}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}
