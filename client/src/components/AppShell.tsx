import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-violet-100 text-violet-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`

export function AppShell({
  title,
  wide,
  children,
}: {
  title?: string
  /** Wider main column (e.g. calendar month grid). */
  wide?: boolean
  children: ReactNode
}) {
  const { user, logout } = useAuth()
  const maxW = wide ? 'max-w-7xl' : 'max-w-4xl'

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div
          className={`mx-auto flex ${maxW} flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between`}
        >
          <div className="flex flex-wrap items-center gap-4">
            <NavLink to="/" className="text-lg font-semibold text-violet-700 hover:text-violet-800">
              Second Brain
            </NavLink>
            <nav className="flex flex-wrap gap-1">
              <NavLink to="/" end className={navClass}>
                Home
              </NavLink>
              <NavLink to="/tasks" className={navClass}>
                Tasks
              </NavLink>
              <NavLink to="/calendar" className={navClass}>
                Calendar
              </NavLink>
              <NavLink to="/notes" className={navClass}>
                Notes
              </NavLink>
              <NavLink to="/journal" className={navClass}>
                Journal
              </NavLink>
              <NavLink to="/search" className={navClass}>
                Search
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {title && <span className="text-sm text-slate-500 sm:hidden">{title}</span>}
            <span className="hidden max-w-[200px] truncate text-sm text-slate-600 md:inline">
              {user?.email}
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className={`mx-auto ${maxW} px-4 py-8`}>{children}</main>
    </div>
  )
}
