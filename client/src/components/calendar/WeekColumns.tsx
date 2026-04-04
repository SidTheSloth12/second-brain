import { Link } from 'react-router-dom'
import type { CalendarEvent } from '../../types/calendar'
import type { Task } from '../../types/task'
import { getWeekDays, isSameDay, itemsForDay, startOfDay } from '../../lib/calendarTime'

type Props = {
  anchor: Date
  tasks: Task[]
  events: CalendarEvent[]
  onSelectDay: (day: Date) => void
  onEditEvent: (event: CalendarEvent) => void
}

export function WeekColumns({ anchor, tasks, events, onSelectDay, onEditEvent }: Props) {
  const days = getWeekDays(anchor)

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
      {days.map((day) => {
        const items = itemsForDay(day, tasks, events)
        const isToday = isSameDay(day, startOfDay(new Date()))

        return (
          <div
            key={day.toISOString()}
            className={`flex min-h-[200px] flex-col rounded-xl border shadow-sm ${
              isToday ? 'border-violet-300 bg-violet-50/30' : 'border-slate-200 bg-white'
            }`}
          >
            <button
              type="button"
              onClick={() => onSelectDay(day)}
              className="border-b border-slate-100 px-2 py-2 text-left hover:bg-slate-50"
            >
              <div className="text-xs font-medium text-slate-500">
                {day.toLocaleDateString(undefined, { weekday: 'short' })}
              </div>
              <div className={`text-lg font-semibold ${isToday ? 'text-violet-700' : 'text-slate-900'}`}>
                {day.getDate()}
              </div>
            </button>
            <ul className="flex-1 space-y-1 p-2">
              {items.length === 0 && (
                <li className="text-xs text-slate-400">Nothing scheduled</li>
              )}
              {items.map((item) =>
                item.kind === 'task' ? (
                  <li key={`t-${item.task.id}`}>
                    <Link
                      to="/tasks"
                      className="block rounded-md border border-violet-100 bg-violet-50 px-2 py-1 text-xs text-violet-900 hover:bg-violet-100"
                    >
                      <span className="font-medium">Task</span>
                      <span className="mt-0.5 block truncate">{item.task.title}</span>
                      <span className="text-[10px] text-violet-700">
                        {new Date(item.task.dueAt!).toLocaleTimeString(undefined, {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </Link>
                  </li>
                ) : (
                  <li key={`e-${item.event.id}`}>
                    <button
                      type="button"
                      onClick={() => onEditEvent(item.event)}
                      className="w-full rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1 text-left text-xs text-emerald-900 hover:bg-emerald-100"
                    >
                      <span className="font-medium">Event</span>
                      <span className="mt-0.5 block truncate">{item.event.title}</span>
                      {!item.event.allDay && (
                        <span className="text-[10px] text-emerald-800">
                          {new Date(item.event.startsAt).toLocaleTimeString(undefined, {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                      {item.event.allDay && (
                        <span className="text-[10px] text-emerald-800">All day</span>
                      )}
                    </button>
                  </li>
                )
              )}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
