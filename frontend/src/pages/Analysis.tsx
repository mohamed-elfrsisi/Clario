import { useState, useEffect } from 'react'
import { Search, X, CheckCircle, XCircle } from 'lucide-react'
import { api } from '../api/client'
import { useToast } from '../hooks/useToast'

export function AnalysisPage() {
  const { add } = useToast()
  const [documentId, setDocumentId] = useState('')
  const [opportunityId, setOpportunityId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [opportunities, setOpportunities] = useState<any[]>([])

  const loadData = async () => {
    try {
      const dRes = await api.listDocuments(0, 50)
      setDocuments(dRes.data)
      const oRes = await api.listOpportunities(0, 50)
      setOpportunities(oRes.data)
    } catch {
      add('error', 'Failed to load data')
    }
  }

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
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Analysis failed'
      add('error', detail)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">New Analysis</h1>
        <p className="mt-1 text-sm text-slate-500">
          Select a document and an opportunity to analyze your resume match.
        </p>
      </div>

      <form onSubmit={handleAnalyze} className="card p-5 mb-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Document *</label>
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
            <label className="label">Opportunity *</label>
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

        <div className="mt-4">
          <button type="submit" disabled={loading || !documentId || !opportunityId} className="btn btn-primary">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Analyzing...
              </span>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Analyze match
              </>
            )}
          </button>
        </div>
      </form>

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Match score */}
          <div className="card p-6 text-center">
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">Match Score</h2>
            {result.match_pct !== null && (
              <div className="flex items-center justify-center gap-3">
                <div className="relative h-24 w-24">
                  <svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200 stroke-[3] fill-none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      strokeLinecap="round"
                      strokeDasharray={`${(result.match_pct || 0) * 0.55} 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      className={result.match_pct && result.match_pct >= 0.6 ? 'text-emerald-500 stroke-[3] fill-none' : result.match_pct && result.match_pct >= 0.4 ? 'text-amber-500 stroke-[3] fill-none' : 'text-red-500 stroke-[3] fill-none'}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-slate-900">
                      {((result.match_pct || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className={`text-lg font-semibold ${
                    result.match_pct && result.match_pct >= 0.6 ? 'text-emerald-700' :
                    result.match_pct && result.match_pct >= 0.4 ? 'text-amber-700' :
                    'text-red-700'
                  }`}>
                    {result.match_pct && result.match_pct >= 0.8 ? 'Strong Match' :
                     result.match_pct && result.match_pct >= 0.6 ? 'Good Match' :
                     result.match_pct && result.match_pct >= 0.4 ? 'Partial Match' :
                     'Needs Work'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Matched / Missing skills */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Matched skills
              </h3>
              {result.matched && result.matched.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.matched.map((skill: string, i: number) => (
                    <span key={i} className="badge badge-success">{skill}</span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No matched skills</p>
              )}
            </div>
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                Missing skills
              </h3>
              {result.missing && result.missing.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.missing.map((skill: string, i: number) => (
                    <span key={i} className="badge badge-error">{skill}</span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No missing skills</p>
              )}
            </div>
          </div>

          {/* Report */}
          {result.report_text && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Detailed Report</h3>
              <pre className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                {result.report_text}
              </pre>
            </div>
          )}

          {/* Parse ability */}
          {result.parse_ability_score !== null && (
            <div className="card p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">Parse ability score</p>
                <p className="text-xs text-slate-400">How readable your document is</p>
              </div>
              <span className="text-lg font-bold text-slate-900">
                {(result.parse_ability_score * 100).toFixed(0)}%
              </span>
            </div>
          )}

          <button
            onClick={() => setResult(null)}
            className="btn btn-ghost text-sm"
          >
            <X className="h-4 w-4" />
            Clear results
          </button>
        </div>
      )}

      {/* Empty state */}
      {!result && (
        <div className="card p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mx-auto mb-4">
            <Search className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Ready to analyze</h3>
          <p className="text-sm text-slate-500">
            Select a document and opportunity above, then click Analyze.
          </p>
        </div>
      )}
    </div>
  )
}
