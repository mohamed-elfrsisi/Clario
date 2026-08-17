import { useState, useEffect } from 'react'
import { Briefcase, Plus, Trash2, ExternalLink } from 'lucide-react'
import { api } from '../api/client'
import { useToast } from '../hooks/useToast'

export function OpportunitiesPage() {
  const { add } = useToast()
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    text: '',
    title: '',
    region: '',
    role_type: '',
  })

  const loadOpportunities = async () => {
    setLoading(true)
    try {
      const res = await api.listOpportunities(0, 50)
      setOpportunities(res.data)
    } catch (err: any) {
      add('error', 'Failed to load opportunities')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.text.trim()) {
      add('error', 'Opportunity text is required')
      return
    }

    setLoading(true)
    try {
      await api.createOpportunity({
        text: form.text,
        title: form.title || undefined,
        region: form.region || undefined,
        role_type: form.role_type || undefined,
      })
      add('success', 'Opportunity created')
      setShowForm(false)
      setForm({ text: '', title: '', region: '', role_type: '' })
      loadOpportunities()
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Failed to create opportunity'
      add('error', detail)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOpportunities()
  }, [])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this opportunity?')) return
    try {
      await api.deleteOpportunity(id)
      add('success', 'Opportunity deleted')
      loadOpportunities()
    } catch (err: any) {
      add('error', 'Failed to delete opportunity')
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Opportunities</h1>
          <p className="mt-1 text-sm text-slate-500">Add and manage job opportunities to analyze against your resume</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4" />
          Add opportunity
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card p-5 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">New opportunity</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label">Title <span className="text-slate-400">(optional)</span></label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Senior Frontend Engineer"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Full description *</label>
              <textarea
                className="input min-h-[120px] resize-y"
                placeholder="Paste the full job description here..."
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
              />
              <p className="mt-1 text-xs text-slate-400">Include required and preferred qualifications for best results</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Region <span className="text-slate-400">(optional)</span></label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. US, UK, EU"
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Role type <span className="text-slate-400">(optional)</span></label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Full-time, Internship"
                  value={form.role_type}
                  onChange={(e) => setForm({ ...form, role_type: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="btn btn-primary flex-1">
                {loading ? 'Creating...' : 'Create opportunity'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="card p-8 text-center">
          <span className="h-6 w-6 animate-spin mx-auto rounded-full border-2 border-slate-300 border-t-indigo-500" />
          <p className="mt-3 text-sm text-slate-500">Loading opportunities...</p>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mx-auto mb-4">
            <Briefcase className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No opportunities yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Add a job description to analyze how well your resume matches.
          </p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary mt-4">
            Add your first opportunity
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {opportunities.map((opp) => (
            <div key={opp.opportunity_id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">
                      {opp.title || 'Untitled opportunity'}
                    </h3>
                    {opp.role_type && (
                      <span className="badge badge-neutral">{opp.role_type}</span>
                    )}
                    {opp.region && (
                      <span className="badge badge-info">{opp.region}</span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    ID: {opp.opportunity_id.slice(0, 8)}...
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => {/* TODO: navigate to details */}}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                    title="View details"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(opp.opportunity_id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
