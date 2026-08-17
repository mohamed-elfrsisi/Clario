import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Search,
  Pencil,
  User,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../../auth/context'
import { useDashboardData } from '../../hooks/useDashboardData'

export function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { documentsCount, opportunitiesCount, analysesCount } = useDashboardData()

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', count: null },
    { to: '/documents', icon: FileText, label: 'Documents', count: documentsCount },
    { to: '/opportunities', icon: Briefcase, label: 'Opportunities', count: opportunitiesCount },
    { to: '/analysis', icon: Search, label: 'Analysis', count: analysesCount },
    { to: '/bullets', icon: Pencil, label: 'Bullet Rewrite', count: null },
    { to: '/profile', icon: User, label: 'Profile', count: null },
    { to: '/settings', icon: Settings, label: 'Settings', count: null },
  ]

  return (
    <>
      {/* Mobile overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/30 md:hidden"
        onClick={() => navigate('/dashboard')}
      />

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 -translate-x-full transform bg-white border-r border-slate-200 flex flex-col md:translate-x-0 md:relative">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-slate-900">Clario</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => navigate(item.to)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.count !== null && item.count > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-100 px-1.5 text-xs font-medium text-indigo-700">
                  {item.count}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium">
              {user?.email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="fixed top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
        <button
          onClick={() => document.querySelector('aside')?.classList.toggle('-translate-x-full')}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-900">Clario</span>
        </div>
        <div className="ml-4 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium">
          {user?.email.charAt(0).toUpperCase()}
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 z-30 flex max-w-md items-center justify-around border-t border-slate-200 bg-white px-2 py-2 md:hidden">
        {navItems.slice(0, 5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => navigate(item.to)}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 text-xs transition-colors ${
                isActive ? 'text-indigo-600' : 'text-slate-500'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
