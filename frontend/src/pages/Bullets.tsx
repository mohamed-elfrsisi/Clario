import { useState } from 'react'
import { useI18n } from '../i18n/hooks'
import { Pencil, Copy, AlertCircle, ArrowDown } from 'lucide-react'
import { api } from '../api/client'
import type { BulletRewriteResult } from '../api/types'
import { useToast } from '../hooks/useToast'
import { pageDescriptions } from '../config/navigation'

export function BulletsPage() {
  const { t } = useI18n()
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
      add('error', t('Please enter at least one bullet point'))
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
    add('success', t('Copied to clipboard'))
  }

  const selected = results[selectedIdx]

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-placeholder)]">{t("Career Intelligence")}</p>
        <h2 className="mt-1 text-lg font-semibold text-[var(--color-text)]">{t("Bullet Writer")}</h2>
        <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">{pageDescriptions['/bullets']}</p>
      </div>

      <form onSubmit={handleRewrite}>
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Original input */}
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{t("Original")}</span>
              <span className="text-[11px] text-[var(--color-text-placeholder)]">{bullets.length} {t("bullets ·")} {wordCount} {t("words")}</span>
            </div>
            <textarea
              className="w-full resize-y border-0 px-3 py-3 font-mono text-sm text-[var(--color-text-secondary)] focus:outline-none focus:ring-0 min-h-[220px]"
              placeholder={"Worked on a website using Django\nHelped with testing\nLed a team of 4 students"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>

          {/* Result */}
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{t("Clario")}</span>
              {selected && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(selected.rewritten)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-accent-text)] hover:text-[var(--color-accent-text)]"
                >
                  <Copy className="h-3 w-3" />
                  {t("Copy")}
                </button>
              )}
            </div>
            <div className="min-h-[220px] px-3 py-3">
              {loading ? (
                <div className="flex h-full items-center justify-center py-16">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-border-strong)] border-t-[var(--color-accent)]" />
                </div>
              ) : selected ? (
                <div>
                  <p className="font-mono text-sm leading-relaxed text-[var(--color-text)]">{selected.rewritten}</p>
                  {selected.needs_review && (
                    <div className="mt-3 flex items-start gap-2 rounded border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-2.5 py-2 text-xs text-[var(--color-warning-text)]">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                      {selected.placeholders_added > 0
                        ? `Fill in ${selected.placeholders_added} placeholder${selected.placeholders_added > 1 ? 's' : ''} with your actual metrics`
                        : 'Review and adjust if needed'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                  <ArrowDown className="h-5 w-5 text-[var(--color-border-strong)]" />
                  <p className="mt-2 text-xs text-[var(--color-text-placeholder)]">{t("Rewritten bullets will appear here")}</p>
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
            {t("Clear")}
          </button>
        </div>
      </form>

      {/* All results list */}
      {results.length > 1 && (
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="border-b border-[var(--color-border)] px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              {t("All results (")}{results.length})
            </span>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {results.map((r, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedIdx(idx)}
                className={`flex w-full items-start gap-3 px-3 py-2.5 text-left transition hover:bg-[var(--color-surface-secondary)] ${
                  idx === selectedIdx ? 'bg-[var(--color-accent-soft)]' : ''
                }`}
              >
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-[var(--color-surface-tertiary)] text-[10px] font-semibold text-[var(--color-text-muted)]">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-[var(--color-text-placeholder)]">{r.original}</p>
                  <p className="mt-0.5 truncate text-sm text-[var(--color-text)]">{r.rewritten}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
