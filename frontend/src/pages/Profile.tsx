import { useState, useEffect, useCallback } from 'react'
import { useI18n } from '../i18n/hooks'
import { Save, Trash2, Plus, Wand2 } from 'lucide-react'
import { api } from '../api/client'
import type { Profile, TailorResult, ExperienceEntry } from '../api/types'
import { useToast } from '../hooks/useToast'
import { pageDescriptions } from '../config/navigation'
import { Badge } from '../components/ui/Badge'

export function ProfilePage() {
  const { t } = useI18n()
  const { add } = useToast()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [skills, setSkills] = useState('')
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([])
  const [tailoring, setTailoring] = useState(false)
  const [tailoredResult, setTailoredResult] = useState<TailorResult | null>(null)

  const loadProfile = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.getProfile()
      setProfile(res.data)
      setSkills(res.data.master_skills?.join(', ') || '')
      setExperiences(res.data.master_experience as ExperienceEntry[] || [])
    } catch (err: unknown) {
      if ((err as { response?: { status?: number } }).response?.status !== 404) {
        add('error', t('Failed to load profile'))
      }
    } finally {
      setLoading(false)
    }
  }, [add])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const skillCount = skills.split(',').map((s) => s.trim()).filter(Boolean).length
  const completeness = profile
    ? Math.min(100, Math.round((skillCount > 0 ? 40 : 0) + (experiences.length > 0 ? 40 : 0) + (profile.profile_id ? 20 : 0)))
    : Math.min(100, Math.round((skillCount > 0 ? 50 : 0) + (experiences.length > 0 ? 50 : 0)))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const skillList = skills.split(',').map((s) => s.trim()).filter(Boolean)
    if (skillList.length === 0) {
      add('error', t('Please add at least one skill'))
      return
    }

    setSaving(true)
    try {
      const res = await api.saveProfile({
        master_skills: skillList,
        master_experience: experiences,
      })
      setProfile(res.data)
      add('success', t('Profile saved'))
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to save profile'
      add('error', detail)
    } finally {
      setSaving(false)
    }
  }

  const handleTailor = async () => {
    if (!profile) {
      add('error', t('No profile to tailor. Create one first.'))
      return
    }
    const oppId = window.prompt('Enter opportunity ID:')
    if (!oppId) return

    setTailoring(true)
    try {
      const res = await api.tailorProfile(oppId)
      setTailoredResult(res.data)
      add('success', t('Profile tailored'))
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Tailoring failed'
      add('error', detail)
    } finally {
      setTailoring(false)
    }
  }

  const addExperience = () => {
    setExperiences([...experiences, { title: '', description: '', confirmed_metrics: [] }])
  }

  const updateExperience = (idx: number, field: keyof ExperienceEntry, value: string | string[]) => {
    const updated = [...experiences]
    updated[idx] = { ...updated[idx], [field]: value }
    setExperiences(updated)
  }

  const removeExperience = (idx: number) => {
    setExperiences(experiences.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-placeholder)]">{t("Career Builder")}</p>
          <h2 className="mt-1 text-lg font-semibold text-[var(--color-text)]">{t("Profile")}</h2>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">{pageDescriptions['/profile']}</p>
        </div>
        {profile && (
          <div className="text-right">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-placeholder)]">{t("Completeness")}</p>
            <p className="text-lg font-semibold tabular-nums text-[var(--color-text)]">{completeness}%</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center border border-[var(--color-border)] bg-[var(--color-surface)] py-16">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-border-strong)] border-t-[var(--color-accent)]" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          {/* Skills section */}
          <section className="border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="border-b border-[var(--color-border)] px-4 py-2.5">
              <h3 className="text-sm font-semibold text-[var(--color-text)]">{t("Skills")}</h3>
              <p className="text-xs text-[var(--color-text-placeholder)]">{t("Master skills used across all opportunities")}</p>
            </div>
            <div className="p-4">
              <textarea
                className="input min-h-[80px] font-mono text-sm"
                placeholder={t("Python, JavaScript, SQL, React, Docker, AWS...")}
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
              />
              <p className="mt-1 text-xs text-[var(--color-text-placeholder)]">{skillCount} {t("skills detected")}</p>
            </div>
          </section>

          {/* Experience section */}
          <section className="border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-2.5">
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text)]">{t("Experience")}</h3>
                <p className="text-xs text-[var(--color-text-placeholder)]">{experiences.length} {t("entries")}</p>
              </div>
              <button type="button" onClick={addExperience} className="btn btn-ghost text-xs">
                <Plus className="h-3.5 w-3.5" />
                {t("Add entry")}
              </button>
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {experiences.map((exp, idx) => (
                <div key={idx} className="p-4">
                  <div className="flex items-start gap-2">
                    <input
                      className="input flex-1 text-sm"
                      placeholder={t("Job title")}
                      value={exp.title}
                      onChange={(e) => updateExperience(idx, 'title', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeExperience(idx)}
                      className="p-2 text-[var(--color-text-placeholder)] hover:text-[var(--color-error-text)]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <textarea
                    className="input mt-2 min-h-[60px] text-sm"
                    placeholder={t("Description")}
                    value={exp.description}
                    onChange={(e) => updateExperience(idx, 'description', e.target.value)}
                  />
                  <input
                    className="input mt-2 text-sm"
                    placeholder={t("Confirmed metrics (comma-separated)")}
                    value={exp.confirmed_metrics.join(', ')}
                    onChange={(e) =>
                      updateExperience(
                        idx,
                        'confirmed_metrics',
                        e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                      )
                    }
                  />
                </div>
              ))}
              {experiences.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-[var(--color-text-placeholder)]">
                  {t("No experience entries yet.")}
                </p>
              )}
            </div>
          </section>

          <div className="flex items-center gap-2">
            <button type="submit" disabled={saving} className="btn btn-primary text-xs">
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Saving...' : profile ? 'Update profile' : 'Create profile'}
            </button>
            {profile && (
              <button type="button" onClick={handleTailor} disabled={tailoring} className="btn btn-secondary text-xs">
                <Wand2 className="h-3.5 w-3.5" />
                {tailoring ? 'Tailoring...' : 'Tailor to opportunity'}
              </button>
            )}
          </div>
        </form>
      )}

      {tailoredResult && (
        <section className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h3 className="mb-3 text-sm font-semibold text-[var(--color-text)]">{t("Tailored profile")}</h3>
          <div className="space-y-3">
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-[var(--color-text-placeholder)]">{t("Tailored skills")}</p>
              <div className="flex flex-wrap gap-1.5">
                {tailoredResult.tailored_skills.map((skill, i) => (
                  <Badge key={i} variant="success">{skill}</Badge>
                ))}
              </div>
            </div>
            {tailoredResult.tailored_experience.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-[var(--color-text-placeholder)]">{t("Tailored experience")}</p>
                <div className="divide-y divide-[var(--color-border)] border border-[var(--color-border)]">
                  {tailoredResult.tailored_experience.map((exp, i) => (
                    <div key={i} className="px-3 py-2">
                      <p className="text-sm font-medium text-[var(--color-text)]">{(exp as ExperienceEntry).title || 'Untitled'}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{(exp as ExperienceEntry).description || ''}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
