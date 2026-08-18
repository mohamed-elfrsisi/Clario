import { ChevronLeft, ChevronRight } from 'lucide-react'
import { secondaryNavGroups } from '../../config/navigation'
import { NavSection } from '../navigation/NavSection'
import { useAuth } from '../../auth/context'

interface SecondarySidebarProps {
  collapsed: boolean
  onToggle: () => void
  onNavigate?: () => void
  mobile?: boolean
}

export function SecondarySidebar({ collapsed, onToggle, onNavigate, mobile = false }: SecondarySidebarProps) {
  const { user } = useAuth()

  if (collapsed && !mobile) {
    return (
      <aside className="hidden w-10 flex-shrink-0 flex-col items-center border-r border-[var(--color-border)] bg-[var(--color-surface)] py-4 lg:flex">
        <button
          type="button"
          onClick={onToggle}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]"
          title="Expand sidebar"
          aria-label="Expand sidebar"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </aside>
    )
  }

  return (
    <aside
      className={`flex w-[248px] flex-shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] ${
        mobile ? 'h-full' : 'hidden lg:flex'
      }`}
    >
      <div className="flex min-h-[64px] items-center justify-between border-b border-[var(--color-border)] px-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Clario</p>
          <p className="truncate text-[11px] text-[var(--color-text-muted)]">{user?.email}</p>
        </div>
        {!mobile && (
          <button
            type="button"
            onClick={onToggle}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {secondaryNavGroups.map((group) => (
          <NavSection key={group.title} group={group} onNavigate={onNavigate} />
        ))}
      </div>
    </aside>
  )
}
