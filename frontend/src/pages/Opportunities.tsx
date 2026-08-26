import { useCallback, useEffect, useMemo, useState } from 'react'
import { useI18n } from '../i18n/hooks'
import { ArrowRight, Briefcase, Building2, CalendarDays, Plus, Search, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Opportunity } from '../api/types'
import { useToast } from '../hooks/useToast'
import { pageDescriptions } from '../config/navigation'
import { Badge, Button, Card, EmptyState, Input, LoadingState } from '../components/ui/ui'

interface OpportunityMeta {
  company: string
  opportunityFit?: number
  careerAlignment?: number
  analyzedAt?: string
  jobUrl?: string
}

const META_KEY = 'clario-opportunity-meta'

function readMeta(): Record<string, OpportunityMeta> {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) ?? '{}') as Record<string, OpportunityMeta>
  } catch {
    return {}
  }
}

function writeMeta(meta: Record<string, OpportunityMeta>) {
  localStorage.setItem(META_KEY, JSON.stringify(meta))
}

function formatDate(value?: string) {
  if (!value) return 'Not analyzed'
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

export function OpportunitiesPage() {
  const { t } = useI18n()
  const { add } = useToast()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [meta, setMeta] = useState<Record<string, OpportunityMeta>>(readMeta)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [form, setForm] = useState({ company: '', title: '', text: '', jobUrl: '' })

  const loadOpportunities = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.listOpportunities(0, 50)
      setOpportunities(res.data)
    } catch {
      add('error', t('Failed to load opportunities'))
    } finally {
      setLoading(false)
    }
  }, [add, t])

  useEffect(() => {
    void loadOpportunities()
  }, [loadOpportunities])

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return opportunities
    const q = searchQuery.toLowerCase()
    return opportunities.filter((opportunity) => {
      const saved = meta[opportunity.opportunity_id]
      return [opportunity.title, opportunity.role_type, opportunity.region, saved?.company]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(q))
    })
  }, [meta, opportunities, searchQuery])

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.title.trim() || !form.company.trim() || !form.text.trim()) {
      add('error', t('Job title, company, and job description are required'))
      return
    }

    setFormLoading(true)
    try {
      const response = await api.createOpportunity({
        text: form.text,
        title: form.title,
      })
      const created = response.data as Opportunity
      const nextMeta = {
        ...meta,
        [created.opportunity_id]: {
          company: form.company.trim(),
          ...(form.jobUrl.trim() ? { jobUrl: form.jobUrl.trim() } : {}),
        },
      }
      setMeta(nextMeta)
      writeMeta(nextMeta)
      add('success', t('Opportunity saved'))
      setShowForm(false)
      setForm({ company: '', title: '', text: '', jobUrl: '' })
      await loadOpportunities()
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to create opportunity'
      add('error', detail)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this opportunity?')) return
    try {
      await api.deleteOpportunity(id)
      const nextMeta = { ...meta }
      delete nextMeta[id]
      setMeta(nextMeta)
      writeMeta(nextMeta)
      add('success', t('Opportunity deleted'))
      await loadOpportunities()
    } catch {
      add('error', t('Failed to delete opportunity'))
    }
  }

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent-text)]">{t("Career intelligence")}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">{t("Opportunities")}</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{pageDescriptions['/opportunities']}. Compare fit with the career direction you are building toward.</p>
        </div>
        <Button onClick={() => setShowForm((current) => !current)} size="sm">
          <Plus className="h-4 w-4" />
          {showForm ? 'Close' : 'Add opportunity'}
        </Button>
      </section>

      {showForm && (
        <Card className="p-5 sm:p-6">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent-text)]">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text)]">{t("Add an opportunity")}</h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{t("Save the role you are considering. Analysis can be run once your profile and resume are ready.")}</p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={t("Job title")}
                placeholder={t("Machine Learning Intern")}
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                required
              />
              <Input
                label={t("Company")}
                placeholder={t("NVIDIA")}
                value={form.company}
                onChange={(event) => setForm({ ...form, company: event.target.value })}
                required
              />
            </div>

            <div>
              <label htmlFor="job-description" className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">{t("Job description")}</label>
              <textarea
                id="job-description"
                required
                rows={7}
                placeholder={t("Paste the full job description here...")}
                value={form.text}
                onChange={(event) => setForm({ ...form, text: event.target.value })}
                className="w-full resize-y rounded-[var(--radius-md)] border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-3 py-3 text-sm leading-6 text-[var(--color-text)] placeholder:text-[var(--color-text-placeholder)] focus:border-[var(--color-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
              />
            </div>

            <Input
              label={t("Job URL")}
              hint="Optional — ready for backend URL support later."
              type="url"
              placeholder={t("https://company.com/jobs/...")}
              value={form.jobUrl}
              onChange={(event) => setForm({ ...form, jobUrl: event.target.value })}
            />

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(false)}>{t("Cancel")}</Button>
              <Button type="submit" size="sm" loading={formLoading}>{t("Save opportunity")}</Button>
            </div>
          </form>
        </Card>
      )}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text)]">{t("Saved opportunities")}</h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{t("Your roles, with profile fit and career direction kept separate.")}</p>
          </div>
          {opportunities.length > 0 && (
            <div className="w-full sm:w-72">
              <Input
                aria-label={t("Filter opportunities")}
                placeholder={t("Filter opportunities...")}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                leading={<Search className="h-4 w-4" />}
              />
            </div>
          )}
        </div>

        {loading ? (
          <Card><LoadingState label={t("Loading opportunities...")} /></Card>
        ) : opportunities.length === 0 ? (
          <Card>
            <EmptyState
              icon={Briefcase}
              title={t("No opportunities yet")}
              description={t("Add a role to start understanding how it fits your current profile and career target.")}
              action={<Button size="sm" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> {t("Add your first opportunity")}</Button>}
            />
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState icon={Search} title={t("No matching opportunities")} description={t("Try a different company or role search.")} />
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filtered.map((opportunity) => {
              const saved = meta[opportunity.opportunity_id]
              return (
                <Card key={opportunity.opportunity_id} className="p-5 transition-shadow hover:shadow-[var(--shadow-md)]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                        <Building2 className="h-3.5 w-3.5" />
                        <span className="truncate">{saved?.company || 'Company not set'}</span>
                      </div>
                      <h3 className="mt-2 truncate text-lg font-semibold text-[var(--color-text)]">{opportunity.title || 'Untitled opportunity'}</h3>
                    </div>
                    <Badge variant="success">{t("Active")}</Badge>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-3">
                      <p className="text-xs font-medium text-[var(--color-text-muted)]">{t("Opportunity Fit")}</p>
                      <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--color-text)]">{saved?.opportunityFit != null ? `${saved.opportunityFit}/100` : '—'}</p>
                      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{t("Current profile match")}</p>
                    </div>
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] p-3">
                      <p className="text-xs font-medium text-[var(--color-accent-text)]">{t("Career Alignment")}</p>
                      <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--color-text)]">{saved?.careerAlignment != null ? `${saved.careerAlignment}/100` : '—'}</p>
                      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{t("Target direction")}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 border-t border-[var(--color-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span>{formatDate(saved?.analyzedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(opportunity.opportunity_id)} aria-label={`Delete ${opportunity.title || 'opportunity'}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Link to={`/analysis?opportunity=${opportunity.opportunity_id}`}>
                        <Button variant="secondary" size="sm">
                          {t("View analysis")}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
