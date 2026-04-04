import { Link } from 'react-router-dom'
import type { CalendarEvent } from '../../types/calendar'
import type { Task } from '../../types/task'
import { eventOverlapsDay, getMonthGridDates, isSameDay, startOfDay } from '../../lib/calendarTime'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function cellItems(day: Date, tasks: Task[], events: CalendarEvent[]) {
  const out: { type: 'task' | 'event'; id: string; label: string }[] = []
  for (const task of tasks) {
    if (!task.dueAt) continue
    if (!isSameDay(new Date(task.dueAt), day)) continue
    out.push({ type: 'task', id: task.id, label: task.title })
  }
  for (const event of events) {
    if (!eventOverlapsDay(event.startsAt, event.endsAt, day)) continue
    out.push({ type: 'event', id: event.id, label: event.title })
  }
  return out.slice(0, 4)
}

type Props = {
  anchor: Date
  tasks: Task[]
  events: CalendarEvent[]
  onSelectDay: (day: Date) => void
  onEditEvent: (event: CalendarEvent) => void
}

export function MonthGrid({ anchor, tasks, events, onSelectDay, onEditEvent }: Props) {
  const grid = getMonthGridDates(anchor)
  const month = anchor.getMonth()

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-medium text-slate-500">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-1 py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {grid.map((day) => {
          const inMonth = day.getMonth() === month
          const items = cellItems(day, tasks, events)
          const isToday = isSameDay(day, new Date())

          return (
            <div
              key={day.toISOString()}
              role="button"
              tabIndex={0}
              onClick={() => onSelectDay(startOfDay(day))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelectDay(startOfDay(day))
                }
              }}
              className={`min-h-[88px] cursor-pointer border-b border-r border-slate-100 p-1 text-left align-top transition-colors hover:bg-violet-50/50 sm:min-h-[100px] ${
                !inMonth ? 'bg-slate-50/80 text-slate-400' : 'bg-white'
              } ${isToday ? 'ring-1 ring-inset ring-violet-400' : ''}`}
            >
              <span className={`text-xs font-medium ${isToday ? 'text-violet-700' : ''}`}>
                {day.getDate()}
              </span>
              <ul className="mt-1 space-y-0.5">
                {items.map((item) =>
                  item.type === 'task' ? (
                    <li key={`t-${item.id}`}>
                      <Link
                        to="/tasks"
                        onClick={(e) => e.stopPropagation()}
                        className="block truncate rounded px-0.5 text-[10px] text-violet-800 hover:bg-violet-100 sm:text-xs"
                        title={item.label}
                      >
                        · {item.label}
                      </Link>
                    </li>
                  ) : (
                    <li key={`e-${item.id}`}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          const ev = events.find((x) => x.id === item.id)
                          if (ev) onEditEvent(ev)
                        }}
                        className="w-full truncate rounded px-0.5 text-left text-[10px] text-emerald-800 hover:bg-emerald-100 sm:text-xs"
                        title={item.label}
                      >
                        ◆ {item.label}
                      </button>
                    </li>
                  )
                )}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
