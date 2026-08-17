import { useState, type ReactNode } from 'react'
import { PrimarySidebar } from './PrimarySidebar'
import { SecondarySidebar } from './SecondarySidebar'
import { TopBar } from './TopBar'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [secondaryCollapsed, setSecondaryCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <PrimarySidebar />

      <SecondarySidebar
        collapsed={secondaryCollapsed}
        onToggle={() => setSecondaryCollapsed(!secondaryCollapsed)}
      />

      {/* Mobile nav overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full shadow-xl">
            <SecondarySidebar
              collapsed={false}
              onToggle={() => {}}
              mobile
              onNavigate={() => setMobileNavOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main workspace */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-5 md:px-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
