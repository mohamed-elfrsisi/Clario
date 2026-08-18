import { primaryNav } from '../../config/navigation'
import { NavItem } from '../navigation/NavItem'
import { UserMenu } from './UserMenu'
import { BrandLogo } from '../brand/BrandLogo'

export function PrimarySidebar() {
  return (
    <aside className="hidden w-[64px] flex-shrink-0 flex-col items-center border-r border-[var(--color-border)] bg-[var(--color-surface)] py-4 md:flex">
      <div className="mb-6">
        <BrandLogo size="sm" />
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
