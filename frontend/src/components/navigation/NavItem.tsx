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
      end={item.to === '/dashboard'}
      className={({ isActive }) =>
        compact
          ? `group relative flex h-10 w-10 items-center justify-center rounded-lg transition ${
              isActive
                ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent-text)]'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'
            }`
          : `flex min-h-9 items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition ${
              isActive
                ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent-text)]'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'
            }`
      }
    >
      <item.icon className={compact ? 'h-[18px] w-[18px]' : 'h-[17px] w-[17px] flex-shrink-0'} />
      {!compact && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
      {!compact && badge != null && badge > 0 && (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-surface-tertiary)] px-1.5 text-[10px] font-semibold text-[var(--color-text-secondary)]">
          {badge}
        </span>
      )}
    </NavLink>
  )
}
