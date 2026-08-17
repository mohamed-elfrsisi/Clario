import { ChevronLeft, ChevronRight } from 'lucide-react'
import { secondaryNavGroups } from '../../config/navigation'
import { NavSection } from '../navigation/NavSection'
import { useDashboardData } from '../../hooks/useDashboardData'
import { useAuth } from '../../auth/context'

interface SecondarySidebarProps {
  collapsed: boolean
  onToggle: () => void
  onNavigate?: () => void
  mobile?: boolean
}

export function SecondarySidebar({ collapsed, onToggle, onNavigate, mobile = false }: SecondarySidebarProps) {
  const { user } = useAuth()
  const { documentsCount, opportunitiesCount } = useDashboardData()

  const counts: Record<string, number> = {
    '/documents': documentsCount,
    '/opportunities': opportunitiesCount,
  }

  if (collapsed && !mobile) {
    return (
      <aside className="hidden lg:flex w-10 flex-shrink-0 flex-col items-center border-r border-slate-200 bg-white py-3">
        <button
          onClick={onToggle}
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          title="Expand sidebar"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </aside>
    )
  }

  return (
    <aside
      className={`flex w-[260px] flex-shrink-0 flex-col border-r border-slate-200 bg-white ${
        mobile ? 'h-full' : 'hidden lg:flex'
      }`}
    >
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b border-slate-200 px-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">Clario</p>
          <p className="truncate text-[11px] text-slate-400">{user?.email}</p>
        </div>
        {!mobile && (
          <button
            onClick={onToggle}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation groups */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {secondaryNavGroups.map((group) => (
          <NavSection
            key={group.title}
            group={group}
            counts={counts}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </aside>
  )
}
