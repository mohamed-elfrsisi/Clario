import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ArrowUpRight, BriefcaseBusiness, ChevronRight, CircleCheck, Target, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { MetricCard } from '../components/ui/MetricCard'
import type { DashboardOverview } from '../api/types'
import { dashboardService } from '../services/dashboardService'
import { useAuth } from '../auth/useAuth'

function displayName(email?: string | null) {
  const localPart = email?.split('@')[0]?.trim()
  if (!localPart) return 'there'
  return localPart
    .replace(/[._-]+/g, ' ')
    .replace(/\w/g, (char) => char.toUpperCase())
}

function scoreClass(value: number) {
  if (value >= 85) return 'text-[var(--color-success-text)]'
  if (value >= 70) return 'text-[var(--color-warning-text)]'
  return 'text-[var(--color-error-text)]'
}

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    dashboardService.getOverview().then((data) => {
      if (active) {
        setOverview(data)
        setLoading(false)
      }
    })

    return () => {
      active = false
    }
  }, [])

  const metrics = useMemo(() => overview?.metrics ?? [], [overview])

  return (
    <div className="space-y-7">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent-text)]">
          Career Intelligence
        </p>
        <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Welcome back, {displayName(user?.email)}
            </h1>
            <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
              Your career intelligence overview
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/career-target')}
            className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-sm font-medium text-[var(--color-text)] shadow-[var(--shadow-xs)] transition hover:bg-[var(--color-surface-hover)]"
          >
            Review career target
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section aria-label="Career metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-[132px] animate-pulse rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]"
              />
            ))
          : metrics.map((metric) => (
              <MetricCard
                key={metric.label}
                label={metric.label}
                accent={
                  metric.label === 'Career Score'
                    ? 'blue'
                    : metric.label === 'Resume Score'
                      ? 'green'
                      : metric.label === 'Average Opportunity Fit'
                        ? 'yellow'
                        : 'red'
                }
                value={
                  <span>
                    {metric.value}
                    <span className="ml-0.5 text-base font-medium text-[var(--color-text-muted)]">
                      {metric.suffix}
                    </span>
                  </span>
                }
                change={metric.trend}
                trend="up"
                description={metric.description}
              />
            ))}
      </section>

      {overview && (
        <div className="grid gap-4 xl:grid-cols-[1.05fr_1fr]">
          <Card className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent-text)]">
                    <Target className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                      Career Target
                    </p>
                    <h2 className="mt-0.5 text-base font-semibold">{overview.target.role}</h2>
                  </div>
                </div>
              </div>
              <span className="text-2xl font-semibold tabular-nums">
                {overview.target.progress}%
              </span>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-[var(--color-text-muted)]">Progress</span>
                <span className="font-medium text-[var(--color-text-secondary)]">
                  {overview.target.progress}% aligned
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-tertiary)]">
                <div
                  className="h-full rounded-full bg-[var(--color-accent)] transition-all"
                  style={{ width: `${overview.target.progress}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/career-target')}
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-accent-text)] hover:underline"
            >
              Manage target
              <ChevronRight className="h-4 w-4" />
            </button>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-info-bg)] text-[var(--color-info-text)]">
                  <BriefcaseBusiness className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                    Current Opportunity
                  </p>
                  <h2 className="mt-0.5 text-base font-semibold">{overview.currentOpportunity.role}</h2>
                  <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
                    {overview.currentOpportunity.company}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <ScoreBlock
                label="Opportunity Fit"
                value={overview.currentOpportunity.opportunityFit}
                icon={<TrendingUp className="h-3.5 w-3.5" />}
              />
              <ScoreBlock
                label="Career Alignment"
                value={overview.currentOpportunity.careerAlignment}
                icon={<CircleCheck className="h-3.5 w-3.5" />}
              />
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate('/analysis')}
                className="flex-1 rounded-lg bg-[var(--color-accent)] px-3 py-2 text-sm font-semibold text-[var(--color-accent-contrast)] transition hover:bg-[var(--color-accent-hover)]"
              >
                View Analysis
              </button>
              <button
                type="button"
                onClick={() => navigate('/mock-interviews')}
                className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-surface-hover)]"
              >
                Mock Interview
              </button>
            </div>
          </Card>
        </div>
      )}

      {overview && (
        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                Career Intelligence
              </p>
              <h2 className="mt-1 text-lg font-semibold">Your readiness signals</h2>
            </div>
            <span className="hidden text-xs text-[var(--color-text-muted)] sm:block">
              Updated from your latest profile data
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {overview.intelligence.map((signal) => (
              <Card key={signal.label} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-[var(--color-text-secondary)]">{signal.label}</p>
                  <p className={`text-lg font-semibold tabular-nums ${scoreClass(signal.value)}`}>
                    {signal.value}
                  </p>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-tertiary)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-accent)]"
                    style={{ width: `${signal.value}%` }}
                  />
                </div>
                <p className="mt-2.5 text-xs leading-5 text-[var(--color-text-muted)]">
                  {signal.description}
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function ScoreBlock({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon: ReactNode
}) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-3.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)]">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}/100</p>
    </div>
  )
}
