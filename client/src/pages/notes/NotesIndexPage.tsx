import { Link } from 'react-router-dom'

export function NotesIndexPage() {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
      <h2 className="text-lg font-semibold text-slate-900">Notes</h2>
      <p className="mt-2 text-sm text-slate-600">
        Select a note in the sidebar, create a quick <strong>New note</strong>, or start a{' '}
        <Link to="/notes/new" className="text-violet-600 hover:underline">
          blank draft
        </Link>
        .
      </p>
      <p className="mt-4 text-xs text-slate-500">
        Link notes with <code className="rounded bg-slate-100 px-1">[[Other Note Title]]</code> or{' '}
        <code className="rounded bg-slate-100 px-1">[[slug-or-title|label]]</code>.
      </p>
    </div>
  )
}
