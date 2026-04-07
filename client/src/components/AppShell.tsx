import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { ThemeToggle } from './ThemeToggle'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 ${
    isActive ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
  }`

/**
 * Persistent top-level chrome: sticky header + page background.
 * The header is rendered once and never unmounts on route changes.
 */
export function AppShell({
  title,
  wide,
  children,
}: {
  title?: string
  /** Wider main column (e.g. calendar month grid, notes). */
  wide?: boolean
  children: ReactNode
}) {
  const { user, logout } = useAuth()
  const maxW = wide ? 'max-w-7xl' : 'max-w-4xl'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <AppHeader user={user} onLogout={logout} title={title} />
      <main className={`mx-auto ${maxW} px-4 py-8`}>
        {children}
      </main>
    </div>
  )
}

/**
 * Standalone persistent header that can be rendered once at the root layout
 * level so it never unmounts during page transitions.
 */
export function AppHeader({
  user,
  onLogout,
  title,
}: {
  user?: { email: string } | null
  onLogout: () => void
  title?: string
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <NavLink to="/" className="text-lg font-semibold text-violet-700 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-100">
            Second Brain
          </NavLink>
          <nav className="flex flex-wrap gap-1">
            <NavLink to="/" end className={navClass}>Home</NavLink>
            <NavLink to="/tasks" className={navClass}>Tasks</NavLink>
            <NavLink to="/calendar" className={navClass}>Calendar</NavLink>
            <NavLink to="/notes" className={navClass}>Notes</NavLink>
            <NavLink to="/journal" className={navClass}>Journal</NavLink>
            <NavLink to="/search" className={navClass}>Search</NavLink>
          </nav>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ThemeToggle />
          {title && <span className="text-sm text-slate-500 dark:text-slate-400 sm:hidden">{title}</span>}
          <span className="hidden max-w-[200px] truncate text-sm text-slate-600 dark:text-slate-300 md:inline">
            {user?.email}
          </span>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
