import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, MapPin, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { useToast } from '../hooks/useToast'
import { AuthLayout } from '../components/auth/AuthLayout'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { add } = useToast()

  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', region: '', fieldOfStudy: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState('')

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
      title="Create your Clario account"
      description="Build your profile once, define your target, and use Clario to understand which opportunities move you forward."
      topAction={
        <button type="button" onClick={() => navigate('/login')} className="font-semibold text-[var(--color-blue-text)] hover:underline">
          Sign in
        </button>
      }
    >
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] sm:p-7">
        {generalError && (
          <div className="mb-5 flex items-start gap-2 rounded-xl border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-3.5 text-sm text-[var(--color-error-text)]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input id="register-email" label="Email address" type="email" value={form.email} placeholder="you@example.com" autoComplete="email" autoFocus error={errors.email} leading={<Mail className="h-4 w-4" />} onChange={(event) => update('email', event.target.value)} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="register-password" label="Password" type="password" value={form.password} placeholder="At least 8 characters" autoComplete="new-password" error={errors.password} leading={<Lock className="h-4 w-4" />} onChange={(event) => update('password', event.target.value)} />
            <Input id="register-confirm-password" label="Confirm password" type="password" value={form.confirmPassword} placeholder="Repeat password" autoComplete="new-password" error={errors.confirmPassword} leading={<Lock className="h-4 w-4" />} onChange={(event) => update('confirmPassword', event.target.value)} />
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
