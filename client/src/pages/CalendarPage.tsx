import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import axios from 'axios'
import { CalendarEventModal } from '../components/calendar/CalendarEventModal'
import { DayAgenda } from '../components/calendar/DayAgenda'
import { MonthGrid } from '../components/calendar/MonthGrid'
import { WeekColumns } from '../components/calendar/WeekColumns'
import { EditTaskModal } from '../components/tasks/EditTaskModal'
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
import { createTask, updateTask, deleteTask } from '../lib/tasksApi'
import type { CalendarEvent } from '../types/calendar'
import type { CalendarViewMode } from '../types/calendar'
import type { Task, TaskPriority } from '../types/task'

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

  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const invalidateCalendar = () => {
    queryClient.invalidateQueries({ queryKey: ['calendar'] })
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }

  // Event Mutations
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

  // Task Mutations
  const createTaskMut = useMutation({
    mutationFn: (body: Parameters<typeof createTask>[0]) => createTask(body),
    onSuccess: () => {
      invalidateCalendar()
      setModal((m) => ({ ...m, open: false }))
    },
  })
  const updateTaskMut = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof updateTask>[1] }) =>
      updateTask(id, patch),
    onSuccess: () => {
      invalidateCalendar()
      setEditingTask(null)
    },
  })
  const deleteTaskMut = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      invalidateCalendar()
      setEditingTask(null)
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

  const busy = createMut.isPending || updateMut.isPending || deleteMut.isPending || createTaskMut.isPending

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Calendar</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Tasks with due dates and events stay in sync.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['month', 'week', 'day'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize ${
                  view === v
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                } transition-colors`}
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
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
              aria-label="Previous"
            >
              ←
            </button>
            <button
              type="button"
              onClick={navToday}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={navNext}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
              aria-label="Next"
            >
              →
            </button>
            <h2 className="ml-3 text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">{title}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={includeCompleted}
                onChange={(e) => setIncludeCompleted(e.target.checked)}
                className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
              />
              Show completed
            </label>
            <button
              type="button"
              onClick={() => openCreateForDay(newEventDefaultDay())}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 transition-colors active:scale-95"
            >
              + Create
            </button>
          </div>
        </div>

        {errMsg && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
            {errMsg}
          </div>
        )}

        {isLoading ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700/50">
            <p className="text-center text-sm font-medium text-slate-500 animate-pulse">Loading calendar…</p>
          </div>
        ) : view === 'month' ? (
          <MonthGrid
            anchor={anchor}
            tasks={tasks}
            events={events}
            onSelectDay={openCreateForDay}
            onEditEvent={openEditEvent}
            onEditTask={setEditingTask}
          />
        ) : view === 'week' ? (
          <WeekColumns
            anchor={anchor}
            tasks={tasks}
            events={events}
            onSelectDay={openCreateForDay}
            onEditEvent={openEditEvent}
            onEditTask={setEditingTask}
          />
        ) : (
          <DayAgenda 
            day={anchor} 
            tasks={tasks} 
            events={events} 
            onEditEvent={openEditEvent} 
            onEditTask={setEditingTask} 
          />
        )}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-violet-500"></span> Tasks
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Events
          </span>
        </div>
      </div>

      {modal.open && (
        <CalendarEventModal
          key={`${modal.mode}-${modal.event?.id ?? 'new'}-${modal.day.getTime()}`}
          mode={modal.mode}
          anchorDay={modal.day}
          event={modal.event}
          onClose={() => setModal((m) => ({ ...m, open: false }))}
          onCreateEvent={async (body) => {
            await createMut.mutateAsync(body)
          }}
          onCreateTask={async (body) => {
            await createTaskMut.mutateAsync({ ...body, listId: null }) // Create in inbox by default
          }}
          onUpdateEvent={async (id, body) => {
            await updateMut.mutateAsync({ id, body })
          }}
          onDeleteEvent={async (id) => {
            await deleteMut.mutateAsync(id)
          }}
          busy={busy}
        />
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onCancel={() => setEditingTask(null)}
          onSave={async (patch) => {
            await updateTaskMut.mutateAsync({ id: editingTask.id, patch })
          }}
          onDelete={async () => {
            if (confirm('Delete this task?')) {
              await deleteTaskMut.mutateAsync(editingTask.id)
            }
          }}
          isPending={updateTaskMut.isPending || deleteTaskMut.isPending}
        />
      )}
    </div>
  )
}