import { useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle2, Target, TrendingUp, XCircle } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import type { InterviewResults } from '../api/interviewTypes'
import { interviewService } from '../services/interviewService'
import { Badge, Button, Card, LoadingState } from '../components/ui/ui'

const scoreRows: Array<{ key: keyof InterviewResults['score']; label: string }> = [
  { key: 'technicalKnowledge', label: 'Technical Knowledge' },
  { key: 'problemSolving', label: 'Problem Solving' },
  { key: 'communication', label: 'Communication' },
  { key: 'roleRelevance', label: 'Role Relevance' },
  { key: 'answerDepth', label: 'Answer Depth' },
  { key: 'completeness', label: 'Completeness' },
]

export function InterviewResultsPage() {
  const { interviewId = '' } = useParams()
  const navigate = useNavigate()
  const [results, setResults] = useState<InterviewResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    interviewService.getResults(interviewId).then(setResults).catch(() => setError(true)).finally(() => setLoading(false))
  }, [interviewId])

  if (loading) return <LoadingState label="Preparing interview analytics..." />
  if (error || !results) return <Card className="p-8 text-center"><h1 className="text-xl font-semibold">Analytics unavailable</h1><p className="mt-2 text-sm text-[var(--color-text-secondary)]">Finish an interview session before viewing its analytics.</p><Button className="mt-5" onClick={() => navigate('/mock-interviews')}>Back to interviews</Button></Card>

  return (
    <div className="space-y-7">
      <button type="button" onClick={() => navigate('/mock-interviews')} className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"><ArrowLeft className="h-4 w-4" /> Back to interviews</button>
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent-text)]">Interview complete</p><h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Interview analytics</h1><p className="mt-2 text-sm text-[var(--color-text-secondary)]">{results.role} · {results.company}</p></div><Badge variant="success">Completed</Badge></section>

      <Card className="overflow-hidden p-6 sm:p-8"><div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium text-[var(--color-text-secondary)]">Overall Score</p><div className="mt-2 flex items-baseline gap-2"><span className="text-6xl font-semibold tracking-tight">{results.score.overall}</span><span className="text-lg text-[var(--color-text-muted)]">/100</span></div><p className="mt-2 text-sm text-[var(--color-text-secondary)]">A summary of how your answers performed across the interview dimensions.</p></div><div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-8 border-[var(--color-accent-soft)] bg-[var(--color-surface-secondary)]"><TrendingUp className="h-8 w-8 text-[var(--color-accent-text)]" /></div></div></Card>

      <Card className="p-5 sm:p-6"><div className="flex items-center gap-2"><BarChartIcon /><h2 className="font-semibold">Interview dimensions</h2></div><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{scoreRows.map((row) => <div key={row.key} className="rounded-[var(--radius-md)] bg-[var(--color-surface-secondary)] p-4"><div className="flex items-center justify-between gap-3"><span className="text-sm text-[var(--color-text-secondary)]">{row.label}</span><span className="font-semibold tabular-nums">{results.score[row.key]}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--color-surface-tertiary)]"><div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${results.score[row.key]}%` }} /></div></div>)}</div></Card>

      <div className="grid gap-5 lg:grid-cols-3"><InsightCard icon={CheckCircle2} title="Strengths" items={results.strengths} tone="success" /><InsightCard icon={XCircle} title="Weaknesses" items={results.weaknesses} tone="error" /><InsightCard icon={Target} title="Preparation Priorities" items={results.preparationPriorities} tone="accent" /></div>

      <Card className="p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">Keep preparing</h2><p className="mt-1 text-sm text-[var(--color-text-secondary)]">Run another opportunity-based interview when you are ready to test the next set of gaps.</p></div><Button onClick={() => navigate('/mock-interviews/setup')}>Start another interview</Button></div></Card>
    </div>
  )
}

function BarChartIcon() { return <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[var(--color-accent-soft)] text-xs font-bold text-[var(--color-accent-text)]">%</span> }

function InsightCard({ icon: Icon, title, items, tone }: { icon: typeof CheckCircle2; title: string; items: string[]; tone: 'success' | 'error' | 'accent' }) {
  const styles = tone === 'success' ? 'text-[var(--color-success-text)] bg-[var(--color-success-bg)]' : tone === 'error' ? 'text-[var(--color-error-text)] bg-[var(--color-error-bg)]' : 'text-[var(--color-accent-text)] bg-[var(--color-accent-soft)]'
  return <Card className="p-5"><div className="flex items-center gap-2"><span className={`flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] ${styles}`}><Icon className="h-4 w-4" /></span><h2 className="font-semibold">{title}</h2></div><ul className="mt-4 space-y-3">{items.map((item) => <li key={item} className="text-sm leading-6 text-[var(--color-text-secondary)]">{item}</li>)}</ul></Card>
}
