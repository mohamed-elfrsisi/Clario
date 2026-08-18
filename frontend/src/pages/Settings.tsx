import type { ReactNode } from 'react'
import { useState } from 'react'
import { Bell, Info, Monitor, Moon, Shield, Sun, User, LogOut } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { pageDescriptions } from '../config/navigation'
import { Badge, Button, Card } from '../components/ui/ui'
import { useTheme, type ThemeMode } from '../hooks/useTheme'

type SettingsSection = 'account' | 'preferences' | 'notifications' | 'security'

const sections: Array<{ id: SettingsSection; label: string; icon: typeof User }> = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'preferences', label: 'Preferences', icon: Info },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
]

export function SettingsPage() {
  const { user, logout } = useAuth()
  const [active, setActive] = useState<SettingsSection>('account')
  const { mode, setMode } = useTheme()

  return (
    <div className="space-y-7">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent-text)]">Account</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">{pageDescriptions['/settings']}</p>
      </section>

      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <Card className="h-fit p-2">
          <nav aria-label="Settings sections" className="flex gap-1 overflow-x-auto lg:flex-col">
            {sections.map((section) => {
              const Icon = section.icon
              const selected = active === section.id
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActive(section.id)}
                  aria-current={selected ? 'page' : undefined}
                  className={`flex min-h-10 shrink-0 items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm font-medium transition-colors ${selected ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent-text)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'}`}
                >
                  <Icon className="h-4 w-4" />
                  {section.label}
                </button>
              )
            })}
          </nav>
        </Card>

        <Card>
          {active === 'account' && (
            <div>
              <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
                <h2 className="text-base font-semibold text-[var(--color-text)]">Account</h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Your Clario account information.</p>
              </div>
              <div className="divide-y divide-[var(--color-border)]">
                <SettingRow label="Email" description="Your account identifier">
                  <span className="max-w-[60%] truncate text-sm text-[var(--color-text-secondary)]">{user?.email || '—'}</span>
                </SettingRow>
                <SettingRow label="Authentication" description="Bearer token based">
                  <Badge variant="success">Verified</Badge>
                </SettingRow>
              </div>
              <AboutClario />
            </div>
          )}

          {active === 'preferences' && (
            <div>
              <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
                <h2 className="text-base font-semibold text-[var(--color-text)]">Preferences</h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Choose how Clario should look on your device.</p>
              </div>
              <div className="px-5 py-5 sm:px-6">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">Appearance</p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">Your choice is saved and follows you across sessions.</p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Appearance mode">
                  <ThemeOption mode="light" current={mode} onSelect={setMode} icon={Sun} title="Light" description="Cream and white" />
                  <ThemeOption mode="dark" current={mode} onSelect={setMode} icon={Moon} title="Dark" description="Low-light workspace" />
                  <ThemeOption mode="system" current={mode} onSelect={setMode} icon={Monitor} title="System" description="Follow device" />
                </div>
              </div>
            </div>
          )}

          {active === 'notifications' && (
            <SettingPlaceholder
              icon={Bell}
              title="Notifications"
              description="Notification settings will be available in a future update."
            />
          )}

          {active === 'security' && (
            <div>
              <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
                <h2 className="text-base font-semibold text-[var(--color-text)]">Security</h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Manage your current session.</p>
              </div>
              <div className="divide-y divide-[var(--color-border)]">
                <SettingRow label="Session" description="Token stored in session storage">
                  <Badge variant="neutral">Session based</Badge>
                </SettingRow>
                <div className="px-5 py-5 sm:px-6">
                  <Button variant="secondary" size="sm" onClick={logout}>
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </Button>
                  <p className="mt-2 text-xs text-[var(--color-text-muted)]">You will need to sign in again to continue.</p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function ThemeOption({
  mode,
  current,
  onSelect,
  icon: Icon,
  title,
  description,
}: {
  mode: ThemeMode
  current: ThemeMode
  onSelect: (mode: ThemeMode) => void
  icon: typeof Sun
  title: string
  description: string
}) {
  const selected = current === mode

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(mode)}
      className={`flex min-h-24 flex-col items-start rounded-[var(--radius-lg)] border p-4 text-left transition-colors ${
        selected
          ? 'border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] text-[var(--color-accent-text)] shadow-[var(--shadow-xs)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-hover)]'
      }`}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span className="mt-3 text-sm font-semibold">{title}</span>
      <span className="mt-1 text-xs text-[var(--color-text-muted)]">{description}</span>
    </button>
  )
}

function SettingRow({ label, description, children }: { label: string; description: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--color-text)]">{label}</p>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">{description}</p>
      </div>
      {children}
    </div>
  )
}

function SettingPlaceholder({ icon: Icon, title, description }: { icon: typeof Info; title: string; description: string }) {
  return (
    <div className="px-5 py-10 text-center sm:px-6 sm:py-14">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent-text)]">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-[var(--color-text)]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p>
    </div>
  )
}

function AboutClario() {
  return (
    <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-5 py-5 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">About Clario</p>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
        Clario is a career intelligence platform that helps you understand how well your profile and resume match specific opportunities — with explainable analysis, not just a score.
      </p>
      <p className="mt-3 text-xs text-[var(--color-text-muted)]">Version 0.2.0</p>
    </div>
  )
}
