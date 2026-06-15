import { useState } from 'react'
import type { CalendarEvent } from '../../types/calendar'
import type { TaskPriority } from '../../types/task'
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
  onCreateEvent: (body: {
    title: string
    description: string | null
    startsAt: string
    endsAt: string
    allDay: boolean
  }) => Promise<void>
  onCreateTask: (body: {
    title: string
    description: string | null
    dueAt: string | null
    priority: TaskPriority
  }) => Promise<void>
  onUpdateEvent: (
    id: string,
    body: Partial<{
      title: string
      description: string | null
      startsAt: string
      endsAt: string
      allDay: boolean
    }>
  ) => Promise<void>
  onDeleteEvent: (id: string) => Promise<void>
  busy: boolean
}

export function CalendarEventModal({
  mode,
  anchorDay,
  event,
  onClose,
  onCreateEvent,
  onCreateTask,
  onUpdateEvent,
  onDeleteEvent,
  busy,
}: Props) {
  const [type, setType] = useState<'event' | 'task'>('event')
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
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium')
  const [taskDue, setTaskDue] = useState(() => {
    const { start } = defaultSlot(startOfDay(anchorDay))
    return toDatetimeLocalValue(start)
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    if (type === 'task' && mode === 'create') {
      await onCreateTask({
        title: title.trim(),
        description: description.trim() || null,
        dueAt: taskDue ? new Date(taskDue).toISOString() : null,
        priority: taskPriority
      })
      return
    }

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
      await onCreateEvent({
        title: title.trim(),
        description: description.trim() || null,
        startsAt,
        endsAt,
        allDay,
      })
    } else if (event) {
      await onUpdateEvent(event.id, {
        title: title.trim(),
        description: description.trim() || null,
        startsAt,
        endsAt,
        allDay,
      })
    }
  }

  const inputCls = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-4 sm:items-center backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cal-event-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-950 dark:border dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="cal-event-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {mode === 'create' ? 'Create new...' : 'Edit event'}
          </h2>
          {mode === 'create' && (
            <div className="flex bg-slate-100 p-1 rounded-lg dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setType('event')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${type === 'event' ? 'bg-white shadow-sm text-slate-900 dark:bg-slate-700 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
              >
                Event
              </button>
              <button
                type="button"
                onClick={() => setType('task')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${type === 'task' ? 'bg-white shadow-sm text-slate-900 dark:bg-slate-700 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
              >
                Task
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="ev-title" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
              Title
            </label>
            <input
              id="ev-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
              required
            />
          </div>

          {type === 'event' && (
            <>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
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
                    <label htmlFor="ev-start" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Starts
                    </label>
                    <input
                      id="ev-start"
                      type="datetime-local"
                      value={startLocal}
                      onChange={(e) => setStartLocal(e.target.value)}
                      className={inputCls}
                      required={!allDay}
                    />
                  </div>
                  <div>
                    <label htmlFor="ev-end" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Ends
                    </label>
                    <input
                      id="ev-end"
                      type="datetime-local"
                      value={endLocal}
                      onChange={(e) => setEndLocal(e.target.value)}
                      className={inputCls}
                      required={!allDay}
                    />
                  </div>
                </div>
              )}

              {allDay && (
                <div>
                  <label htmlFor="ev-day" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
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
                    className={inputCls}
                  />
                </div>
              )}
            </>
          )}

          {type === 'task' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="task-due" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Due Date
                </label>
                <input
                  id="task-due"
                  type="datetime-local"
                  value={taskDue}
                  onChange={(e) => setTaskDue(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="task-priority" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Priority
                </label>
                <select
                  id="task-priority"
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                  className={inputCls}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="ev-desc" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
              Description
            </label>
            <textarea
              id="ev-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={inputCls}
            />
          </div>

          <div className="flex flex-wrap justify-between gap-2 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
            {mode === 'edit' && event && (
              <button
                type="button"
                onClick={async () => {
                  if (confirm('Delete this event?')) await onDeleteEvent(event.id)
                }}
                disabled={busy}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
              >
                Delete
              </button>
            )}
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy || !title.trim()}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {busy ? 'Saving…' : mode === 'create' ? 'Create' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}