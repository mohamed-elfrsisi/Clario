import { useState, useEffect } from 'react'
import { Save, Sparkles, Trash2, Plus } from 'lucide-react'
import { api } from '../api/client'
import { useToast } from '../hooks/useToast'

interface ExperienceEntry {
  title: string
  description: string
  confirmed_metrics: string[]
}

export function ProfilePage() {
  const { add } = useToast()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [skills, setSkills] = useState('')
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([])
  const [tailoring, setTailoring] = useState(false)
  const [tailoredResult, setTailoredResult] = useState<any>(null)

  const loadProfile = async () => {
    setLoading(true)
    try {
      const res = await api.getProfile()
      setProfile(res.data)
      setSkills(res.data.master_skills?.join(', ') || '')
      setExperiences(res.data.master_experience || [])
    } catch (err: any) {
      if (err.response?.status !== 404) {
        add('error', 'Failed to load profile')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const skillList = skills.split(',').map((s) => s.trim()).filter(Boolean)
    if (skillList.length === 0) {
      add('error', 'Please add at least one skill')
      return
    }

    setSaving(true)
    try {
      const res = await api.saveProfile({
        master_skills: skillList,
        master_experience: experiences,
      })
      setProfile(res.data)
      add('success', 'Profile saved')
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Failed to save profile'
      add('error', detail)
    } finally {
      setSaving(false)
    }
  }

  const handleTailor = async () => {
    if (!profile) {
      add('error', 'No profile to tailor. Create one first.')
      return
    }
    const oppId = window.prompt('Enter opportunity ID:')
    if (!oppId) return

    setTailoring(true)
    try {
      const res = await api.tailorProfile(oppId)
      setTailoredResult(res.data)
      add('success', 'Profile tailored')
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Tailoring failed'
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
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Save your core skills and experience once, then tailor them per opportunity.
        </p>
      </div>

      {/* Save form */}
      <div className="card p-5 mb-6">
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="label">Skills (comma-separated)</label>
            <textarea
              className="input min-h-[100px]"
              placeholder="Python, JavaScript, SQL, React, Docker, AWS..."
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-400">
              {skills.split(',').filter((s) => s.trim()).length} skills detected
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Experience</label>
              <button
                type="button"
                onClick={addExperience}
                className="btn btn-ghost text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Add entry
              </button>
            </div>

            <div className="space-y-3">
              {experiences.map((exp, idx) => (
                <div key={idx} className="card p-3 border border-slate-200">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <input
                      className="input flex-1 text-sm"
                      placeholder="Title"
                      value={exp.title}
                      onChange={(e) => updateExperience(idx, 'title', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeExperience(idx)}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <textarea
                    className="input min-h-[60px] text-sm"
                    placeholder="Description"
                    value={exp.description}
                    onChange={(e) => updateExperience(idx, 'description', e.target.value)}
                  />
                  <input
                    className="input text-sm mt-2"
                    placeholder="Confirmed metrics (comma-separated, e.g. 40% faster, 500 users)"
                    value={exp.confirmed_metrics.join(', ')}
                    onChange={(e) => updateExperience(idx, 'confirmed_metrics', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                  />
                </div>
              ))}
              {experiences.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">
                  No experience entries yet. Add one above.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving || loading} className="btn btn-primary">
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </span>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {profile ? 'Update profile' : 'Create profile'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Tailoring */}
      {profile && (
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Tailor to opportunity</h3>
              <p className="text-xs text-slate-400">Reorder skills and experience for a specific job</p>
            </div>
            <button
              onClick={handleTailor}
              disabled={tailoring}
              className="btn btn-secondary"
            >
              {tailoring ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                  Tailoring...
                </span>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Tailor now
                </>
              )}
            </button>
          </div>

          {tailoredResult && (
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Tailored skills</p>
                <div className="flex flex-wrap gap-2">
                  {tailoredResult.tailored_skills?.map((skill: string, i: number) => (
                    <span key={i} className="badge badge-success">{skill}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Tailored experience</p>
                {tailoredResult.tailored_experience?.length > 0 ? (
                  <div className="space-y-2">
                    {tailoredResult.tailored_experience.map((exp: any, i: number) => (
                      <div key={i} className="text-sm p-2 bg-slate-50 rounded-lg">
                        <p className="font-medium text-slate-900">{exp.title || 'Untitled'}</p>
                        <p className="text-slate-500">{exp.description || ''}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No experience to tailor</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Profile data display */}
      {profile && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Current profile data</h3>
          <div className="text-xs text-slate-500">
            <p><span className="font-medium text-slate-700">Profile ID:</span> {profile.profile_id}</p>
            <p><span className="font-medium text-slate-700">Skills:</span> {profile.master_skills?.join(', ') || 'None'}</p>
            {profile.master_experience && profile.master_experience.length > 0 && (
              <p><span className="font-medium text-slate-700">Experience entries:</span> {profile.master_experience.length}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
