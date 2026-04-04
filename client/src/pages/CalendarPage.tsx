import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import axios from 'axios'
import { AppShell } from '../components/AppShell'
import { CalendarEventModal } from '../components/calendar/CalendarEventModal'
import { DayAgenda } from '../components/calendar/DayAgenda'
import { MonthGrid } from '../components/calendar/MonthGrid'
import { WeekColumns } from '../components/calendar/WeekColumns'
import { fetchCalendarRange } from '../lib/calendarApi'
import {
  formatMonthTitle,
  formatWeekTitle,
  getFetchRange,
  getViewRange,
  getWeekDays,
  startOfDay,
} from '../lib/calendarTime'
import { createEvent, deleteEvent, updateEvent } from '../lib/eventsApi'
import type { CalendarEvent } from '../types/calendar'
import type { CalendarViewMode } from '../types/calendar'

function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function addMonths(d: Date, n: number): Date {
  const x = new Date(d)
  x.setMonth(x.getMonth() + n)
  return x
}

export function CalendarPage() {
  const queryClient = useQueryClient()
  const [anchor, setAnchor] = useState(() => new Date())
  const [view, setView] = useState<CalendarViewMode>('month')
  const [includeCompleted, setIncludeCompleted] = useState(false)

  const { start: fetchStart, end: fetchEnd } = useMemo(
    () => getFetchRange(view, anchor),
    [view, anchor]
  )

  const { data, isLoading, error } = useQuery({
    queryKey: ['calendar', view, fetchStart.toISOString(), fetchEnd.toISOString(), includeCompleted],
    queryFn: () => fetchCalendarRange(fetchStart, fetchEnd, includeCompleted),
  })

  const tasks = data?.tasks ?? []
  const events = data?.events ?? []

  const title = useMemo(() => {
    if (view === 'month') return formatMonthTitle(anchor)
    if (view === 'week') {
      const days = getWeekDays(anchor)
      return formatWeekTitle(days[0], days[6])
    }
    return startOfDay(anchor).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }, [view, anchor])

  const [modal, setModal] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    day: Date
    event: CalendarEvent | null
  }>({ open: false, mode: 'create', day: startOfDay(new Date()), event: null })

  const invalidateCalendar = () => queryClient.invalidateQueries({ queryKey: ['calendar'] })

  const createMut = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      invalidateCalendar()
      setModal((m) => ({ ...m, open: false }))
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateEvent>[1] }) =>
      updateEvent(id, body),
    onSuccess: () => {
      invalidateCalendar()
      setModal((m) => ({ ...m, open: false }))
    },
  })

  const deleteMut = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      invalidateCalendar()
      setModal((m) => ({ ...m, open: false }))
    },
  })

  function openCreateForDay(day: Date) {
    setModal({ open: true, mode: 'create', day: startOfDay(day), event: null })
  }

  function openEditEvent(event: CalendarEvent) {
    setModal({
      open: true,
      mode: 'edit',
      day: startOfDay(new Date(event.startsAt)),
      event,
    })
  }

  function navPrev() {
    if (view === 'month') setAnchor((a) => addMonths(a, -1))
    else if (view === 'week') setAnchor((a) => addDays(a, -7))
    else setAnchor((a) => addDays(a, -1))
  }

  function navNext() {
    if (view === 'month') setAnchor((a) => addMonths(a, 1))
    else if (view === 'week') setAnchor((a) => addDays(a, 7))
    else setAnchor((a) => addDays(a, 1))
  }

  function navToday() {
    setAnchor(new Date())
  }

  function newEventDefaultDay(): Date {
    const today = startOfDay(new Date())
    const { start, end } = getViewRange(view, anchor)
    if (today >= start && today < end) return today
    return startOfDay(anchor)
  }

  const errMsg =
    error && axios.isAxiosError(error)
      ? (error.response?.data as { error?: string })?.error
      : error
        ? 'Could not load calendar'
        : null

  const busy = createMut.isPending || updateMut.isPending || deleteMut.isPending

  return (
    <AppShell wide>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Calendar</h1>
            <p className="mt-1 text-sm text-slate-500">
              Tasks with due dates and events stay in sync; edit tasks on the Tasks page.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['month', 'week', 'day'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize ${
                  view === v ? 'bg-violet-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={navPrev}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
              aria-label="Previous"
            >
              ←
            </button>
            <button
              type="button"
              onClick={navToday}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              Today
            </button>
            <button
              type="button"
              onClick={navNext}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
              aria-label="Next"
            >
              →
            </button>
            <h2 className="ml-2 text-lg font-semibold text-slate-800">{title}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={includeCompleted}
                onChange={(e) => setIncludeCompleted(e.target.checked)}
                className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
              />
              Show completed tasks
            </label>
            <button
              type="button"
              onClick={() => openCreateForDay(newEventDefaultDay())}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
            >
              New event
            </button>
          </div>
        </div>

        {errMsg && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errMsg}
          </div>
        )}

        {isLoading ? (
          <p className="text-center text-slate-500">Loading…</p>
        ) : view === 'month' ? (
          <MonthGrid
            anchor={anchor}
            tasks={tasks}
            events={events}
            onSelectDay={openCreateForDay}
            onEditEvent={openEditEvent}
          />
        ) : view === 'week' ? (
          <WeekColumns
            anchor={anchor}
            tasks={tasks}
            events={events}
            onSelectDay={openCreateForDay}
            onEditEvent={openEditEvent}
          />
        ) : (
          <DayAgenda day={anchor} tasks={tasks} events={events} onEditEvent={openEditEvent} />
        )}

        <p className="text-xs text-slate-500">
          <span className="text-violet-800">· Tasks</span> ·{' '}
          <span className="text-emerald-800">◆ Events</span>
        </p>
      </div>

      {modal.open && (
        <CalendarEventModal
          key={`${modal.mode}-${modal.event?.id ?? 'new'}-${modal.day.getTime()}`}
          mode={modal.mode}
          anchorDay={modal.day}
          event={modal.event}
          onClose={() => setModal((m) => ({ ...m, open: false }))}
          onCreate={async (body) => {
            await createMut.mutateAsync(body)
          }}
          onUpdate={async (id, body) => {
            await updateMut.mutateAsync({ id, body })
          }}
          onDelete={async (id) => {
            await deleteMut.mutateAsync(id)
          }}
          busy={busy}
        />
      )}
    </AppShell>
  )
}
