import { NavLink } from 'react-router-dom'
import type { NavLinkItem } from '../../config/navigation'

interface NavItemProps {
  item: NavLinkItem
  compact?: boolean
  badge?: number | null
  onNavigate?: () => void
}

export function NavItem({ item, compact = false, badge, onNavigate }: NavItemProps) {
  return (
    <NavLink
      to={item.to}
      title={item.label}
      onClick={onNavigate}
      className={({ isActive }) =>
        compact
          ? `group relative flex h-10 w-10 items-center justify-center rounded-md transition-colors ${
              isActive
                ? 'bg-white/15 text-white'
                : 'text-indigo-200 hover:bg-white/10 hover:text-white'
            }`
          : `flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
              isActive
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`
      }
    >
      <item.icon className={compact ? 'h-5 w-5' : 'h-4 w-4 flex-shrink-0'} />
      {!compact && <span className="flex-1 truncate">{item.label}</span>}
      {!compact && badge != null && badge > 0 && (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded bg-slate-200 px-1.5 text-[11px] font-semibold text-slate-700">
          {badge}
        </span>
      )}
    </NavLink>
  )
}
