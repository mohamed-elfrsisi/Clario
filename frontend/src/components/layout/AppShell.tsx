import { useState, type ReactNode } from 'react'
import { PrimarySidebar } from './PrimarySidebar'
import { SecondarySidebar } from './SecondarySidebar'
import { TopBar } from './TopBar'
import { useI18n } from '../../i18n/hooks'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [secondaryCollapsed, setSecondaryCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const { t } = useI18n()

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <PrimarySidebar />

      <SecondarySidebar
        collapsed={secondaryCollapsed}
        onToggle={() => setSecondaryCollapsed((value) => !value)}
      />

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={t('nav.closeNav')}
            className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute start-0 top-0 h-full w-[280px] shadow-[var(--shadow-xl)]">
            <SecondarySidebar
              collapsed={false}
              onToggle={() => {}}
              mobile
              onNavigate={() => setMobileNavOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <TopBar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[var(--content-max-width)] px-4 py-5 pb-8 sm:px-6 lg:px-8 lg:py-7">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
