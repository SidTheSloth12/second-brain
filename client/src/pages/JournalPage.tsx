import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { TipTapJournalEditor } from '../components/journal/TipTapJournalEditor'
import {
  deleteJournalEntry,
  fetchJournalEntry,
  fetchJournalMonth,
  saveJournalEntry,
} from '../lib/journalApi'
import { localISODate, parseISODateLocal } from '../lib/localDate'

function addMonths(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function JournalEntryEditor({
  date,
  initialTitle,
  initialHtml,
  initialText,
}: {
  date: string
  initialTitle: string
  initialHtml: string
  initialText: string
}) {
  const queryClient = useQueryClient()
  const titleRef = useRef(initialTitle)
  const [title, setTitle] = useState(initialTitle)
  const [lastBody, setLastBody] = useState({ html: initialHtml || '<p></p>', text: initialText })
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [editorEpoch, setEditorEpoch] = useState(0)

  useEffect(() => {
    titleRef.current = title
  }, [title])

  const saveMut = useMutation({
    mutationFn: (body: { title: string; bodyHtml: string; bodyText: string }) => saveJournalEntry(date, body),
    onMutate: () => setSaveStatus('saving'),
    onSuccess: (entry) => {
      setSaveStatus('saved')
      queryClient.setQueryData(['journal', date], { entry, entryDate: date })
      queryClient.invalidateQueries({ queryKey: ['journal', 'month'] })
      queryClient.invalidateQueries({ queryKey: ['search'] })
      window.setTimeout(() => setSaveStatus('idle'), 1500)
    },
    onError: () => setSaveStatus('error'),
  })

  const deleteMut = useMutation({
    mutationFn: () => deleteJournalEntry(date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] })
      queryClient.invalidateQueries({ queryKey: ['search'] })
      queryClient.setQueryData(['journal', date], { entry: null, entryDate: date })
      setTitle('')
      setLastBody({ html: '<p></p>', text: '' })
      setEditorEpoch((e) => e + 1)
    },
  })

  const persist = useCallback(
    (bodyHtml: string, bodyText: string) => {
      setLastBody({ html: bodyHtml, text: bodyText })
      saveMut.mutate({ title: titleRef.current.trim(), bodyHtml, bodyText })
    },
    [saveMut]
  )

  const flushTitle = useCallback(() => {
    saveMut.mutate({
      title: titleRef.current.trim(),
      bodyHtml: lastBody.html,
      bodyText: lastBody.text,
    })
  }, [lastBody.html, lastBody.text, saveMut])

  const onDebouncedChange = useCallback(
    (html: string, text: string) => {
      persist(html, text)
    },
    [persist]
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-slate-500">
          {saveStatus === 'saving' && 'Saving…'}
          {saveStatus === 'saved' && 'Saved'}
          {saveStatus === 'error' && <span className="text-red-600">Could not save</span>}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => flushTitle()}
            className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
          >
            Save now
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm('Remove this day’s journal entry from the database?')) deleteMut.mutate()
            }}
            disabled={deleteMut.isPending}
            className="rounded-lg border border-red-200 px-3 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Delete day
          </button>
        </div>
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => flushTitle()}
        placeholder="Title (optional)"
        className="w-full rounded-t-lg border border-b-0 border-slate-200 bg-white px-3 py-2 text-lg font-semibold text-slate-900 placeholder:text-slate-400 focus:z-10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-violet-500/25"
      />
      <TipTapJournalEditor
        key={`${date}-${editorEpoch}`}
        initialHtml={initialHtml || '<p></p>'}
        onDebouncedChange={onDebouncedChange}
      />
    </div>
  )
}

export function JournalTodayRedirect() {
  return <Navigate to={`/journal/${localISODate()}`} replace />
}

export function JournalPage() {
  const { date } = useParams<{ date: string }>()
  const navigate = useNavigate()
  const isValid = Boolean(date && parseISODateLocal(date))
  const month =
    isValid && date && date.length >= 7 ? date.slice(0, 7) : localISODate().slice(0, 7)

  const { data: monthData, isLoading: monthLoading } = useQuery({
    queryKey: ['journal', 'month', month],
    queryFn: () => fetchJournalMonth(month),
    enabled: isValid,
  })

  const { data: entryRes, isPending: entryPending } = useQuery({
    queryKey: ['journal', date ?? '_'],
    queryFn: () => fetchJournalEntry(date!),
    enabled: isValid && Boolean(date),
  })

  const entries = monthData?.entries ?? []

  if (!isValid || !date) {
    return <Navigate to={`/journal/${localISODate()}`} replace />
  }

  return (
    <AppShell wide>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <aside className="w-full shrink-0 lg:w-56">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => navigate(`/journal/${addMonths(month, -1)}-01`)}
              className="rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-600 hover:bg-slate-50"
              aria-label="Previous month"
            >
              ←
            </button>
            <span className="text-sm font-medium text-slate-800">{month}</span>
            <button
              type="button"
              onClick={() => navigate(`/journal/${addMonths(month, 1)}-01`)}
              className="rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-600 hover:bg-slate-50"
              aria-label="Next month"
            >
              →
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Days with entries</p>
          <nav className="mt-2 max-h-64 space-y-0.5 overflow-y-auto lg:max-h-[calc(100vh-12rem)]">
            {monthLoading && <p className="text-xs text-slate-400">Loading…</p>}
            {!monthLoading && entries.length === 0 && (
              <p className="text-xs text-slate-400">No entries this month.</p>
            )}
            {entries.map((e) => (
              <Link
                key={e.id}
                to={`/journal/${e.entryDate}`}
                className={`block truncate rounded-md px-2 py-1.5 text-sm ${
                  e.entryDate === date ? 'bg-violet-100 font-medium text-violet-900' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {e.entryDate}
                {e.title ? ` — ${e.title}` : ''}
              </Link>
            ))}
          </nav>
          <Link
            to={`/journal/${localISODate()}`}
            className="mt-4 inline-block text-xs font-medium text-violet-600 hover:text-violet-800"
          >
            Jump to today
          </Link>
        </aside>

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-slate-900">Journal</h1>
          <p className="mt-1 text-sm text-slate-500">
            One entry per calendar day. Rich text auto-saves a few seconds after you stop typing.
          </p>
          <p className="mt-2 text-sm font-medium text-slate-700">{date}</p>

          {entryPending ? (
            <div className="mt-6 min-h-[20rem] animate-pulse rounded-xl bg-slate-100" />
          ) : (
            <div className="mt-6">
              <JournalEntryEditor
                key={date}
                date={date}
                initialTitle={entryRes?.entry?.title ?? ''}
                initialHtml={entryRes?.entry?.bodyHtml ?? '<p></p>'}
                initialText={entryRes?.entry?.bodyText ?? ''}
              />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
