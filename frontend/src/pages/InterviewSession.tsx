import { useEffect, useState } from 'react'
import { AlertCircle, ArrowLeft, LogOut, Send } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import type { InterviewQuestion } from '../api/interviewTypes'
import { interviewService } from '../services/interviewService'
import { Button, Card } from '../components/ui/ui'

export function InterviewSessionPage() {
  const { interviewId = '' } = useParams()
  const navigate = useNavigate()
  const [question, setQuestion] = useState<InterviewQuestion | null>(null)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    interviewService.getQuestion(interviewId).then(setQuestion).catch(() => setError('This interview session is no longer available.')).finally(() => setLoading(false))
  }, [interviewId])

  const submit = async () => {
    setError('')
    setSubmitting(true)
    try {
      const result = await interviewService.submitAnswer(interviewId, { questionId: question?.id ?? '', answer })
      if (!result.accepted) {
        setError(result.message ?? 'Answer could not be submitted.')
        return
      }
      setSubmitted(true)
      if (result.completed) {
        navigate(`/mock-interviews/${interviewId}/results`, { replace: true })
        return
      }
      setTimeout(() => {
        setQuestion(result.nextQuestion)
        setAnswer('')
        setSubmitted(false)
      }, 450)
    } catch {
      setError('We could not submit this answer. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center"><Card className="w-full p-8 text-center"><div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" /><p className="mt-3 text-sm text-[var(--color-text-secondary)]">Loading your interview...</p></Card></div>
  if (error && !question) return <div className="mx-auto max-w-2xl"><Card className="p-8 text-center"><AlertCircle className="mx-auto h-7 w-7 text-[var(--color-error-text)]" /><h1 className="mt-4 text-xl font-semibold">Interview unavailable</h1><p className="mt-2 text-sm text-[var(--color-text-secondary)]">{error}</p><Button className="mt-6" onClick={() => navigate('/mock-interviews')}>Back to interviews</Button></Card></div>
  if (!question) return null

  const progress = ((question.number - 1) / question.total) * 100

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-4xl flex-col">
      <div className="flex items-center justify-between gap-4"><button type="button" onClick={() => navigate('/mock-interviews')} className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"><ArrowLeft className="h-4 w-4" /> Exit interview</button><button type="button" onClick={() => navigate('/mock-interviews')} className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"><LogOut className="h-4 w-4" /> Exit</button></div>
      <div className="mt-6"><div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]"><span>Question {question.number} of {question.total}</span><span>{question.category}</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-tertiary)]"><div className="h-full rounded-full bg-[var(--color-accent)] transition-all" style={{ width: `${Math.max(progress, 8)}%` }} /></div></div>

      <Card className="my-8 flex flex-1 flex-col p-6 sm:p-10">
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-accent-text)]">Interview question</p><h1 className="mt-4 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{question.prompt}</h1><p className="mt-4 text-sm leading-6 text-[var(--color-text-secondary)]">Answer as you would in a real interview. Use specific evidence from your experience where relevant.</p>
          <div className="mt-8 flex flex-1 flex-col"><label htmlFor="interview-answer" className="text-sm font-medium">Your answer</label><textarea id="interview-answer" autoFocus value={answer} onChange={(event) => setAnswer(event.target.value)} disabled={submitting || submitted} placeholder="Write your answer here..." className="mt-2 min-h-[240px] flex-1 resize-none rounded-[var(--radius-lg)] border border-[var(--color-input-border)] bg-[var(--color-input-bg)] p-4 text-sm leading-7 text-[var(--color-text)] placeholder:text-[var(--color-text-placeholder)] focus:border-[var(--color-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] sm:min-h-[300px]" />
            {error && <div className="mt-3 flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-error-border)] bg-[var(--color-error-bg)] px-3 py-2 text-sm text-[var(--color-error-text)]"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
            {submitted && <p className="mt-3 text-sm font-medium text-[var(--color-success-text)]">Answer submitted. Loading the next question...</p>}
          </div>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-[var(--color-text-muted)]">Your next question may change based on the interview service response.</p><Button size="lg" onClick={submit} loading={submitting} disabled={submitted}><Send className="h-4 w-4" /> Submit Answer</Button></div>
        </div>
      </Card>
    </div>
  )
}
