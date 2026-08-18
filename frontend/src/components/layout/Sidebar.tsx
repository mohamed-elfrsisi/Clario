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
  Moon,
  Sun,
} from 'lucide-react'

import { useAuth } from '../../auth/context'
import { useDashboardData } from '../../hooks/useDashboardData'
import { useTheme } from '../../hooks/useTheme'

export function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const {
    documentsCount,
    opportunitiesCount,
    analysesCount,
  } = useDashboardData()

  const {
    theme,
    toggleTheme,
  } = useTheme()

  const navItems = [
    {
      to: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      count: null,
    },
    {
      to: '/documents',
      icon: FileText,
      label: 'Documents',
      count: documentsCount,
    },
    {
      to: '/opportunities',
      icon: Briefcase,
      label: 'Opportunities',
      count: opportunitiesCount,
    },
    {
      to: '/analysis',
      icon: Search,
      label: 'Analysis',
      count: analysesCount,
    },
    {
      to: '/bullets',
      icon: Pencil,
      label: 'Bullet Rewrite',
      count: null,
    },
    {
      to: '/profile',
      icon: User,
      label: 'Profile',
      count: null,
    },
    {
      to: '/settings',
      icon: Settings,
      label: 'Settings',
      count: null,
    },
  ]

  const userInitial =
    user?.email?.charAt(0).toUpperCase() || 'U'

  return (
    <>
      {/* =====================================================
          MOBILE OVERLAY
      ====================================================== */}

      <div
        className="
          fixed inset-0 z-40
          hidden
          bg-black/40
          backdrop-blur-sm
          md:hidden
        "
        onClick={() => navigate('/dashboard')}
      />

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className="
          fixed inset-y-0 left-0 z-50
          flex w-64
          -translate-x-full
          transform flex-col
          border-r
          border-slate-200
          bg-white
          transition-all duration-200

          dark:border-slate-800
          dark:bg-slate-950

          md:relative
          md:translate-x-0
        "
      >
        {/* =================================================
            HEADER / LOGO
        ================================================== */}

        <div
          className="
            flex h-16
            items-center
            justify-between
            border-b
            border-slate-200
            px-4

            dark:border-slate-800
          "
        >
          <div className="flex items-center gap-2.5">
            {/* Clario icon */}

            <div
              className="
                flex h-9 w-9
                items-center justify-center
                rounded-xl
                bg-indigo-600
                shadow-sm
              "
            >
              <Sparkles
                className="h-4 w-4 text-white"
              />
            </div>

            <div>
              <span
                className="
                  block
                  text-lg
                  font-semibold
                  tracking-tight
                  text-slate-900

                  dark:text-white
                "
              >
                Clario
              </span>

              <span
                className="
                  block
                  text-[10px]
                  font-medium
                  uppercase
                  tracking-wider
                  text-slate-400

                  dark:text-slate-500
                "
              >
                Career Intelligence
              </span>
            </div>
          </div>
        </div>

        {/* =================================================
            NAVIGATION
        ================================================== */}

        <nav
          className="
            flex-1
            space-y-1
            overflow-y-auto
            p-3
          "
        >
          {/* Workspace label */}

          <div
            className="
              mb-2
              px-3
              pt-2
              text-[10px]
              font-semibold
              uppercase
              tracking-wider
              text-slate-400

              dark:text-slate-500
            "
          >
            Workspace
          </div>

          {navItems.slice(0, 4).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `
                group
                flex
                items-center
                gap-3
                rounded-lg
                px-3
                py-2.5
                text-sm
                font-medium
                transition-all
                duration-150

                ${
                  isActive
                    ? `
                      bg-indigo-50
                      text-indigo-700

                      dark:bg-indigo-500/10
                      dark:text-indigo-400
                    `
                    : `
                      text-slate-600
                      hover:bg-slate-100
                      hover:text-slate-900

                      dark:text-slate-400
                      dark:hover:bg-slate-900
                      dark:hover:text-white
                    `
                }
              `
              }
            >
              <item.icon
                className="
                  h-5 w-5
                  flex-shrink-0
                "
              />

              <span className="flex-1">
                {item.label}
              </span>

              {item.count !== null &&
                item.count > 0 && (
                  <span
                    className="
                      flex
                      h-5
                      min-w-5
                      items-center
                      justify-center
                      rounded-full
                      bg-indigo-100
                      px-1.5
                      text-xs
                      font-medium
                      text-indigo-700

                      dark:bg-indigo-500/20
                      dark:text-indigo-300
                    "
                  >
                    {item.count}
                  </span>
                )}
            </NavLink>
          ))}

          {/* Career Intelligence */}

          <div
            className="
              mb-2
              mt-6
              px-3
              pt-2
              text-[10px]
              font-semibold
              uppercase
              tracking-wider
              text-slate-400

              dark:text-slate-500
            "
          >
            Career Intelligence
          </div>

          {navItems.slice(4, 6).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `
                group
                flex
                items-center
                gap-3
                rounded-lg
                px-3
                py-2.5
                text-sm
                font-medium
                transition-all
                duration-150

                ${
                  isActive
                    ? `
                      bg-indigo-50
                      text-indigo-700

                      dark:bg-indigo-500/10
                      dark:text-indigo-400
                    `
                    : `
                      text-slate-600
                      hover:bg-slate-100
                      hover:text-slate-900

                      dark:text-slate-400
                      dark:hover:bg-slate-900
                      dark:hover:text-white
                    `
                }
              `
              }
            >
              <item.icon
                className="
                  h-5 w-5
                  flex-shrink-0
                "
              />

              <span className="flex-1">
                {item.label}
              </span>
            </NavLink>
          ))}

          {/* Account */}

          <div
            className="
              mb-2
              mt-6
              px-3
              pt-2
              text-[10px]
              font-semibold
              uppercase
              tracking-wider
              text-slate-400

              dark:text-slate-500
            "
          >
            Account
          </div>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `
              flex
              items-center
              gap-3
              rounded-lg
              px-3
              py-2.5
              text-sm
              font-medium
              transition-all
              duration-150

              ${
                isActive
                  ? `
                    bg-indigo-50
                    text-indigo-700

                    dark:bg-indigo-500/10
                    dark:text-indigo-400
                  `
                  : `
                    text-slate-600
                    hover:bg-slate-100
                    hover:text-slate-900

                    dark:text-slate-400
                    dark:hover:bg-slate-900
                    dark:hover:text-white
                  `
              }
            `
            }
          >
            <Settings className="h-5 w-5" />

            <span>
              Settings
            </span>
          </NavLink>
        </nav>

        {/* =================================================
            THEME SWITCH
        ================================================== */}

        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              theme === 'dark'
                ? 'Switch to light mode'
                : 'Switch to dark mode'
            }
            className="
              flex
              w-full
              items-center
              gap-3
              rounded-lg
              px-3
              py-2.5
              text-sm
              font-medium
              text-slate-600
              transition-all
              duration-150

              hover:bg-slate-100
              hover:text-slate-900

              dark:text-slate-300
              dark:hover:bg-slate-900
              dark:hover:text-white
            "
          >
            {/* Icon */}

            <span
              className="
                flex
                h-5
                w-5
                items-center
                justify-center
              "
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </span>

            {/* Text */}

            <span className="flex-1 text-left">
              {theme === 'dark'
                ? 'Light mode'
                : 'Dark mode'}
            </span>

            {/* Status */}

            <span
              className="
                text-xs
                text-slate-400

                dark:text-slate-500
              "
            >
              {theme === 'dark'
                ? 'On'
                : 'Off'}
            </span>
          </button>
        </div>

        {/* =================================================
            USER SECTION
        ================================================== */}

        <div
          className="
            border-t
            border-slate-200
            p-3

            dark:border-slate-800
          "
        >
          {/* User card */}

          <div
            className="
              flex
              items-center
              gap-3
              rounded-lg
              bg-slate-50
              px-3
              py-2.5

              dark:bg-slate-900
            "
          >
            {/* Avatar */}

            <div
              className="
                flex
                h-8
                w-8
                flex-shrink-0
                items-center
                justify-center
                rounded-full
                bg-indigo-100
                text-sm
                font-medium
                text-indigo-700

                dark:bg-indigo-500/20
                dark:text-indigo-300
              "
            >
              {userInitial}
            </div>

            {/* Email */}

            <div className="min-w-0 flex-1">
              <p
                className="
                  truncate
                  text-sm
                  font-medium
                  text-slate-900

                  dark:text-white
                "
              >
                {user?.email}
              </p>

              <p
                className="
                  text-xs
                  text-slate-400

                  dark:text-slate-500
                "
              >
                Account
              </p>
            </div>
          </div>

          {/* Logout */}

          <button
            type="button"
            onClick={logout}
            className="
              mt-2
              flex
              w-full
              items-center
              gap-2
              rounded-lg
              px-3
              py-2
              text-sm
              text-slate-600
              transition-colors

              hover:bg-slate-100
              hover:text-slate-900

              dark:text-slate-400
              dark:hover:bg-slate-900
              dark:hover:text-white
            "
          >
            <LogOut className="h-4 w-4" />

            <span>
              Sign out
            </span>
          </button>
        </div>
      </aside>

      {/* =====================================================
          MOBILE HEADER
      ====================================================== */}

      <header
        className="
          fixed
          top-0
          z-30
          flex
          h-14
          w-full
          items-center
          justify-between
          border-b
          border-slate-200
          bg-white
          px-4

          dark:border-slate-800
          dark:bg-slate-950

          md:hidden
        "
      >
        {/* Menu */}

        <button
          type="button"
          onClick={() =>
            document
              .querySelector('aside')
              ?.classList.toggle(
                '-translate-x-full'
              )
          }
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-lg
            text-slate-600
            hover:bg-slate-100

            dark:text-slate-300
            dark:hover:bg-slate-900
          "
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Logo */}

        <div className="flex items-center gap-2">
          <div
            className="
              flex
              h-7
              w-7
              items-center
              justify-center
              rounded-lg
              bg-indigo-600
            "
          >
            <Sparkles
              className="h-3.5 w-3.5 text-white"
            />
          </div>

          <span
            className="
              text-sm
              font-semibold
              text-slate-900

              dark:text-white
            "
          >
            Clario
          </span>
        </div>

        {/* User */}

        <div
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-full
            bg-indigo-100
            text-sm
            font-medium
            text-indigo-700

            dark:bg-indigo-500/20
            dark:text-indigo-300
          "
        >
          {userInitial}
        </div>
      </header>

      {/* =====================================================
          MOBILE BOTTOM NAV
      ====================================================== */}

      <nav
        className="
          fixed
          bottom-0
          z-30
          flex
          w-full
          items-center
          justify-around
          border-t
          border-slate-200
          bg-white
          px-2
          py-2

          dark:border-slate-800
          dark:bg-slate-950

          md:hidden
        "
      >
        {navItems.slice(0, 5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `
              flex
              flex-col
              items-center
              gap-0.5
              text-xs
              transition-colors

              ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-slate-500'
              }
            `
            }
          >
            <item.icon className="h-5 w-5" />

            <span>
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}