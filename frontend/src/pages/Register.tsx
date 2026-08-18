import { useNavigate } from 'react-router-dom'
import { useState, type FormEvent, type ChangeEvent } from 'react'
import { Mail, Lock, User, MapPin, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { useToast } from '../hooks/useToast'
import { AuthLayout } from '../components/auth/AuthLayout'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useI18n } from '../i18n/hooks'

function PasswordField({
  id,
  label,
  value,
  placeholder,
  autoComplete,
  error,
  visible,
  onToggle,
  onChange,
}: {
  id: string
  label: string
  value: string
  placeholder: string
  autoComplete: string
  error?: string
  visible: boolean
  onToggle: () => void
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">{label}</label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" aria-hidden="true" />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={onChange}
          className={`min-h-11 w-full rounded-[var(--radius-md)] border bg-[var(--color-input-bg)] py-2.5 pl-9 pr-11 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-focus)] focus:ring-2 focus:ring-[var(--color-focus-ring)] ${error ? 'border-[var(--color-error)]' : 'border-[var(--color-input-border)]'}`}
        />
        <button
          type="button"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          onClick={onToggle}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-[var(--color-error-text)]">{error}</p>}
    </div>
  )
}

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { add } = useToast()
  const { t } = useI18n()

  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', region: '', fieldOfStudy: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const update = (field: string, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (errors[field]) setErrors((current) => ({ ...current, [field]: '' }))
    if (generalError) setGeneralError('')
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!form.email.trim()) next.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email address'
    if (!form.password) next.password = 'Password is required'
    else if (form.password.length < 8) next.password = 'Password must be at least 8 characters'
    if (form.password && form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!validate()) return
    setLoading(true)
    setGeneralError('')
    try {
      await register(form.email.trim().toLowerCase(), form.password, form.region.trim() || undefined, form.fieldOfStudy.trim() || undefined)
      add('success', 'Account created successfully!')
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Registration failed.'
      setGeneralError(typeof detail === 'string' ? detail : String(detail))
      add('error', 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Start your career workspace"
      title={t('auth.registerTitle')}
      description="Build your profile once, define your target, and use Clario to understand which opportunities move you forward."
      topAction={
        <button type="button" onClick={() => navigate('/login')} className="font-semibold text-[var(--color-blue-text)] hover:underline">
          Sign in
        </button>
      }
    >
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-md)] sm:p-7">
        {generalError && (
          <div className="mb-5 flex items-start gap-2 rounded-xl border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-3.5 text-sm text-[var(--color-error-text)]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input id="register-email" label={t('auth.email')} type="email" value={form.email} placeholder="you@example.com" autoComplete="email" autoFocus error={errors.email} leading={<Mail className="h-4 w-4" />} onChange={(event) => update('email', event.target.value)} />

          <div className="grid gap-4 sm:grid-cols-2">
            <PasswordField
              id="register-password"
              label={t('auth.password')}
              value={form.password}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              error={errors.password}
              visible={showPassword}
              onToggle={() => setShowPassword((current) => !current)}
              onChange={(event) => update('password', event.target.value)}
            />
            <PasswordField
              id="register-confirm-password"
              label={t('auth.password')}
              value={form.confirmPassword}
              placeholder="Repeat password"
              autoComplete="new-password"
              error={errors.confirmPassword}
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((current) => !current)}
              onChange={(event) => update('confirmPassword', event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="register-region" label="Region" hint="Optional" value={form.region} placeholder="e.g. Egypt" leading={<MapPin className="h-4 w-4" />} onChange={(event) => update('region', event.target.value)} />
            <Input id="register-field" label="Field of study" hint="Optional" value={form.fieldOfStudy} placeholder="e.g. Computer Science" leading={<User className="h-4 w-4" />} onChange={(event) => update('fieldOfStudy', event.target.value)} />
          </div>

          <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
            Create account
            {!loading && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>

        <div className="mt-6 border-t border-[var(--color-border)] pt-5 text-center text-sm text-[var(--color-text-secondary)]">
          Already have an account?{' '}
          <button type="button" onClick={() => navigate('/login')} className="font-semibold text-[var(--color-blue-text)] hover:underline">Sign in</button>
        </div>
      </div>
    </AuthLayout>
  )
}
