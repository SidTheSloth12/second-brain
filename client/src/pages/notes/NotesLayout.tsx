import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { createNote, fetchNotes } from '../../lib/notesApi'
import type { NoteListItem } from '../../types/note'

export type NotesOutletContext = {
  notesIndex: NoteListItem[]
}

export function NotesLayout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes'],
    queryFn: fetchNotes,
  })

  const createMut = useMutation({
    mutationFn: () => createNote({ title: 'Untitled', content: '' }),
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['search'] })
      navigate(`/notes/${note.id}`, { replace: true })
    },
  })

  return (
    <AppShell wide>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="w-full shrink-0 lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)] lg:w-56 lg:overflow-y-auto">
          <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-stretch">
            <button
              type="button"
              onClick={() => createMut.mutate()}
              disabled={createMut.isPending}
              className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {createMut.isPending ? 'Creating…' : 'New note'}
            </button>
            <NavLink
              to="/notes/new"
              className={({ isActive }) =>
                `rounded-lg border px-3 py-2 text-center text-sm font-medium lg:block ${
                  isActive
                    ? 'border-violet-300 bg-violet-50 text-violet-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              Blank draft
            </NavLink>
          </div>
          <nav className="mt-4 space-y-0.5 border-t border-slate-200 pt-4">
            {isLoading && <p className="text-xs text-slate-500">Loading…</p>}
            {!isLoading && notes.length === 0 && (
              <p className="text-xs text-slate-500">No notes yet.</p>
            )}
            {notes.map((n) => (
              <NavLink
                key={n.id}
                to={`/notes/${n.id}`}
                className={({ isActive }) =>
                  `block truncate rounded-md px-2 py-1.5 text-sm ${
                    isActive ? 'bg-violet-100 font-medium text-violet-900' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
                title={n.title}
              >
                {n.title}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="min-h-[60vh] min-w-0 flex-1">
          <Outlet context={{ notesIndex: notes } satisfies NotesOutletContext} />
        </div>
      </div>
    </AppShell>
  )
}
