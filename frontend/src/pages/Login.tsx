import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../auth/context'
import { useToast } from '../hooks/useToast'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const { add } = useToast()

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ||
    '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const [errors, setErrors] = useState<{
    email?: string
    password?: string
    general?: string
  }>({})

  const validate = () => {
    const newErrors: typeof errors = {}

    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Enter a valid email address'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)
    setErrors({})

    try {
      await login(email.trim().toLowerCase(), password)

      add('success', 'Welcome back!')
      navigate(from, { replace: true })
    } catch (err: any) {
      const detail =
        err.response?.data?.detail ||
        'Login failed. Please check your credentials.'

      setErrors({ general: detail })
      add('error', detail)
    } finally {
      setLoading(false)
    }
  }

  return (
<main
  className="
    min-h-screen
    bg-[#F7F6FF]
    text-slate-900
    transition-colors duration-200
    dark:bg-[#0B1020]
    dark:text-white
  "
>
      {/* ============================================================
          HEADER
          ============================================================ */}

      <header
        className="
          absolute
          left-0
          right-0
          top-0
          flex
          h-16
          items-center
          justify-between
          px-6
          sm:px-8
        "
      >
        {/* Brand */}

        <button
          type="button"
          onClick={() => navigate('/')}
          className="
            flex
            items-center
            gap-2.5
            rounded-lg
            outline-none
          "
        >
          <img
            src="/favicon-512.png"
            alt="Clario"
            className="
              h-8
              w-8
              rounded-lg
            "
          />

          <span
            className="
              text-[18px]
              font-semibold
              tracking-[-0.02em]
              text-slate-900
              dark:text-white
            "
          >
            Clario
          </span>
        </button>

        {/* Register */}

        <div className="flex items-center gap-2 text-sm">

          <span className="hidden text-slate-500 sm:inline dark:text-slate-400">
            Don't have an account?
          </span>

          <button
            type="button"
            onClick={() => navigate('/register')}
            className="
              rounded-lg
              px-3
              py-2
              font-medium
              text-[#5146E5]
              transition-colors
              hover:bg-indigo-50
              dark:text-[#8B82FF]
              dark:hover:bg-indigo-500/10
            "
          >
            Create account
          </button>

        </div>
      </header>

      {/* ============================================================
          MAIN
          ============================================================ */}

      <div
        className="
          flex
          min-h-screen
          items-center
          justify-center
          px-4
          pb-12
          pt-24
        "
      >
        <div className="w-full max-w-[400px]">

          {/* ========================================================
              BRAND
              ======================================================== */}

          <div className="mb-8 text-center">

            <img
              src="/favicon-512.png"
              alt="Clario"
              className="
                mx-auto
                h-14
                w-14
                rounded-[14px]
              "
            />

            <h1
              className="
                mt-5
                text-[28px]
                font-normal
                tracking-[-0.025em]
                text-slate-900
                dark:text-white
              "
            >
              Sign in to Clario
            </h1>

            <p
              className="
                mt-2
                text-sm
                text-slate-500
                dark:text-slate-400
              "
            >
              Your career intelligence workspace
            </p>

          </div>

          {/* ========================================================
              CARD
              ======================================================== */}

          <section
            className="
              rounded-xl
              border
              border-slate-200
              bg-white
              p-6
              sm:p-8
              dark:border-slate-700
              dark:bg-[#101625]
            "
          >

            {/* Error */}

            {errors.general && (
              <div
                className="
                  mb-5
                  rounded-lg
                  border
                  border-red-200
                  bg-red-50
                  px-3.5
                  py-3
                  text-sm
                  text-red-700
                  dark:border-red-900/50
                  dark:bg-red-950/30
                  dark:text-red-300
                "
              >
                {errors.general}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* ==================================================
                  EMAIL
                  ================================================== */}

              <div>

                <label
                  htmlFor="email"
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-slate-700
                    dark:text-slate-200
                  "
                >
                  Email address
                </label>

                <div className="relative">

                  <Mail
                    className="
                      pointer-events-none
                      absolute
                      left-3
                      top-1/2
                      h-4
                      w-4
                      -translate-y-1/2
                      text-slate-400
                      dark:text-slate-500
                    "
                  />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    placeholder="you@example.com"
                    autoComplete="email"
                    autoFocus
                    disabled={loading}
                    onChange={(e) => {
                      setEmail(e.target.value)

                      setErrors((previous) => ({
                        ...previous,
                        email: undefined,
                        general: undefined,
                      }))
                    }}
                    className={`
                      block
                      w-full
                      rounded-lg
                      border
                      bg-white
                      py-2.5
                      pl-9
                      pr-3
                      text-sm
                      text-slate-900
                      outline-none
                      transition-colors

                      placeholder:text-slate-400

                      dark:bg-[#0b1020]
                      dark:text-white
                      dark:placeholder:text-slate-600

                      ${
                        errors.email
                          ? `
                            border-red-400
                            focus:border-red-500
                            focus:ring-2
                            focus:ring-red-500/10
                          `
                          : `
                            border-slate-300
                            hover:border-slate-400
                            focus:border-[#5B4BFF]
                            focus:ring-2
                            focus:ring-[#5B4BFF]/10

                            dark:border-slate-700
                            dark:hover:border-slate-600
                            dark:focus:border-[#6D63FF]
                          `
                      }
                    `}
                  />

                </div>

                {errors.email && (
                  <p
                    className="
                      mt-1.5
                      text-xs
                      text-red-600
                      dark:text-red-400
                    "
                  >
                    {errors.email}
                  </p>
                )}

              </div>

              {/* ==================================================
                  PASSWORD
                  ================================================== */}

              <div>

                <div className="mb-2 flex items-center justify-between">

                  <label
                    htmlFor="password"
                    className="
                      text-sm
                      font-medium
                      text-slate-700
                      dark:text-slate-200
                    "
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    className="
                      text-xs
                      font-medium
                      text-[#5146E5]
                      hover:underline
                      dark:text-[#8B82FF]
                    "
                  >
                    Forgot password?
                  </button>

                </div>

                <div className="relative">

                  <Lock
                    className="
                      pointer-events-none
                      absolute
                      left-3
                      top-1/2
                      h-4
                      w-4
                      -translate-y-1/2
                      text-slate-400
                      dark:text-slate-500
                    "
                  />

                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                    onChange={(e) => {
                      setPassword(e.target.value)

                      setErrors((previous) => ({
                        ...previous,
                        password: undefined,
                        general: undefined,
                      }))
                    }}
                    className={`
                      block
                      w-full
                      rounded-lg
                      border
                      bg-white
                      py-2.5
                      pl-9
                      pr-10
                      text-sm
                      text-slate-900
                      outline-none
                      transition-colors

                      placeholder:text-slate-400

                      dark:bg-[#0b1020]
                      dark:text-white
                      dark:placeholder:text-slate-600

                      ${
                        errors.password
                          ? `
                            border-red-400
                            focus:border-red-500
                            focus:ring-2
                            focus:ring-red-500/10
                          `
                          : `
                            border-slate-300
                            hover:border-slate-400
                            focus:border-[#5B4BFF]
                            focus:ring-2
                            focus:ring-[#5B4BFF]/10

                            dark:border-slate-700
                            dark:hover:border-slate-600
                            dark:focus:border-[#6D63FF]
                          `
                      }
                    `}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
                    className="
                      absolute
                      right-2.5
                      top-1/2
                      -translate-y-1/2
                      rounded-md
                      p-1
                      text-slate-400
                      hover:text-slate-600
                      dark:text-slate-500
                      dark:hover:text-slate-300
                    "
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>

                </div>

                {errors.password && (
                  <p
                    className="
                      mt-1.5
                      text-xs
                      text-red-600
                      dark:text-red-400
                    "
                  >
                    {errors.password}
                  </p>
                )}

              </div>

              {/* ==================================================
                  SUBMIT
                  ================================================== */}

              <button
                type="submit"
                disabled={loading}
                className="
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  bg-[#5B4BFF]
                  px-4
                  py-2.5
                  text-sm
                  font-medium
                  text-white
                  transition-colors

                  hover:bg-[#4F46E5]

                  focus:outline-none
                  focus:ring-2
                  focus:ring-[#5B4BFF]
                  focus:ring-offset-2

                  disabled:cursor-not-allowed
                  disabled:opacity-60

                  dark:focus:ring-offset-[#101625]
                "
              >

                {loading ? (
                  <>
                    <span
                      className="
                        h-4
                        w-4
                        animate-spin
                        rounded-full
                        border-2
                        border-white/30
                        border-t-white
                      "
                    />

                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>

                    <ArrowRight className="h-4 w-4" />
                  </>
                )}

              </button>

            </form>

            {/* ====================================================
                REGISTER
                ==================================================== */}

            <div
              className="
                mt-6
                border-t
                border-slate-100
                pt-5
                text-center
                dark:border-slate-800
              "
            >
              <p
                className="
                  text-sm
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Don't have an account?{' '}

                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="
                    font-medium
                    text-[#5146E5]
                    hover:underline
                    dark:text-[#8B82FF]
                  "
                >
                  Create account
                </button>
              </p>
            </div>

          </section>

          {/* ========================================================
              TRUST / PRIVACY
              ======================================================== */}

          <div
            className="
              mt-6
              flex
              items-center
              justify-center
              gap-2
              text-xs
              text-slate-400
              dark:text-slate-600
            "
          >
            <ShieldCheck className="h-3.5 w-3.5" />

            <span>
              Your data stays private and is processed locally.
            </span>
          </div>

          {/* Footer */}

          <p
            className="
              mt-5
              text-center
              text-xs
              text-slate-400
              dark:text-slate-600
            "
          >
            © {new Date().getFullYear()} Clario
          </p>

        </div>
      </div>
    </main>
  )
}