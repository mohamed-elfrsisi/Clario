import { useState, useEffect, useMemo } from 'react'
import { Briefcase, Plus, Trash2, Search } from 'lucide-react'
import { api } from '../api/client'
import type { Opportunity } from '../api/types'
import { useToast } from '../hooks/useToast'
import { pageDescriptions } from '../config/navigation'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/ui/Table'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'

export function OpportunitiesPage() {
  const { add } = useToast()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

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
    } catch {
      add('error', 'Failed to load opportunities')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOpportunities()
  }, [])

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return opportunities
    const q = searchQuery.toLowerCase()
    return opportunities.filter(
      (o) =>
        o.title?.toLowerCase().includes(q) ||
        o.role_type?.toLowerCase().includes(q) ||
        o.region?.toLowerCase().includes(q)
    )
  }, [opportunities, searchQuery])

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
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to create opportunity'
      add('error', detail)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this opportunity?')) return
    try {
      await api.deleteOpportunity(id)
      add('success', 'Opportunity deleted')
      loadOpportunities()
    } catch {
      add('error', 'Failed to delete opportunity')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Workspace</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Opportunities</h2>
          <p className="mt-0.5 text-sm text-slate-500">{pageDescriptions['/opportunities']}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary text-xs">
          <Plus className="h-3.5 w-3.5" />
          Add opportunity
        </button>
      </div>

      {showForm && (
        <div className="border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">New opportunity</h3>
          <form onSubmit={handleCreate} className="space-y-3">
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
                className="input min-h-[100px] resize-y"
                placeholder="Paste the full job description here..."
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Region</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. US, UK"
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Role type</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Full-time"
                  value={form.role_type}
                  onChange={(e) => setForm({ ...form, role_type: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="btn btn-primary text-xs">
                {loading ? 'Creating...' : 'Create opportunity'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary text-xs">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      {opportunities.length > 0 && (
        <div className="relative max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter opportunities..."
            className="input pl-8 text-sm"
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center border border-slate-200 bg-white py-16">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
        </div>
      ) : opportunities.length === 0 ? (
        <div className="border border-slate-200 bg-white">
          <EmptyState
            icon={Briefcase}
            title="No opportunities yet"
            description="Add a job description to analyze how well your resume matches."
            action={
              <button onClick={() => setShowForm(true)} className="btn btn-primary text-xs">
                Add your first opportunity
              </button>
            }
          />
        </div>
      ) : (
        <Table>
          <TableHead>
            <TableHeaderCell>Job</TableHeaderCell>
            <TableHeaderCell>Role Type</TableHeaderCell>
            <TableHeaderCell>Region</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell className="text-right">Actions</TableHeaderCell>
          </TableHead>
          <TableBody>
            {filtered.map((opp) => (
              <TableRow key={opp.opportunity_id}>
                <TableCell className="font-medium text-slate-900">
                  {opp.title || 'Untitled opportunity'}
                </TableCell>
                <TableCell className="text-slate-500">{opp.role_type || '—'}</TableCell>
                <TableCell className="text-slate-500">{opp.region || '—'}</TableCell>
                <TableCell><Badge variant="info">Active</Badge></TableCell>
                <TableCell className="text-right">
                  <button
                    onClick={() => handleDelete(opp.opportunity_id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
