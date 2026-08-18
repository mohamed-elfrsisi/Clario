import type { NavGroup } from '../../config/navigation'
import { useI18n } from '../../i18n/hooks'
import { NavItem } from './NavItem'

interface NavSectionProps {
  group: NavGroup
  counts?: Record<string, number>
  onNavigate?: () => void
}

export function NavSection({ group, counts, onNavigate }: NavSectionProps) {
  const { t } = useI18n()
  const title = group.title === 'Career Workspace' ? t('nav.workspace') : group.title === 'Account' ? t('nav.account') : group.title

  return (
    <div className="mb-4">
      <p className="mb-1 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        {title}
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
