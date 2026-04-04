import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { useAuth } from '../auth/useAuth'

export function HomePage() {
  const { user } = useAuth()

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900">Home</h1>
        <p className="text-slate-600">
          Signed in as <span className="font-medium text-slate-900">{user?.email}</span>.
        </p>
        <p className="text-sm text-slate-500">
          Use the nav for tasks, calendar, notes, journal, and search.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/tasks"
            className="inline-flex rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            Open tasks
          </Link>
          <Link
            to="/calendar"
            className="inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Calendar
          </Link>
          <Link
            to="/notes"
            className="inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Notes
          </Link>
          <Link
            to="/journal"
            className="inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Journal
          </Link>
          <Link
            to="/search"
            className="inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Search
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
