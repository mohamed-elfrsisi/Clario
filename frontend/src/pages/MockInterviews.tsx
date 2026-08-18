import { useEffect, useState } from 'react'
import { useI18n } from '../i18n/hooks'
import { ArrowRight, BarChart3, Brain, CalendarDays, Mic2, Plus, Target } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import type { InterviewSummary } from '../api/interviewTypes'
import { interviewService } from '../services/interviewService'
import { Badge, Button, Card, EmptyState, LoadingState } from '../components/ui/ui'

export function MockInterviewsPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [interviews, setInterviews] = useState<InterviewSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    interviewService.listInterviews().then(setInterviews).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent-text)]">{t("Interview intelligence")}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{t("Mock Interviews")}</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{t("Practice against a specific opportunity using your profile, career target, and known skill gaps.")}</p>
        </div>
        <Button onClick={() => navigate('/mock-interviews/setup')}>
          <Plus className="h-4 w-4" /> {t("Start interview")}
        </Button>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5"><Brain className="h-5 w-5 text-[var(--color-accent-text)]" /><h2 className="mt-4 font-semibold">{t("Opportunity-based")}</h2><p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">{t("Questions are grounded in the role you are preparing for.")}</p></Card>
        <Card className="p-5"><Target className="h-5 w-5 text-[var(--color-accent-text)]" /><h2 className="mt-4 font-semibold">{t("Adaptive by design")}</h2><p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">{t("The next question comes from the interview service, not a fixed UI sequence.")}</p></Card>
        <Card className="p-5"><BarChart3 className="h-5 w-5 text-[var(--color-accent-text)]" /><h2 className="mt-4 font-semibold">{t("Actionable results")}</h2><p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">{t("Review strengths, weaknesses, and preparation priorities after you finish.")}</p></Card>
      </div>

      <section>
        <div className="mb-4"><h2 className="text-base font-semibold">{t("Previous interviews")}</h2><p className="mt-1 text-sm text-[var(--color-text-secondary)]">{t("Your completed practice sessions.")}</p></div>
        {loading ? <Card><LoadingState label={t("Loading interviews...")} /></Card> : interviews.length === 0 ? (
          <Card><EmptyState icon={Mic2} title={t("No interviews yet")} description={t("Start with an opportunity and build a focused practice session.")} action={<Button size="sm" onClick={() => navigate('/mock-interviews/setup')}><Plus className="h-4 w-4" /> {t("Start interview")}</Button>} /></Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {interviews.map((interview) => (
              <Card key={interview.interviewId} className="p-5">
                <div className="flex items-start justify-between gap-4"><div><p className="text-sm text-[var(--color-text-muted)]">{interview.company}</p><h3 className="mt-1 text-lg font-semibold">{interview.role}</h3></div><Badge variant="success">{interview.overallScore}/100</Badge></div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div className="rounded-[var(--radius-md)] bg-[var(--color-surface-secondary)] p-3"><p className="text-xs text-[var(--color-text-muted)]">{t("Questions")}</p><p className="mt-1 font-semibold">{interview.questionCount}</p></div><div className="rounded-[var(--radius-md)] bg-[var(--color-surface-secondary)] p-3"><p className="text-xs text-[var(--color-text-muted)]">{t("Difficulty")}</p><p className="mt-1 font-semibold">{interview.difficulty}</p></div></div>
                <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-4"><span className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]"><CalendarDays className="h-3.5 w-3.5" />{new Date(interview.completedAt).toLocaleDateString()}</span><Link to={`/mock-interviews/${interview.interviewId}/results`}><Button variant="secondary" size="sm">{t("View analytics")} <ArrowRight className="h-4 w-4" /></Button></Link></div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
