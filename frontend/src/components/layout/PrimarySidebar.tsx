import { primaryNav } from '../../config/navigation'
import { NavItem } from '../navigation/NavItem'
import { UserMenu } from './UserMenu'

export function PrimarySidebar() {
  return (
    <aside className="hidden md:flex w-[68px] flex-shrink-0 flex-col items-center border-r border-indigo-900/30 bg-indigo-950 py-3">
      {/* Logo */}
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-indigo-600 text-sm font-bold text-white">
        C
      </div>

      {/* Primary nav icons */}
      <nav className="flex flex-1 flex-col items-center gap-1">
        {primaryNav.map((item) => (
          <NavItem key={item.to} item={item} compact />
        ))}
      </nav>

      {/* User avatar */}
      <div className="mt-auto pt-3">
        <UserMenu compact />
      </div>
    </aside>
  )
}
