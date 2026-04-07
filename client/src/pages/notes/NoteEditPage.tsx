import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import axios from 'axios'
import { LivePreviewEditor } from '../../components/notes/LivePreviewEditor'
import { TagEditor } from '../../components/notes/TagEditor'
import {
  deleteNote,
  fetchNote,
  fetchNoteBacklinks,
  fetchTags,
  updateNote,
} from '../../lib/notesApi'
import type { NoteDetail, NoteListItem } from '../../types/note'
import type { NotesOutletContext } from './NotesLayout'

function NoteEditorBody({
  note,
  notesIndex,
  backlinks,
}: {
  note: NoteDetail
  notesIndex: NoteListItem[]
  backlinks: NoteListItem[]
}) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [tags, setTags] = useState(note.tags)
  const [saveError, setSaveError] = useState<string | null>(null)

  const { data: allTags = [] } = useQuery({
    queryKey: ['note-tags'],
    queryFn: fetchTags,
  })

  const dirty =
    title !== note.title ||
    content !== note.content ||
    tags.join(',') !== note.tags.join(',')

  const updateMut = useMutation({
    mutationFn: () =>
      updateNote(note.id, { title: title.trim() || 'Untitled', content, tags }),
    onSuccess: () => {
      setSaveError(null)
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['notes', note.id] })
      queryClient.invalidateQueries({ queryKey: ['notes', note.id, 'backlinks'] })
      queryClient.invalidateQueries({ queryKey: ['search'] })
    },
    onError: (e) => {
      setSaveError(
        axios.isAxiosError(e) ? (e.response?.data as { error?: string })?.error ?? 'Save failed' : 'Save failed'
      )
    },
  })

  const deleteMut = useMutation({
    mutationFn: () => deleteNote(note.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['search'] })
      navigate('/notes', { replace: true })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-end gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!dirty || updateMut.isPending}
            onClick={() => updateMut.mutate()}
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-40"
          >
            {updateMut.isPending ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm('Delete this note permanently?')) deleteMut.mutate()
            }}
            disabled={deleteMut.isPending}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-700/60 dark:bg-transparent dark:text-rose-400 dark:hover:bg-rose-900/20"
          >
            Delete
          </button>
        </div>
      </div>

      {saveError && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-300" role="alert">
          {saveError}
        </div>
      )}

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border-b border-transparent bg-transparent text-xl font-semibold text-slate-900 focus:border-violet-300 focus:outline-none dark:text-slate-100"
          aria-label="Title"
        />
        <TagEditor tags={tags} allTags={allTags} onChange={setTags} />
        <div>
          <label className="mb-2 block text-xs font-medium text-slate-500 dark:text-slate-400">
            Content (Live Preview) — type [[ to link notes
          </label>
          <LivePreviewEditor content={content} onChange={setContent} notesIndex={notesIndex} />
        </div>
      </div>

      {backlinks.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Linked from</h3>
          <ul className="space-y-1 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            {backlinks.map((b) => (
              <li key={b.id}>
                <Link to={`/notes/${b.id}`} className="text-sm text-violet-700 hover:underline dark:text-violet-400">
                  {b.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export function NoteEditPage() {
  const { noteId } = useParams<{ noteId: string }>()
  const { notesIndex } = useOutletContext<NotesOutletContext>()

  const { data: note, isLoading, error } = useQuery({
    queryKey: ['notes', noteId],
    queryFn: () => fetchNote(noteId!),
    enabled: Boolean(noteId),
  })

  const { data: backlinks = [] } = useQuery({
    queryKey: ['notes', noteId, 'backlinks'],
    queryFn: () => fetchNoteBacklinks(noteId!),
    enabled: Boolean(noteId),
  })

  if (!noteId) {
    return <p className="text-slate-500">Missing note id.</p>
  }

  if (isLoading) {
    return <p className="text-slate-500">Loading note…</p>
  }

  if (error || !note) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {axios.isAxiosError(error)
          ? (error.response?.data as { error?: string })?.error ?? 'Note not found'
          : 'Note not found'}
        <div className="mt-2">
          <Link to="/notes" className="text-violet-700 underline">
            Back to notes
          </Link>
        </div>
      </div>
    )
  }

  return (
    <NoteEditorBody key={note.id} note={note} notesIndex={notesIndex} backlinks={backlinks} />
  )
}
