import { useEffect, useState } from 'react'
import { useI18n } from '../i18n/hooks'
import { ArrowUpRight, BarChart3, CircleHelp, Target, TrendingUp } from 'lucide-react'
import type { CareerAnalyticsData } from '../api/analyticsTypes'
import { analyticsService } from '../services/analyticsService'
import { Badge, Card, ErrorState, LoadingState, MetricCard } from '../components/ui/ui'
import { LineTrendChart } from '../components/analytics/LineTrendChart'
import { ComparisonChart } from '../components/analytics/ComparisonChart'

const priorityVariant = {
  Critical: 'error',
  Important: 'warning',
  Optional: 'neutral',
} as const

export function CareerAnalyticsPage() {
  const { t } = useI18n()
  const [data, setData] = useState<CareerAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    analyticsService.getAnalytics()
      .then((result) => { if (active) setData(result) })
      .catch(() => { if (active) setError(t('We could not load your career analytics right now.')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [t])

  if (loading) return <LoadingState label={t("Loading career analytics...")} />
  if (error) return <ErrorState title={t("Analytics unavailable")} description={error} />
  if (!data) return <ErrorState title={t("Analytics unavailable")} description={t("No analytics data was returned.")} />

  const latestAlignment = data.careerAlignmentHistory.at(-1)?.value ?? 0
  const latestReadiness = data.interviewReadiness.at(-1)?.value ?? 0
  const strongestSkill = [...data.skillGrowth].sort((a, b) => b.currentLevel - a.currentLevel)[0]

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent-text)]">{t("Career intelligence")}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{t("Career Analytics")}</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{t("See how your profile is progressing toward your target and where the biggest career gaps remain.")}</p>
        </div>
        {data.isDemo && (
          <div className="flex max-w-md items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-3 py-2.5 text-xs leading-5 text-[var(--color-warning-text)]">
            <CircleHelp className="mt-0.5 h-4 w-4 shrink-0" />
            <span><strong>{t("Demo data:")}</strong> {t("historical user data is not available yet. These values are isolated in the analytics service and will be replaced by API data.")}</span>
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t("Career Target Progress")} value={`${data.careerTarget.progress}%`} change={data.careerTarget.role} trend="up" icon={<Target className="h-5 w-5" />} description={t("Progress toward your current target")} />
        <MetricCard label={t("Latest Career Alignment")} value={`${latestAlignment}/100`} change={t('Current')} trend="up" icon={<TrendingUp className="h-5 w-5" />} description={t("Latest alignment signal")} />
        <MetricCard label={t("Interview Readiness")} value={`${latestReadiness}/100`} change={t('Current')} trend="up" icon={<BarChart3 className="h-5 w-5" />} description={t("Latest practice readiness signal")} />
        <MetricCard label={t("Strongest Tracked Skill")} value={strongestSkill?.skill ?? '—'} change={strongestSkill ? `${strongestSkill.currentLevel}%` : undefined} trend="up" icon={<ArrowUpRight className="h-5 w-5" />} description={t("Highest current skill signal")} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div><h2 className="text-base font-semibold">{t("Career Target Progress")}</h2><p className="mt-1 text-sm text-[var(--color-text-secondary)]">{t("How close is your current profile to your target role?")}</p></div>
            <Badge variant="accent">{data.careerTarget.progress}%</Badge>
          </div>
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-[var(--color-surface-tertiary)]"><div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${data.careerTarget.progress}%` }} /></div>
          <div className="mt-3 flex justify-between text-xs text-[var(--color-text-muted)]"><span>{t("Current profile")}</span><span>{data.careerTarget.role}</span></div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div><h2 className="text-base font-semibold">{t("Career Alignment History")}</h2><p className="mt-1 text-sm text-[var(--color-text-secondary)]">{t("Is the type of opportunities you pursue moving closer to your target?")}</p></div>
          <div className="mt-5"><LineTrendChart points={data.careerAlignmentHistory} ariaLabel="Career alignment history over time" /></div>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <div><h2 className="text-base font-semibold">{t("Opportunity Fit vs Career Alignment")}</h2><p className="mt-1 text-sm text-[var(--color-text-secondary)]">{t("Does an opportunity match you today, and does it move you toward your target?")}</p></div>
          <div className="mt-5"><ComparisonChart points={data.opportunityComparison} ariaLabel="Opportunity fit versus career alignment across opportunities" /></div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div><h2 className="text-base font-semibold">{t("Interview Readiness")}</h2><p className="mt-1 text-sm text-[var(--color-text-secondary)]">{t("How is your readiness changing after interview practice?")}</p></div>
          <div className="mt-5"><LineTrendChart points={data.interviewReadiness} ariaLabel="Interview readiness history over time" /></div>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="p-5 sm:p-6">
          <div><h2 className="text-base font-semibold">{t("Skill Growth")}</h2><p className="mt-1 text-sm text-[var(--color-text-secondary)]">{t("Where is your current evidence stronger than your previous baseline?")}</p></div>
          <div className="mt-6 space-y-5">
            {data.skillGrowth.map((skill) => (
              <div key={skill.skill}>
                <div className="mb-2 flex items-center justify-between gap-4"><span className="text-sm font-medium">{skill.skill}</span><span className="text-xs text-[var(--color-text-muted)]">{skill.previousLevel}% → {skill.currentLevel}%</span></div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[var(--color-surface-tertiary)]"><div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${skill.currentLevel}%` }} /></div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div><h2 className="text-base font-semibold">{t("Top Skill Gaps")}</h2><p className="mt-1 text-sm text-[var(--color-text-secondary)]">{t("Prioritized areas where additional evidence could strengthen your target path.")}</p></div>
          <div className="mt-5 space-y-3">
            {data.topSkillGaps.map((gap) => (
              <div key={gap.skill} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">{gap.skill}</h3><Badge variant={priorityVariant[gap.priority]}>{t(gap.priority)}</Badge></div>
                <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                  <div><dt className="text-[var(--color-text-muted)]">{t("Current evidence")}</dt><dd className="mt-0.5 text-[var(--color-text-secondary)]">{gap.currentEvidence}</dd></div>
                  <div><dt className="text-[var(--color-text-muted)]">{t("Required level")}</dt><dd className="mt-0.5 text-[var(--color-text-secondary)]">{gap.requiredLevel}</dd></div>
                </dl>
                <p className="mt-3 text-xs leading-5 text-[var(--color-text-secondary)]"><span className="font-medium text-[var(--color-text)]">{t("Gap:")}</span> {gap.gap}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  )
}
