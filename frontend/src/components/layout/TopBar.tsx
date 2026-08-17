import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, Menu, Search } from 'lucide-react'
import { pageTitles } from '../../config/navigation'
import { UserMenu } from './UserMenu'

interface TopBarProps {
  onMenuClick: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const location = useLocation()
  const [search, setSearch] = useState('')
  const title = pageTitles[location.pathname] ?? 'Clario'

  return (
    <header className="flex h-12 flex-shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4">
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Page title */}
      <div className="min-w-0 flex-shrink-0">
        <h1 className="truncate text-sm font-semibold text-slate-900">{title}</h1>
      </div>

      {/* Search */}
      <div className="mx-auto hidden max-w-md flex-1 md:block">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workspace..."
            className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-16 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:inline">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Actions */}
      <div className="ml-auto flex items-center gap-1">
        <button
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>
        <UserMenu />
      </div>
    </header>
  )
}
