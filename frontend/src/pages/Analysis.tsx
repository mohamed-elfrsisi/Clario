import { useState, useEffect } from 'react'
import { Search, X, CheckCircle, XCircle } from 'lucide-react'
import { api } from '../api/client'
import type { Document, Opportunity, Analysis } from '../api/types'
import { useToast } from '../hooks/useToast'
import { pageDescriptions } from '../config/navigation'
import { Badge } from '../components/ui/Badge'

export function AnalysisPage() {
  const { add } = useToast()
  const [documentId, setDocumentId] = useState('')
  const [opportunityId, setOpportunityId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Analysis | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])

  const loadData = async () => {
    try {
      const [dRes, oRes] = await Promise.all([
        api.listDocuments(0, 50),
        api.listOpportunities(0, 50),
      ])
      setDocuments(dRes.data)
      setOpportunities(oRes.data)
    } catch {
      add('error', 'Failed to load data')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!documentId || !opportunityId) {
      add('error', 'Please select both a document and an opportunity')
      return
    }

    setLoading(true)
    try {
      const res = await api.runAnalysis({ document_id: documentId, opportunity_id: opportunityId })
      setResult(res.data)
      add('success', 'Analysis complete')
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Analysis failed'
      add('error', detail)
    } finally {
      setLoading(false)
    }
  }

  const matchPct = result?.match_pct != null ? Math.round(result.match_pct * 100) : 0

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Career Intelligence</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">Resume Analysis</h2>
        <p className="mt-0.5 text-sm text-slate-500">{pageDescriptions['/analysis']}</p>
      </div>

      <form onSubmit={handleAnalyze} className="border border-slate-200 bg-white p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Resume / Document</label>
            <select
              className="input"
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
              required
            >
              <option value="">Select a document...</option>
              {documents.map((doc) => (
                <option key={doc.document_id} value={doc.document_id}>
                  {doc.filename || 'Untitled'} ({doc.doc_type || 'unanalyzed'})
                </option>
              ))}
            </select>
            {documents.length === 0 && (
              <p className="mt-1 text-xs text-slate-400">No documents available. Upload one first.</p>
            )}
          </div>
          <div>
            <label className="label">Opportunity</label>
            <select
              className="input"
              value={opportunityId}
              onChange={(e) => setOpportunityId(e.target.value)}
              required
            >
              <option value="">Select an opportunity...</option>
              {opportunities.map((opp) => (
                <option key={opp.opportunity_id} value={opp.opportunity_id}>
                  {opp.title || 'Untitled'} {opp.role_type ? `· ${opp.role_type}` : ''}
                </option>
              ))}
            </select>
            {opportunities.length === 0 && (
              <p className="mt-1 text-xs text-slate-400">No opportunities available. Add one first.</p>
            )}
          </div>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <button
            type="submit"
            disabled={loading || !documentId || !opportunityId}
            className="btn btn-primary text-xs"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Analyzing...
              </span>
            ) : (
              <>
                <Search className="h-3.5 w-3.5" />
                Analyze Resume
              </>
            )}
          </button>
        </div>
      </form>

      {result && (
        <div className="space-y-4">
          {/* Match score bar */}
          <div className="border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Match Score</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{matchPct}%</p>
              </div>
              <Badge variant={matchPct >= 60 ? 'success' : matchPct >= 40 ? 'warning' : 'error'}>
                {matchPct >= 80 ? 'Strong Match' :
                 matchPct >= 60 ? 'Good Match' :
                 matchPct >= 40 ? 'Partial Match' : 'Needs Work'}
              </Badge>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all ${
                  matchPct >= 60 ? 'bg-emerald-500' : matchPct >= 40 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${matchPct}%` }}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="border border-slate-200 bg-white p-4">
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Matched Skills
              </h3>
              {result.matched.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {result.matched.map((skill, i) => (
                    <Badge key={i} variant="success">{skill}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No matched skills</p>
              )}
            </div>
            <div className="border border-slate-200 bg-white p-4">
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <XCircle className="h-4 w-4 text-red-500" />
                Missing Skills
              </h3>
              {result.missing.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {result.missing.map((skill, i) => (
                    <Badge key={i} variant="error">{skill}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No missing skills</p>
              )}
            </div>
          </div>

          {result.parse_ability_score != null && (
            <div className="flex items-center justify-between border border-slate-200 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">ATS / Parseability</p>
                <p className="text-xs text-slate-400">How readable your document is for automated systems</p>
              </div>
              <span className="text-lg font-semibold tabular-nums text-slate-900">
                {(result.parse_ability_score * 100).toFixed(0)}%
              </span>
            </div>
          )}

          {result.report_text && (
            <div className="border border-slate-200 bg-white p-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Recommendations</h3>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                {result.report_text}
              </pre>
            </div>
          )}

          <button onClick={() => setResult(null)} className="btn btn-ghost text-xs">
            <X className="h-3.5 w-3.5" />
            Clear results
          </button>
        </div>
      )}

      {!result && (
        <div className="border border-dashed border-slate-200 bg-white px-4 py-12 text-center">
          <Search className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm font-medium text-slate-700">Ready to analyze</p>
          <p className="mt-0.5 text-xs text-slate-400">
            Select a document and opportunity above, then click Analyze Resume.
          </p>
        </div>
      )}
    </div>
  )
}
