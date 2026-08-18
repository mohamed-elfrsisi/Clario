import { useEffect, useState } from 'react'
import { ArrowRight, Check, Sparkles } from 'lucide-react'
import type { CareerTarget as CareerTargetData } from '../api/careerTypes'
import { careerService } from '../services/careerService'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { TagList } from '../components/career/TagList'
import { ProgressBar } from '../components/career/ProgressBar'
import { SectionHeading } from '../components/career/SectionHeading'
import { LoadingState } from '../components/ui/LoadingState'
import { ErrorState } from '../components/ui/ErrorState'
import { useToast } from '../hooks/useToast'

export function CareerTargetPage() {
  const { add } = useToast()
  const [target, setTarget] = useState<CareerTargetData | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [normalizing, setNormalizing] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    careerService.getTarget()
      .then((data) => {
        setTarget(data)
        setInput(data.naturalLanguageInput)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const update = <K extends keyof CareerTargetData>(key: K, value: CareerTargetData[K]) => {
    setTarget((current) => current ? { ...current, [key]: value } : current)
  }

  const normalize = async () => {
    if (!target || !input.trim()) return
    setNormalizing(true)
    try {
      const normalized = await careerService.normalizeTarget(input)
      setTarget((current) => current ? {
        ...current,
        naturalLanguageInput: input,
        normalizedRole: normalized.normalizedRole,
        coreSkills: normalized.coreSkills,
        technologies: normalized.technologies,
        domain: normalized.domain,
        targetRole: normalized.normalizedRole,
        targetSkills: normalized.coreSkills,
        targetTechnologies: normalized.technologies,
      } : current)
    } finally {
      setNormalizing(false)
    }
  }

  const save = async () => {
    if (!target) return
    setSaving(true)
    try {
      const saved = await careerService.updateTarget(target)
      setTarget(saved)
      add('success', 'Career target saved')
    } catch {
      add('error', 'Unable to save career target')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState label="Loading career target..." />
  if (error || !target) return <ErrorState title="Unable to load career target" description="Please try again later." />

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Career Intelligence"
        title="Career Target"
        description="Define where you want to go. Clario can use this target as the reference point for your profile, resume, and opportunities."
      />

      <Card className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-[var(--color-accent-soft)] p-2 text-[var(--color-accent-text)]"><Sparkles className="h-4 w-4" /></div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-[var(--color-text)]">Describe your target naturally</h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">For example: “I want to become a Machine Learning Engineer.”</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Input value={input} onChange={(e) => setInput(e.target.value)} aria-label="Natural language career target" />
              <Button onClick={normalize} loading={normalizing} className="shrink-0"><ArrowRight className="h-4 w-4" />Normalize target</Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Normalized target</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{target.normalizedRole}</h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{target.domain}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Input label="Target Role" value={target.targetRole} onChange={(e) => update('targetRole', e.target.value)} />
            <Input label="Target Industry" value={target.targetIndustry} onChange={(e) => update('targetIndustry', e.target.value)} />
            <Input label="Target Domain" value={target.targetDomain} onChange={(e) => update('targetDomain', e.target.value)} />
            <Input label="Target Seniority" value={target.targetSeniority} onChange={(e) => update('targetSeniority', e.target.value)} />
            <Input label="Target Location" value={target.targetLocation} onChange={(e) => update('targetLocation', e.target.value)} />
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-medium text-[var(--color-text)]">Core Skills</p>
              <TagList items={target.coreSkills} variant="accent" />
            </div>
            <div>
              <p className="mb-3 text-sm font-medium text-[var(--color-text)]">Technologies</p>
              <TagList items={target.technologies} variant="info" />
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-medium text-[var(--color-text)]">Target Skills</p>
              <TagList items={target.targetSkills} />
            </div>
            <div>
              <p className="mb-3 text-sm font-medium text-[var(--color-text)]">Target Technologies</p>
              <TagList items={target.targetTechnologies} />
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-3 text-sm font-medium text-[var(--color-text)]">Target Responsibilities</p>
            <ul className="space-y-2">
              {target.targetResponsibilities.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-[var(--color-success-text)]" />{item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-7 flex justify-end">
            <Button onClick={save} loading={saving}>Save target</Button>
          </div>
        </Card>

        <Card className="h-fit p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Current target progress</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-4xl font-semibold tracking-tight text-[var(--color-text)]">{target.progress}%</span>
            <span className="pb-1 text-sm text-[var(--color-text-muted)]">aligned</span>
          </div>
          <div className="mt-5"><ProgressBar value={target.progress} /></div>
          <p className="mt-4 text-sm leading-6 text-[var(--color-text-secondary)]">
            Progress is a UI value for now. The real calculation will come from the career intelligence backend.
          </p>
        </Card>
      </div>
    </div>
  )
}
