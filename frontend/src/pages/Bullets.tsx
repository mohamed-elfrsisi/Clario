import React, { useState } from 'react'
import { Pencil, ArrowRight, Copy, AlertCircle } from 'lucide-react'
import { api } from '../api/client'
import { useToast } from '../hooks/useToast'

export function BulletsPage() {
  const { add } = useToast()
  const [input, setInput] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleRewrite = async (e: React.FormEvent) => {
    e.preventDefault()
    const bullets = input.split('\n').map((b) => b.trim()).filter(Boolean)
    if (bullets.length === 0) {
      add('error', 'Please enter at least one bullet point')
      return
    }

    setLoading(true)
    try {
      const res = await api.rewriteBullets(bullets)
      setResults(res.data)
      add('success', `Rewritten ${res.data.length} bullet${res.data.length > 1 ? 's' : ''}`)
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Failed to rewrite bullets'
      add('error', detail)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    add('success', 'Copied to clipboard')
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Bullet Rewrite</h1>
        <p className="mt-1 text-sm text-slate-500">
          Improve weak resume bullets into stronger, results-oriented statements.
        </p>
      </div>

      <div className="card p-5 mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Enter your bullets</h3>
        <p className="text-sm text-slate-500 mb-4">
          Write one bullet per line. The tool will suggest improvements for each.
        </p>

        <form onSubmit={handleRewrite} className="space-y-4">
          <textarea
            className="input min-h-[200px] resize-y font-mono text-sm"
            placeholder="Made a website using Django&#10;Helped with testing&#10;Led a team of 4 students to deliver a capstone project"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Analyzing...
                </span>
              ) : (
                <>
                  <Pencil className="h-4 w-4" />
                  Rewrite bullets
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setInput('')}
              className="btn btn-ghost"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Improved bullets</h3>
          {results.map((result, idx) => (
            <div key={idx} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  {/* Original */}
                  <div className="mb-3">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Original</p>
                    <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 border-l-4 border-slate-300">
                      {result.original}
                    </p>
                  </div>

                  {/* Rewritten */}
                  {result.rewritten !== result.original && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Improved</p>
                      <p className="text-sm text-slate-900 bg-indigo-50 rounded-lg p-3 border-l-4 border-indigo-500">
                        {result.rewritten}
                      </p>
                      {result.needs_review && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg p-2">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>
                            {result.placeholders_added > 0
                              ? `Fill in ${result.placeholders_added} placeholder${result.placeholders_added > 1 ? 's' : ''} with your actual metrics`
                              : 'Review and adjust if needed'}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() => copyToClipboard(result.rewritten)}
                        className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                      >
                        <Copy className="h-3 w-3" />
                        Copy improved
                      </button>
                    </div>
                  )}

                  {result.rewritten === result.original && (
                    <div className="mt-2 text-xs text-slate-400">
                      This bullet is already well-written.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Examples */}
      <div className="mt-8 card p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Example improvements</h3>
        <div className="space-y-2 text-xs">
          {[
            ['Made a website using Django', 'Built a full-stack e-commerce platform using Django, resulting in [describe the outcome]'],
            ['Helped with testing', '[Choose a stronger verb] testing for [project name], resulting in [describe the outcome]'],
            ['Worked on a team project', 'Collaborated with a team of 4 to deliver [project], resulting in [describe the outcome]'],
          ].map(([before, after]) => (
            <div key={before} className="flex gap-3">
              <span className="font-mono text-slate-400">{before}</span>
              <ArrowRight className="h-3 w-3 text-slate-300 flex-shrink-0 mt-0.5" />
              <span className="font-mono text-indigo-600">{after}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
