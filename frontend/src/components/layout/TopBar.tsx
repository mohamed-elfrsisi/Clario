import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, Menu, Moon, Search, Sun } from 'lucide-react'
import { pageTitles } from '../../config/navigation'
import { UserMenu } from './UserMenu'
import { useTheme } from '../../hooks/useTheme'
import { useI18n } from '../../i18n/hooks'

interface TopBarProps {
  onMenuClick: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const location = useLocation()
  const [search, setSearch] = useState('')
  const title = pageTitles[location.pathname] ?? 'Clario'
  const { isDark, toggleTheme } = useTheme()
  const { t } = useI18n()
  const titleKey: Record<string, Parameters<typeof t>[0]> = { '/dashboard':'page.dashboard','/resume':'page.resume','/career-profile':'page.profile','/career-target':'page.target','/opportunities':'page.opportunities','/applications':'page.applications','/mock-interviews':'page.interviews','/career-analytics':'page.analytics','/documents':'page.documents','/analysis':'page.analysis','/bullets':'page.bullets','/profile':'page.userProfile','/settings':'page.settings' }
  const translatedTitle = titleKey[location.pathname] ? t(titleKey[location.pathname]) : title

  return (
    <header className="sticky top-0 z-20 flex h-14 flex-shrink-0 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] lg:hidden"
        aria-label={t('topbar.openNav')}
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{translatedTitle}</p>
        <p className="hidden text-[11px] text-[var(--color-text-muted)] sm:block">
          {t('topbar.workspace')}
        </p>
      </div>

      <div className="mx-auto hidden max-w-lg flex-1 md:block">
        <div className="relative">
          <Search className="topbar-search-icon pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('topbar.search')}
            className="h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] pl-9 pr-14 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-placeholder)] focus:border-[var(--color-accent-border)] focus:bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
          />
          <kbd className="topbar-search-shortcut pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)] lg:inline">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="ms-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
          title={isDark ? t('topbar.light') : t('topbar.dark')}
          aria-label={isDark ? t('topbar.light') : t('topbar.dark')}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
          title={t('topbar.notifications')}
          aria-label={t('topbar.notifications')}
        >
          <Bell className="h-4 w-4" />
          <span className="absolute end-2 top-2 h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
        </button>
        <UserMenu />
      </div>
    </header>
  )
}
