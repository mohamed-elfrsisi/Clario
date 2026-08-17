import { Settings as SettingsIcon, Shield, Info } from 'lucide-react'
import { useAuth } from '../auth/context'

export function SettingsPage() {
  const { user, logout } = useAuth()

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your account preferences</p>
      </div>

      {/* Account info */}
      <div className="card p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <SettingsIcon className="h-4 w-4" />
          Account
        </h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <p className="text-sm font-medium text-slate-900">Email</p>
              <p className="text-xs text-slate-400">Your account identifier</p>
            </div>
            <span className="text-sm text-slate-600">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <p className="text-sm font-medium text-slate-900">Authentication</p>
              <p className="text-xs text-slate-400">Bearer token based</p>
            </div>
            <span className="badge badge-success">Verified</span>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="card p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Security
        </h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <div>
              <p className="text-sm font-medium text-slate-900">Session</p>
              <p className="text-xs text-slate-400">Token stored in session storage</p>
            </div>
            <span className="badge badge-neutral">Session based</span>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={logout}
            className="btn btn-secondary w-full"
          >
            Sign out
          </button>
          <p className="mt-2 text-xs text-slate-400 text-center">
            You will need to sign in again to continue.
          </p>
        </div>
      </div>

      {/* About */}
      <div className="card p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Info className="h-4 w-4" />
          About Clario
        </h2>

        <div className="text-sm text-slate-600 space-y-2">
          <p>
            Clario is an AI-powered resume assistant that helps you understand exactly how well your resume
            matches a specific opportunity — and explains why, not just a score.
          </p>
          <p>
            All extraction and analysis runs locally. No external LLM APIs are used, and your data stays
            private to your account.
          </p>
          <p className="pt-2">
            <span className="font-medium">Version:</span> 0.2.0
          </p>
        </div>
      </div>
    </div>
  )
}
