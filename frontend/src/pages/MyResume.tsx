import { useEffect, useState } from 'react'
import { Award, CheckCircle2, FileText, FolderKanban, GraduationCap, Search, Sparkles, XCircle } from 'lucide-react'
import type { ResumeSnapshot } from '../api/careerTypes'
import { careerService } from '../services/careerService'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { LoadingState } from '../components/ui/LoadingState'
import { ErrorState } from '../components/ui/ErrorState'
import { TagList } from '../components/career/TagList'
import { SectionHeading } from '../components/career/SectionHeading'
import { useToast } from '../hooks/useToast'

export function MyResumePage() {
  const { add } = useToast()
  const [resume, setResume] = useState<ResumeSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    careerService.getResume()
      .then(setResume)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const handleAction = async (action: 'analyze' | 'improve') => {
    setWorking(true)
    try {
      if (action === 'analyze') await careerService.analyzeResume()
      else await careerService.improveResume()
      add('success', action === 'analyze' ? 'Resume analysis requested' : 'Resume improvement requested')
    } catch {
      add('error', 'Action unavailable right now')
    } finally {
      setWorking(false)
    }
  }

  if (loading) return <LoadingState label="Loading resume..." />
  if (error || !resume) return <ErrorState title="Unable to load resume" description="Please try again later." />

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Career Intelligence"
        title="My Resume"
        description="Review the resume Clario is using as the current source of career evidence."
      />

      <div className="grid gap-5 xl:grid-cols-[1.5fr_0.5fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div className="flex gap-4">
              <div className="rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] p-3 text-[var(--color-accent-text)]"><FileText className="h-6 w-6" /></div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Resume file</p>
                <h2 className="mt-1 font-semibold text-[var(--color-text)]">{resume.fileName}</h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">{resume.updatedAt}</p>
              </div>
            </div>
            <Badge variant="success">Current</Badge>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => handleAction('analyze')} loading={working}><Search className="h-4 w-4" />Analyze Resume</Button>
            <Button variant="secondary" onClick={() => handleAction('improve')} loading={working}><Sparkles className="h-4 w-4" />Improve Resume</Button>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Resume score</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-4xl font-semibold tracking-tight text-[var(--color-text)]">{resume.score}</span>
            <span className="text-sm text-[var(--color-text-muted)]">/100</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--color-surface-secondary)]">
            <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${resume.score}%` }} />
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold">Skills</h2>
          <div className="mt-4"><TagList items={resume.skills} variant="accent" /></div>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">Certifications</h2>
          <div className="mt-4"><TagList items={resume.certifications} variant="info" /></div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-[var(--color-accent-text)]" /><h2 className="font-semibold">Experience</h2></div>
          <div className="mt-4 space-y-5">
            {resume.experience.map((item) => (
              <div key={item.id}>
                <div className="flex flex-wrap justify-between gap-2">
                  <h3 className="font-medium">{item.role} · {item.company}</h3>
                  <span className="text-xs text-[var(--color-text-muted)]">{item.period}</span>
                </div>
                <ul className="mt-2 space-y-2">{item.bullets.map((bullet) => <li key={bullet} className="text-sm leading-6 text-[var(--color-text-secondary)]">• {bullet}</li>)}</ul>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2"><FolderKanban className="h-4 w-4 text-[var(--color-accent-text)]" /><h2 className="font-semibold">Projects</h2></div>
          <div className="mt-4 space-y-4">
            {resume.projects.map((item) => (
              <div key={item.id} className="rounded-[var(--radius-md)] bg-[var(--color-surface-secondary)] p-4">
                <h3 className="font-medium">{item.name}</h3>
                <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">{item.description}</p>
                <div className="mt-3"><TagList items={item.technologies} /></div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[var(--color-success-text)]" /><h2 className="font-semibold">Strengths</h2></div>
            <ul className="mt-4 space-y-3">{resume.strengths.map((item) => <li key={item} className="text-sm leading-6 text-[var(--color-text-secondary)]">{item}</li>)}</ul>
          </div>
          <div>
            <div className="flex items-center gap-2"><XCircle className="h-4 w-4 text-[var(--color-error-text)]" /><h2 className="font-semibold">Weaknesses</h2></div>
            <ul className="mt-4 space-y-3">{resume.weaknesses.map((item) => <li key={item} className="text-sm leading-6 text-[var(--color-text-secondary)]">{item}</li>)}</ul>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2"><Award className="h-4 w-4 text-[var(--color-warning-text)]" /><h2 className="font-semibold">Missing Evidence</h2></div>
        <ul className="mt-4 space-y-3">
          {resume.missingEvidence.map((item) => <li key={item} className="text-sm leading-6 text-[var(--color-text-secondary)]">{item}</li>)}
        </ul>
      </Card>

      <div className="sr-only">
        <GraduationCap aria-hidden="true" />
      </div>
    </div>
  )
}
