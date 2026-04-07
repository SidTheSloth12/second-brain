import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import axios from 'axios'
import { WikiContent } from '../../components/notes/WikiContent'
import { TagEditor } from '../../components/notes/TagEditor'
import { createNote, fetchTags } from '../../lib/notesApi'
import type { NotesOutletContext } from './NotesLayout'

export function NoteNewPage() {
  const { notesIndex } = useOutletContext<NotesOutletContext>()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const { data: allTags = [] } = useQuery({
    queryKey: ['note-tags'],
    queryFn: fetchTags,
  })

  const createMut = useMutation({
    mutationFn: () => createNote({ title: title.trim() || 'Untitled', content, tags }),
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['search'] })
      navigate(`/notes/${note.id}`, { replace: true })
    },
    onError: (e) => {
      setError(axios.isAxiosError(e) ? (e.response?.data as { error?: string })?.error ?? 'Failed' : 'Failed')
    },
  })

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    createMut.mutate()
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-300" role="alert">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="new-title" className="sr-only">
            Title
          </label>
          <input
            id="new-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full border-b border-transparent bg-transparent text-xl font-semibold text-slate-900 placeholder:text-slate-400 focus:border-violet-300 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
        <div>
          <label htmlFor="new-content" className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
            Content — use [[Note Name]] to link
          </label>
          <textarea
            id="new-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={14}
            placeholder="Write here…"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
        <TagEditor tags={tags} allTags={allTags} onChange={setTags} />
        <button
          type="submit"
          disabled={createMut.isPending}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {createMut.isPending ? 'Saving…' : 'Create note'}
        </button>
      </form>
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Preview</h3>
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <WikiContent content={content || 'Nothing to preview yet.'} notesIndex={notesIndex} />
        </div>
      </section>
    </div>
  )
}
