import { Languages } from 'lucide-react'
import { useI18n } from '../../i18n/hooks'

export function LanguageSwitcher() {
  const { language, setLanguage } = useI18n()
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1" role="group" aria-label="Language">
      <Languages className="mx-1 h-4 w-4 text-[var(--color-text-muted)]" aria-hidden="true" />
      <button type="button" onClick={() => setLanguage('en')} aria-pressed={language === 'en'} className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${language === 'en' ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent-text)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'}`}>EN</button>
      <button type="button" onClick={() => setLanguage('ar')} aria-pressed={language === 'ar'} className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${language === 'ar' ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent-text)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'}`}>العربية</button>
    </div>
  )
}
