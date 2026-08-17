import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Mail, Lock, User, MapPin, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuth } from '../auth/context'
import { useToast } from '../hooks/useToast'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { add } = useToast()

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    region: '',
    fieldOfStudy: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState('')

  const update = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }))
    if (generalError) setGeneralError('')
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!form.email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Enter a valid email address'
    if (!form.password) newErrors.password = 'Password is required'
    else if (form.password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    else if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setGeneralError('')
    try {
      await register(
        form.email.trim().toLowerCase(),
        form.password,
        form.region.trim() || undefined,
        form.fieldOfStudy.trim() || undefined,
      )
      add('success', 'Account created successfully!')
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Registration failed.'
      setGeneralError(typeof detail === 'string' ? detail : String(detail))
      add('error', 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="h-96 w-96 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-indigo-50/30" />
        <div className="h-64 w-64 -translate-x-1/3 translate-y-1/4 rotate-12 rounded-full bg-indigo-100/20" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-200">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">Clario</h1>
          <p className="text-sm text-slate-500">Create your account</p>
        </div>

        <div className="card p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Get started</h2>
          <p className="text-sm text-slate-500 mb-6">Create an account to start analyzing your resume</p>

          {generalError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  className={`input pl-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
              <p className="mt-1 text-xs text-slate-400">Must be at least 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="confirmPassword"
                  type="password"
                  className={`input pl-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  onChange={(e) => update('confirmPassword', e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="region" className="label">Region <span className="text-slate-400">(optional)</span></label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="region"
                    type="text"
                    className="input pl-10"
                    placeholder="e.g. US, UK, EU"
                    value={form.region}
                    onChange={(e) => update('region', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="fieldOfStudy" className="label">Field of study <span className="text-slate-400">(optional)</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="fieldOfStudy"
                    type="text"
                    className="input pl-10"
                    placeholder="e.g. Computer Science"
                    value={form.fieldOfStudy}
                    onChange={(e) => update('fieldOfStudy', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-2.5 mt-2"
            >
              {loading && (
                <span className="flex h-4 w-4 animate-spin items-center justify-center">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </span>
              )}
              <span className={loading ? 'ml-2' : ''}>
                Create account <ArrowRight className="h-4 w-4" />
              </span>
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          By creating an account, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  )
}
