import { useEffect, useState } from 'react'
import { Award, BriefcaseBusiness, FolderKanban, GraduationCap, Lightbulb, Wrench } from 'lucide-react'
import type { CareerProfile as CareerProfileData } from '../api/careerTypes'
import { careerService } from '../services/careerService'
import { Card } from '../components/ui/Card'
import { LoadingState } from '../components/ui/LoadingState'
import { ErrorState } from '../components/ui/ErrorState'
import { TagList } from '../components/career/TagList'
import { SectionHeading } from '../components/career/SectionHeading'

export function CareerProfilePage() {
  const [profile, setProfile] = useState<CareerProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    careerService.getProfile()
      .then((data) => {
        if (active) setProfile(data)
      })
      .catch(() => {
        if (active) setError(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  if (loading) return <LoadingState label="Loading career profile..." />
  if (error || !profile) return <ErrorState title="Unable to load career profile" description="Please try again later." />

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Career Intelligence"
        title="Career Profile"
        description="Your master career profile brings together the evidence Clario can use across your career workflow."
      />

      <Card className="p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Current role & status</p>
        <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-xl font-semibold text-[var(--color-text)]">{profile.currentRole}</h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{profile.status}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-[var(--color-accent-text)]" /><h2 className="font-semibold">Skills</h2></div>
          <div className="mt-4"><TagList items={profile.skills} variant="accent" /></div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2"><Wrench className="h-4 w-4 text-[var(--color-accent-text)]" /><h2 className="font-semibold">Technologies</h2></div>
          <div className="mt-4"><TagList items={profile.technologies} variant="info" /></div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2"><BriefcaseBusiness className="h-4 w-4 text-[var(--color-accent-text)]" /><h2 className="font-semibold">Experience</h2></div>
          <div className="mt-4 space-y-5">
            {profile.experience.map((item) => (
              <div key={item.id} className="border-l-2 border-[var(--color-accent-border)] pl-4">
                <div className="flex flex-wrap justify-between gap-2">
                  <h3 className="font-medium text-[var(--color-text)]">{item.role} · {item.company}</h3>
                  <span className="text-xs text-[var(--color-text-muted)]">{item.period}</span>
                </div>
                <p className="mt-1.5 text-sm leading-6 text-[var(--color-text-secondary)]">{item.description}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2"><FolderKanban className="h-4 w-4 text-[var(--color-accent-text)]" /><h2 className="font-semibold">Projects</h2></div>
          <div className="mt-4 space-y-4">
            {profile.projects.map((item) => (
              <div key={item.id} className="rounded-[var(--radius-md)] bg-[var(--color-surface-secondary)] p-4">
                <h3 className="font-medium text-[var(--color-text)]">{item.name}</h3>
                <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">{item.description}</p>
                <div className="mt-3"><TagList items={item.technologies} /></div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-[var(--color-accent-text)]" /><h2 className="font-semibold">Education</h2></div>
          <ul className="mt-4 space-y-3 text-sm text-[var(--color-text-secondary)]">{profile.education.map((item) => <li key={item}>{item}</li>)}</ul>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2"><Award className="h-4 w-4 text-[var(--color-accent-text)]" /><h2 className="font-semibold">Certifications</h2></div>
          <ul className="mt-4 space-y-3 text-sm text-[var(--color-text-secondary)]">{profile.certifications.map((item) => <li key={item}>{item}</li>)}</ul>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2"><Award className="h-4 w-4 text-[var(--color-accent-text)]" /><h2 className="font-semibold">Achievements</h2></div>
          <ul className="mt-4 space-y-3 text-sm text-[var(--color-text-secondary)]">{profile.achievements.map((item) => <li key={item}>{item}</li>)}</ul>
        </Card>
      </div>
    </div>
  )
}
