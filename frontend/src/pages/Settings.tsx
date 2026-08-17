import { useState } from 'react'
import { Shield, Info, Bell, User } from 'lucide-react'
import { useAuth } from '../auth/context'
import { pageDescriptions } from '../config/navigation'
import { Badge } from '../components/ui/Badge'

type SettingsSection = 'account' | 'preferences' | 'notifications' | 'security'

const sections: { id: SettingsSection; label: string; icon: typeof User }[] = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'preferences', label: 'Preferences', icon: Info },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
]

export function SettingsPage() {
  const { user, logout } = useAuth()
  const [active, setActive] = useState<SettingsSection>('account')

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Account</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">Settings</h2>
        <p className="mt-0.5 text-sm text-slate-500">{pageDescriptions['/settings']}</p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        {/* Settings nav */}
        <nav className="flex w-full flex-shrink-0 flex-row gap-1 overflow-x-auto border border-slate-200 bg-white p-1 md:w-48 md:flex-col">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`flex items-center gap-2 rounded px-2.5 py-2 text-left text-sm font-medium transition whitespace-nowrap ${
                active === s.id
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <s.icon className="h-4 w-4 flex-shrink-0" />
              {s.label}
            </button>
          ))}
        </nav>

        {/* Settings content */}
        <div className="min-w-0 flex-1 border border-slate-200 bg-white">
          {active === 'account' && (
            <div className="divide-y divide-slate-100">
              <div className="px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">Account</h3>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">Email</p>
                  <p className="text-xs text-slate-400">Your account identifier</p>
                </div>
                <span className="text-sm text-slate-600">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">Authentication</p>
                  <p className="text-xs text-slate-400">Bearer token based</p>
                </div>
                <Badge variant="success">Verified</Badge>
              </div>
            </div>
          )}

          {active === 'preferences' && (
            <div className="px-4 py-6">
              <h3 className="text-sm font-semibold text-slate-900">Preferences</h3>
              <p className="mt-2 text-sm text-slate-500">
                Workspace preferences will be available in a future update.
              </p>
            </div>
          )}

          {active === 'notifications' && (
            <div className="px-4 py-6">
              <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
              <p className="mt-2 text-sm text-slate-500">
                Notification settings will be available in a future update.
              </p>
            </div>
          )}

          {active === 'security' && (
            <div className="divide-y divide-slate-100">
              <div className="px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">Security</h3>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">Session</p>
                  <p className="text-xs text-slate-400">Token stored in session storage</p>
                </div>
                <Badge variant="neutral">Session based</Badge>
              </div>
              <div className="px-4 py-4">
                <button onClick={logout} className="btn btn-secondary w-full text-xs">
                  Sign out
                </button>
                <p className="mt-2 text-center text-xs text-slate-400">
                  You will need to sign in again to continue.
                </p>
              </div>
            </div>
          )}

          {active === 'account' && (
            <div className="border-t border-slate-100 px-4 py-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">About Clario</h4>
              <p className="mt-2 text-sm text-slate-600">
                Clario is a career intelligence platform that helps you understand how well your resume
                matches specific opportunities — with explainable analysis, not just a score.
              </p>
              <p className="mt-2 text-xs text-slate-400">Version 0.2.0</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
