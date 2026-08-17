import { useState } from 'react'
import { Pencil, Copy, AlertCircle, ArrowDown } from 'lucide-react'
import { api } from '../api/client'
import type { BulletRewriteResult } from '../api/types'
import { useToast } from '../hooks/useToast'
import { pageDescriptions } from '../config/navigation'

export function BulletsPage() {
  const { add } = useToast()
  const [input, setInput] = useState('')
  const [results, setResults] = useState<BulletRewriteResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(0)

  const bullets = input.split('\n').map((b) => b.trim()).filter(Boolean)
  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0

  const handleRewrite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (bullets.length === 0) {
      add('error', 'Please enter at least one bullet point')
      return
    }

    setLoading(true)
    try {
      const res = await api.rewriteBullets(bullets)
      setResults(res.data)
      setSelectedIdx(0)
      add('success', `Rewritten ${res.data.length} bullet${res.data.length > 1 ? 's' : ''}`)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to rewrite bullets'
      add('error', detail)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    add('success', 'Copied to clipboard')
  }

  const selected = results[selectedIdx]

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Career Intelligence</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">Bullet Writer</h2>
        <p className="mt-0.5 text-sm text-slate-500">{pageDescriptions['/bullets']}</p>
      </div>

      <form onSubmit={handleRewrite}>
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Original input */}
          <div className="border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Original</span>
              <span className="text-[11px] text-slate-400">{bullets.length} bullets · {wordCount} words</span>
            </div>
            <textarea
              className="w-full resize-y border-0 px-3 py-3 font-mono text-sm text-slate-700 focus:outline-none focus:ring-0 min-h-[220px]"
              placeholder={"Worked on a website using Django\nHelped with testing\nLed a team of 4 students"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>

          {/* Result */}
          <div className="border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Clario</span>
              {selected && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(selected.rewritten)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700"
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </button>
              )}
            </div>
            <div className="min-h-[220px] px-3 py-3">
              {loading ? (
                <div className="flex h-full items-center justify-center py-16">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
                </div>
              ) : selected ? (
                <div>
                  <p className="font-mono text-sm leading-relaxed text-slate-900">{selected.rewritten}</p>
                  {selected.needs_review && (
                    <div className="mt-3 flex items-start gap-2 rounded border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-800">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                      {selected.placeholders_added > 0
                        ? `Fill in ${selected.placeholders_added} placeholder${selected.placeholders_added > 1 ? 's' : ''} with your actual metrics`
                        : 'Review and adjust if needed'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                  <ArrowDown className="h-5 w-5 text-slate-300" />
                  <p className="mt-2 text-xs text-slate-400">Rewritten bullets will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button type="submit" disabled={loading || bullets.length === 0} className="btn btn-primary text-xs">
            <Pencil className="h-3.5 w-3.5" />
            {loading ? 'Rewriting...' : 'Rewrite bullets'}
          </button>
          <button type="button" onClick={() => { setInput(''); setResults([]) }} className="btn btn-ghost text-xs">
            Clear
          </button>
        </div>
      </form>

      {/* All results list */}
      {results.length > 1 && (
        <div className="border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              All results ({results.length})
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {results.map((r, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedIdx(idx)}
                className={`flex w-full items-start gap-3 px-3 py-2.5 text-left transition hover:bg-slate-50 ${
                  idx === selectedIdx ? 'bg-indigo-50/50' : ''
                }`}
              >
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-slate-100 text-[10px] font-semibold text-slate-500">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-slate-400">{r.original}</p>
                  <p className="mt-0.5 truncate text-sm text-slate-900">{r.rewritten}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
