import { Link } from 'react-router-dom'
import type { CalendarEvent } from '../../types/calendar'
import type { Task } from '../../types/task'
import { itemsForDay, startOfDay } from '../../lib/calendarTime'

type Props = {
  day: Date
  tasks: Task[]
  events: CalendarEvent[]
  onEditEvent: (event: CalendarEvent) => void
}

export function DayAgenda({ day, tasks, events, onEditEvent }: Props) {
  const items = itemsForDay(startOfDay(day), tasks, events)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {startOfDay(day).toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}
      </h3>
      <ul className="mt-4 space-y-2">
        {items.length === 0 && <li className="text-sm text-slate-500">Nothing on this day.</li>}
        {items.map((item) =>
          item.kind === 'task' ? (
            <li key={`t-${item.task.id}`}>
              <Link
                to="/tasks"
                className="flex flex-col rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 hover:bg-violet-100 dark:border-violet-800/30 dark:bg-violet-900/20 dark:hover:bg-violet-900/40"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-400">Task</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{item.task.title}</span>
                {item.task.description && (
                  <span className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.task.description}</span>
                )}
                <span className="mt-2 text-xs text-violet-800 dark:text-violet-300">
                  Due {new Date(item.task.dueAt!).toLocaleString(undefined, { timeStyle: 'short', dateStyle: 'medium' })}
                </span>
              </Link>
            </li>
          ) : (
            <li key={`e-${item.event.id}`}>
              <button
                type="button"
                onClick={() => onEditEvent(item.event)}
                className="flex w-full flex-col rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-left hover:bg-emerald-100 dark:border-emerald-800/30 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Event</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{item.event.title}</span>
                {item.event.description && (
                  <span className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.event.description}</span>
                )}
                <span className="mt-2 text-xs text-emerald-900 dark:text-emerald-300">
                  {item.event.allDay
                    ? 'All day'
                    : `${new Date(item.event.startsAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} – ${new Date(item.event.endsAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`}
                </span>
              </button>
            </li>
          )
        )}
      </ul>
    </div>
  )
}
