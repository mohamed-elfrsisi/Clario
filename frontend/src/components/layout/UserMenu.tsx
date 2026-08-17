import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Settings } from 'lucide-react'
import { useAuth } from '../../auth/context'

interface UserMenuProps {
  compact?: boolean
}

export function UserMenu({ compact = false }: UserMenuProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const initial = user?.email?.charAt(0).toUpperCase() ?? '?'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (compact) {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex h-9 w-9 items-center justify-center rounded-md bg-indigo-500/30 text-xs font-semibold text-white ring-2 ring-indigo-400/30 transition hover:bg-indigo-500/40"
          title={user?.email ?? 'Account'}
        >
          {initial}
        </button>
        {open && (
          <div className="absolute bottom-full left-0 z-50 mb-2 w-56 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
            <UserMenuDropdown email={user?.email} onLogout={handleLogout} onSettings={() => { setOpen(false); navigate('/settings') }} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-100 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-200"
      >
        {initial}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          <UserMenuDropdown email={user?.email} onLogout={handleLogout} onSettings={() => { setOpen(false); navigate('/settings') }} />
        </div>
      )}
    </div>
  )
}

function UserMenuDropdown({
  email,
  onLogout,
  onSettings,
}: {
  email?: string
  onLogout: () => void
  onSettings: () => void
}) {
  return (
    <>
      <div className="border-b border-slate-100 px-3 py-2">
        <p className="truncate text-sm font-medium text-slate-900">{email}</p>
        <p className="text-xs text-slate-400">Career workspace</p>
      </div>
      <button
        onClick={onSettings}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
      >
        <Settings className="h-4 w-4 text-slate-400" />
        Settings
      </button>
      <button
        onClick={onLogout}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
      >
        <LogOut className="h-4 w-4 text-slate-400" />
        Sign out
      </button>
    </>
  )
}

export function UserAvatar({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const { user } = useAuth()
  const initial = user?.email?.charAt(0).toUpperCase() ?? '?'
  const sizeClass = size === 'sm' ? 'h-7 w-7 text-[11px]' : 'h-8 w-8 text-xs'
  return (
    <div className={`flex items-center justify-center rounded-md bg-indigo-100 font-semibold text-indigo-700 ${sizeClass}`}>
      {initial}
    </div>
  )
}
