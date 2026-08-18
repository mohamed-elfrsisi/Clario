import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { useToast } from '../hooks/useToast'
import { AuthLayout } from '../components/auth/AuthLayout'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useI18n } from '../i18n/hooks'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const { add } = useToast()
  const { t } = useI18n()

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})

  const validate = () => {
    const next: typeof errors = {}
    if (!email.trim()) next.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email address'
    if (!password) next.password = 'Password is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) return
    setLoading(true)
    setErrors({})
    try {
      await login(email.trim().toLowerCase(), password)
      add('success', 'Welcome back!')
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Login failed. Please check your credentials.'
      setErrors({ general: detail })
      add('error', detail)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      eyebrow={t('auth.welcome')}
      title={t('auth.loginTitle')}
      description={t('auth.loginDesc')}
      topAction={
        <button type="button" onClick={() => navigate('/register')} className="font-semibold text-[var(--color-blue-text)] hover:underline">
          Create account
        </button>
      }
    >
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-md)] sm:p-7">
        {errors.general && (
          <div className="mb-5 rounded-xl border border-[var(--color-error-border)] bg-[var(--color-error-bg)] px-3.5 py-3 text-sm text-[var(--color-error-text)]">
            {errors.general}
          </div>
        )}

        <div className="mb-5 flex items-center gap-2 rounded-xl bg-[var(--color-blue-soft)] px-3 py-2.5 text-xs font-medium text-[var(--color-blue-text)]">
          <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
          Your career workspace stays focused and secure.
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="email"
            label={t('auth.email')}
            type="email"
            value={email}
            placeholder="you@example.com"
            autoComplete="email"
            autoFocus
            error={errors.email}
            leading={<Mail className="h-4 w-4" />}
            onChange={(event) => {
              setEmail(event.target.value)
              setErrors((current) => ({ ...current, email: undefined, general: undefined }))
            }}
          />

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label htmlFor="password" className="text-sm font-medium text-[var(--color-text)]">{t('auth.password')}</label>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                placeholder={t('auth.password')}
                autoComplete="current-password"
                disabled={loading}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setErrors((current) => ({ ...current, password: undefined, general: undefined }))
                }}
                className={`min-h-11 w-full rounded-[var(--radius-md)] border bg-[var(--color-input-bg)] py-2.5 pl-9 pr-11 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-focus)] focus:ring-2 focus:ring-[var(--color-focus-ring)] ${errors.password ? 'border-[var(--color-error)]' : 'border-[var(--color-input-border)]'}`}
              />
              <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1.5 text-xs text-[var(--color-error-text)]">{errors.password}</p>}
          </div>

          <Button type="submit" size="lg" loading={loading} className="w-full">
            Sign in
            {!loading && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>

        <div className="mt-6 border-t border-[var(--color-border)] pt-5 text-center text-sm text-[var(--color-text-secondary)]">
          {t('auth.newTo')} {' '}
          <button type="button" onClick={() => navigate('/register')} className="font-semibold text-[var(--color-blue-text)] hover:underline">{t('auth.createAnAccount')}</button>
        </div>
      </div>
    </AuthLayout>
  )
}
