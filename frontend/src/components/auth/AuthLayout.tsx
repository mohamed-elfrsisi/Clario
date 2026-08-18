import type { ReactNode } from 'react'
import { ArrowUpRight, CheckCircle2, Sparkles } from 'lucide-react'
import { BrandLogo } from '../brand/BrandLogo'

interface AuthLayoutProps {
  children: ReactNode
  eyebrow: string
  title: string
  description: string
  topAction: ReactNode
}

function CareerVisual() {
  return (
    <div className="relative hidden min-h-screen overflow-hidden lg:flex lg:flex-1 lg:items-center lg:justify-center lg:bg-[var(--color-bg)] lg:p-8 xl:p-12">
      <div className="absolute inset-0 bg-[var(--color-bg)]" aria-hidden="true" />
      <div className="absolute right-10 top-16 h-24 w-24 rounded-full bg-[var(--color-yellow-soft)]" aria-hidden="true" />
      <div className="absolute bottom-12 left-10 h-28 w-28 rounded-full bg-[var(--color-blue-soft)]" aria-hidden="true" />
      <div className="absolute bottom-24 right-28 h-16 w-16 rounded-full bg-[var(--color-green-soft)]" aria-hidden="true" />

      <div className="relative w-full max-w-[620px]">
        <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)]">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)]">
            <Sparkles className="h-4 w-4 text-[var(--color-blue)]" />
          </span>
          Career intelligence, made clear.
        </div>

        <div className="relative overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]">
          <div className="flex h-1 w-full" aria-hidden="true">
            <span className="flex-1 bg-[var(--color-blue)]" />
            <span className="flex-1 bg-[var(--color-red)]" />
            <span className="flex-1 bg-[var(--color-yellow)]" />
            <span className="flex-1 bg-[var(--color-green)]" />
          </div>

          <div className="grid md:grid-cols-[1.02fr_0.98fr]">
            <div className="order-2 p-6 sm:p-8 md:order-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-blue-text)]">
                Your career, connected
              </p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-[var(--color-text)] sm:text-4xl">
                Know where you are. Know what comes next.
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-[var(--color-text-secondary)]">
                Clario connects your profile, target, resume and opportunities so every career decision has context.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <MiniSignal color="blue" label="Career target" value="76%" />
                <MiniSignal color="green" label="Resume quality" value="88" />
                <MiniSignal color="yellow" label="Interview readiness" value="73" />
                <MiniSignal color="red" label="Critical gaps" value="3" />
              </div>

              <div className="mt-6 flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)]">
                <CheckCircle2 className="h-4 w-4 text-[var(--color-green)]" />
                Built around evidence, not empty scores.
              </div>
            </div>

            <div className="order-1 min-h-[360px] overflow-hidden bg-[var(--color-surface-secondary)] md:order-2">
              <div className="relative h-full min-h-[360px]">
                <img
                  src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85"
                  alt="Professional working at a laptop in a modern workspace"
                  className="auth-photo h-full min-h-[360px] w-full object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" aria-hidden="true" />
                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-semibold text-[var(--color-text)] shadow-[var(--shadow-sm)] backdrop-blur-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-blue)]" />
                  Career progress
                </div>
                <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-semibold text-[var(--color-text)] shadow-[var(--shadow-sm)] backdrop-blur-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-green)]" />
                  Strong match
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between px-1 text-xs text-[var(--color-text-muted)]">
          <span>Clario Career Intelligence</span>
          <span className="inline-flex items-center gap-1 font-medium text-[var(--color-blue-text)]">
            Explore the workspace <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </div>
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
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-3">
      <div className={`mb-2 h-1.5 w-10 rounded-full ${colorClass}`} />
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--color-text)]">{value}</p>
    </div>
  )
}

export function AuthLayout({ children, eyebrow, title, description, topAction }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <div className="min-h-screen lg:flex">
        <section className="flex w-full flex-col px-5 py-6 sm:px-8 lg:w-[46%] lg:max-w-[680px] lg:px-12 xl:px-16">
          <header className="flex items-center justify-between">
            <button type="button" className="flex items-center gap-2.5" aria-label="Go to Clario home">
              <BrandLogo size="sm" />
              <span className="text-lg font-semibold tracking-tight">Clario</span>
            </button>
            <div className="text-sm">{topAction}</div>
          </header>

          <div className="flex flex-1 items-center py-10 lg:py-12">
            <div className="mx-auto w-full max-w-[440px]">
              <div className="mb-7">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-blue-text)]">{eyebrow}</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
                <p className="mt-2 max-w-md text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-1 overflow-hidden rounded-t-[var(--radius-xl)]" aria-hidden="true">
                  <span className="flex-1 bg-[var(--color-blue)]" />
                  <span className="flex-1 bg-[var(--color-green)]" />
                  <span className="flex-1 bg-[var(--color-yellow)]" />
                  <span className="flex-1 bg-[var(--color-red)]" />
                </div>
                {children}
              </div>
            </div>
          </div>

          <p className="text-xs text-[var(--color-text-muted)]">© {new Date().getFullYear()} Clario · Career Intelligence</p>
        </section>

        <CareerVisual />
      </div>
    </main>
  )
}
