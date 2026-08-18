import { useState } from 'react'
import { ArrowLeft, Check, ChevronDown, Mic2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { InterviewCategory, InterviewDifficulty, InterviewSetup as Setup } from '../api/interviewTypes'
import { interviewDefaults, interviewService } from '../services/interviewService'
import { Button, Card, Input } from '../components/ui/ui'
import { useToast } from '../hooks/useToast'

const categories: InterviewCategory[] = ['Technical', 'Role-specific', 'Resume-based', 'Behavioral', 'Skill-gap', 'Situational']

export function InterviewSetupPage() {
  const navigate = useNavigate()
  const { add } = useToast()
  const [form, setForm] = useState<Setup>({
    role: 'Machine Learning Intern',
    company: 'NVIDIA',
    opportunityId: 'demo-ml-intern',
    questionCount: 12,
    difficulty: interviewDefaults.difficulty,
    categories: [...interviewDefaults.categories],
  })
  const [loading, setLoading] = useState(false)

  const toggleCategory = (category: InterviewCategory) => {
    setForm((current) => ({
      ...current,
      categories: current.categories.includes(category) ? current.categories.filter((item) => item !== category) : [...current.categories, category],
    }))
  }

  const start = async () => {
    if (!form.role.trim() || !form.company.trim() || form.categories.length === 0) {
      add('error', 'Choose a role, company, and at least one interview category')
      return
    }
    setLoading(true)
    try {
      const session = await interviewService.createInterview(form)
      navigate(`/mock-interviews/${session.interviewId}/session`)
    } catch {
      add('error', 'Unable to start the interview')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <button type="button" onClick={() => navigate('/mock-interviews')} className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"><ArrowLeft className="h-4 w-4" /> Back to interviews</button>
      <section><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent-text)]">Interview setup</p><h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Build a focused interview</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">This session is grounded in the candidate profile, target career direction, opportunity, and skill gaps available to the interview service.</p></section>

      <Card className="p-5 sm:p-7">
        <div className="grid gap-5 md:grid-cols-2">
          <Input label="Role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} />
          <Input label="Company" value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} />
          <label className="block text-sm font-medium">Question count<select value={form.questionCount} onChange={(event) => setForm({ ...form, questionCount: Number(event.target.value) })} className="mt-1.5 min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-3 text-sm font-normal text-[var(--color-text)] focus:border-[var(--color-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"><option value={8}>8 questions</option><option value={10}>10 questions</option><option value={12}>12 questions</option><option value={15}>15 questions</option></select></label>
          <label className="block text-sm font-medium">Difficulty<select value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value as InterviewDifficulty })} className="mt-1.5 min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-3 text-sm font-normal text-[var(--color-text)] focus:border-[var(--color-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
        </div>

        <div className="mt-7 border-t border-[var(--color-border)] pt-6">
          <div><h2 className="font-semibold">Interview categories</h2><p className="mt-1 text-sm text-[var(--color-text-secondary)]">Choose the areas you want the service to cover.</p></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const selected = form.categories.includes(category)
              return <button key={category} type="button" onClick={() => toggleCategory(category)} className={`flex items-center justify-between rounded-[var(--radius-md)] border p-4 text-left transition-colors ${selected ? 'border-[var(--color-accent-border)] bg-[var(--color-accent-soft)]' : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]'}`}><span><span className="block text-sm font-medium">{category}</span><span className="mt-1 block text-xs text-[var(--color-text-muted)]">{category === 'Skill-gap' ? 'Focus on known development gaps' : `Practice ${category.toLowerCase()} questions`}</span></span>{selected && <Check className="h-4 w-4 shrink-0 text-[var(--color-accent-text)]" />}</button>
            })}
          </div>
        </div>

        <div className="mt-7 flex flex-col-reverse gap-2 border-t border-[var(--color-border)] pt-5 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={() => navigate('/mock-interviews')}>Cancel</Button><Button onClick={start} loading={loading}><Mic2 className="h-4 w-4" /> Start interview <ChevronDown className="hidden h-4 w-4" /></Button></div>
      </Card>
    </div>
  )
}
