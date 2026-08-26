import type { ReactNode } from 'react'
import { ArrowUpRight, CheckCircle2, Sparkles } from 'lucide-react'
import { BrandLogo } from '../brand/BrandLogo'
import { useI18n } from '../../i18n/hooks'

interface AuthLayoutProps {
  children: ReactNode
  eyebrow: string
  title: string
  description: string
  topAction: ReactNode
}

function CareerVisual() {
  const { t } = useI18n()
  return (
    <section
      className="relative hidden min-h-screen overflow-hidden border-s border-[var(--color-border)] bg-[var(--color-surface-secondary)] lg:flex lg:items-center lg:justify-center lg:p-8 xl:p-12"
      aria-label={t('auth.visual.ariaLabel')}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[var(--color-blue-soft)] opacity-70 blur-3xl" />
        <div className="absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-[var(--color-green-soft)] opacity-60 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[760px]">
        <div className="mb-6 flex items-center gap-3 text-sm font-semibold text-[var(--color-text-secondary)]">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)]">
            <Sparkles className="h-4 w-4 text-[var(--color-blue)]" aria-hidden="true" />
          </span>
          {t('auth.visual.tagline')}
        </div>

        <div className="overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]">
          <div className="grid min-h-[570px] md:grid-cols-[0.9fr_1.1fr]">
            <div className="flex flex-col justify-center p-7 sm:p-9">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-blue-text)]">
                {t('auth.visual.kicker')}
              </p>
              <h2 className="mt-3 max-w-sm text-3xl font-semibold leading-tight tracking-tight text-[var(--color-text)] sm:text-[2.65rem]">
                {t('auth.visual.headline')}
              </h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-[var(--color-text-secondary)]">
                {t('auth.visual.body')}
              </p>

              <div className="mt-7 grid grid-cols-2 gap-3">
                <MiniSignal color="blue" label={t('auth.visual.signalTarget')} value="76%" />
                <MiniSignal color="green" label={t('auth.visual.signalResume')} value="88" />
                <MiniSignal color="yellow" label={t('auth.visual.signalInterview')} value="73" />
                <MiniSignal color="red" label={t('auth.visual.signalGaps')} value="3" />
              </div>

              <div className="mt-6 flex items-start gap-2 text-xs font-medium leading-5 text-[var(--color-text-secondary)]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-green)]" aria-hidden="true" />
                {t('auth.visual.footnote')}
              </div>
            </div>

            <div className="relative flex min-h-[420px] items-end justify-center overflow-hidden bg-[var(--color-surface-tertiary)] px-3 pt-8 sm:px-6">
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_28%,var(--color-blue-soft),transparent_42%),radial-gradient(circle_at_30%_78%,var(--color-green-soft),transparent_38%)] opacity-80"
                aria-hidden="true"
              />
              <img
                src="/brand/clario-career-professional.png"
                alt={t('auth.visual.imageAlt')}
                className="auth-career-image relative z-10 h-auto w-full max-w-[570px] object-contain object-bottom drop-shadow-[0_18px_28px_rgb(0_0_0/0.14)]"
                loading="eager"
              />
              <div className="absolute end-5 top-5 z-20 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-semibold text-[var(--color-text)] shadow-[var(--shadow-sm)]">
                <span className="me-2 inline-block h-2 w-2 rounded-full bg-[var(--color-blue)]" />
                {t('auth.visual.progress')}
              </div>
              <div className="absolute bottom-5 end-5 z-20 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-semibold text-[var(--color-text)] shadow-[var(--shadow-sm)]">
                <span className="me-2 inline-block h-2 w-2 rounded-full bg-[var(--color-green)]" />
                {t('auth.visual.match')}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between px-1 text-xs text-[var(--color-text-muted)]">
          <span>{t('auth.visual.brand')}</span>
          <span className="inline-flex items-center gap-1 font-medium text-[var(--color-blue-text)]">
            {t('auth.visual.cta')} <ArrowUpRight className="h-3.5 w-3.5 rtl:rotate-90" aria-hidden="true" />
          </span>
        </div>
      </div>
    </section>
  )
}

function MiniSignal({ color, label, value }: { color: 'blue' | 'green' | 'yellow' | 'red'; label: string; value: string }) {
  const colorClass = {
    blue: 'bg-[var(--color-blue)]',
    green: 'bg-[var(--color-green)]',
    yellow: 'bg-[var(--color-yellow)]',
    red: 'bg-[var(--color-red)]',
  }[color]

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-3">
      <div className={`mb-2 h-1.5 w-9 rounded-full ${colorClass}`} aria-hidden="true" />
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--color-text)]">{value}</p>
    </div>
  )
}

export function AuthLayout({ children, eyebrow, title, description, topAction }: AuthLayoutProps) {
  const { t } = useI18n()
  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <div className="min-h-screen lg:flex">
        <section className="flex w-full flex-col px-5 py-6 sm:px-8 lg:w-[44%] lg:max-w-[680px] lg:px-12 xl:px-16">
          <header className="flex items-center justify-between">
            <button type="button" className="flex items-center gap-2.5" aria-label={t('auth.goHome')}>
              <BrandLogo size="sm" />
              <span className="text-lg font-semibold tracking-tight">Clario</span>
            </button>
            <div className="text-sm">{topAction}</div>
          </header>

          <div className="flex flex-1 items-center py-10 lg:py-12">
            <div className="mx-auto w-full max-w-[430px]">
              <div className="mb-7">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-blue-text)]">{eyebrow}</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
                <p className="mt-3 max-w-md text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p>
              </div>

              <div>{children}</div>
            </div>
          </div>

          <p className="text-xs text-[var(--color-text-muted)]">© {new Date().getFullYear()} Clario · Career Intelligence</p>
        </section>

        <CareerVisual />
      </div>
    </main>
  )
}
