import { primaryNav } from '../../config/navigation'
import { NavItem } from '../navigation/NavItem'
import { UserMenu } from './UserMenu'

export function PrimarySidebar() {
  return (
    <aside className="hidden w-[64px] flex-shrink-0 flex-col items-center border-r border-white/10 bg-[#252421] py-4 md:flex">
      <div className="mb-6 flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent)] text-sm font-bold text-[var(--color-accent-contrast)]">
        C
      </div>

      <nav aria-label="Primary navigation" className="flex flex-1 flex-col items-center gap-1">
        {primaryNav.map((item) => (
          <NavItem key={item.to} item={item} compact />
        ))}
      </nav>

      <div className="mt-auto pt-4">
        <UserMenu compact />
      </div>
    </aside>
  )
}
