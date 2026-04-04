import { useState } from 'react'
import type { CalendarEvent } from '../../types/calendar'
import { endOfDay, startOfDay } from '../../lib/calendarTime'

function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function defaultSlot(day: Date): { start: Date; end: Date } {
  const start = new Date(day)
  start.setHours(9, 0, 0, 0)
  const end = new Date(day)
  end.setHours(10, 0, 0, 0)
  return { start, end }
}

type Props = {
  mode: 'create' | 'edit'
  anchorDay: Date
  event: CalendarEvent | null
  onClose: () => void
  onCreate: (body: {
    title: string
    description: string | null
    startsAt: string
    endsAt: string
    allDay: boolean
  }) => Promise<void>
  onUpdate: (
    id: string,
    body: Partial<{
      title: string
      description: string | null
      startsAt: string
      endsAt: string
      allDay: boolean
    }>
  ) => Promise<void>
  onDelete: (id: string) => Promise<void>
  busy: boolean
}

export function CalendarEventModal({
  mode,
  anchorDay,
  event,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  busy,
}: Props) {
  const [title, setTitle] = useState(() => (mode === 'edit' && event ? event.title : ''))
  const [description, setDescription] = useState(() =>
    mode === 'edit' && event ? (event.description ?? '') : ''
  )
  const [allDay, setAllDay] = useState(() => Boolean(mode === 'edit' && event && event.allDay))
  const [startLocal, setStartLocal] = useState(() => {
    if (mode === 'edit' && event) return toDatetimeLocalValue(new Date(event.startsAt))
    const { start } = defaultSlot(startOfDay(anchorDay))
    return toDatetimeLocalValue(start)
  })
  const [endLocal, setEndLocal] = useState(() => {
    if (mode === 'edit' && event) return toDatetimeLocalValue(new Date(event.endsAt))
    const { end } = defaultSlot(startOfDay(anchorDay))
    return toDatetimeLocalValue(end)
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    let startsAt: string
    let endsAt: string
    if (allDay) {
      const day =
        startLocal.length >= 10
          ? startOfDay(new Date(`${startLocal.slice(0, 10)}T12:00:00`))
          : startOfDay(anchorDay)
      startsAt = day.toISOString()
      endsAt = endOfDay(day).toISOString()
    } else {
      const s = new Date(startLocal)
      const en = new Date(endLocal)
      if (Number.isNaN(s.getTime()) || Number.isNaN(en.getTime()) || en < s) return
      startsAt = s.toISOString()
      endsAt = en.toISOString()
    }

    if (mode === 'create') {
      await onCreate({
        title: title.trim(),
        description: description.trim() || null,
        startsAt,
        endsAt,
        allDay,
      })
    } else if (event) {
      await onUpdate(event.id, {
        title: title.trim(),
        description: description.trim() || null,
        startsAt,
        endsAt,
        allDay,
      })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cal-event-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="cal-event-title" className="text-lg font-semibold text-slate-900">
          {mode === 'create' ? 'New event' : 'Edit event'}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="ev-title" className="block text-xs font-medium text-slate-600">
              Title
            </label>
            <input
              id="ev-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
            />
            All day
          </label>
          {!allDay && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="ev-start" className="block text-xs font-medium text-slate-600">
                  Starts
                </label>
                <input
                  id="ev-start"
                  type="datetime-local"
                  value={startLocal}
                  onChange={(e) => setStartLocal(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  required={!allDay}
                />
              </div>
              <div>
                <label htmlFor="ev-end" className="block text-xs font-medium text-slate-600">
                  Ends
                </label>
                <input
                  id="ev-end"
                  type="datetime-local"
                  value={endLocal}
                  onChange={(e) => setEndLocal(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  required={!allDay}
                />
              </div>
            </div>
          )}
          {allDay && (
            <div>
              <label htmlFor="ev-day" className="block text-xs font-medium text-slate-600">
                Date
              </label>
              <input
                id="ev-day"
                type="date"
                value={
                  startLocal.length >= 10
                    ? startLocal.slice(0, 10)
                    : toDatetimeLocalValue(startOfDay(anchorDay)).slice(0, 10)
                }
                onChange={(e) => {
                  const v = e.target.value
                  if (v) setStartLocal(`${v}T12:00`)
                }}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
          )}
          <div>
            <label htmlFor="ev-desc" className="block text-xs font-medium text-slate-600">
              Description
            </label>
            <textarea
              id="ev-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
          <div className="flex flex-wrap justify-between gap-2 pt-2">
            {mode === 'edit' && event && (
              <button
                type="button"
                onClick={async () => {
                  if (confirm('Delete this event?')) await onDelete(event.id)
                }}
                disabled={busy}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                Delete
              </button>
            )}
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy || !title.trim()}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {busy ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
