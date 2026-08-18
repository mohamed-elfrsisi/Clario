import { ArrowLeft, Sparkles } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { pageDescriptions, pageTitles } from '../config/navigation'

export function ComingSoonPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const title = pageTitles[location.pathname] ?? 'Career Module'
  const description = pageDescriptions[location.pathname] ?? 'This career intelligence module is coming soon.'

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center">
      <div className="w-full rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-[var(--shadow-sm)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent-text)]">
          <Sparkles className="h-5 w-5" />
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent-text)]">
          Next phase
        </p>
        <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--color-text-secondary)]">
          {description}. The navigation and app shell are ready for this module without changing the existing functionality.
        </p>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--color-accent-contrast)] hover:bg-[var(--color-accent-hover)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </button>
      </div>
    </div>
  )
}
