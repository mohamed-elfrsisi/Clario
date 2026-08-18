import type { NavGroup } from '../../config/navigation'
import { NavItem } from './NavItem'

interface NavSectionProps {
  group: NavGroup
  counts?: Record<string, number>
  onNavigate?: () => void
}

export function NavSection({ group, counts, onNavigate }: NavSectionProps) {
  return (
    <div className="mb-4">
      <p className="mb-1 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        {group.title}
      </p>
      <nav className="flex flex-col gap-0.5">
        {group.items.map((item) => (
          <NavItem
            key={item.to}
            item={item}
            badge={counts?.[item.to] ?? null}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    </div>
  )
}
