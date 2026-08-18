interface ProgressBarProps {
  value: number
  label?: string
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, value))

  return (
    <div>
      {label && (
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-[var(--color-text-secondary)]">{label}</span>
          <span className="font-semibold tabular-nums text-[var(--color-text)]">{safeValue}%</span>
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-secondary)]">
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-300"
          style={{ width: `${safeValue}%` }}
          role="progressbar"
          aria-valuenow={safeValue}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}
