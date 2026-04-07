import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { fetchCalendarRange } from '../lib/calendarApi'
import { fetchNotes } from '../lib/notesApi'
import { fetchTasks } from '../lib/tasksApi'
import { CalendarDays, FileText, CheckSquare } from 'lucide-react'

export function Dashboard() {
  // Stabilise query keys — compute once per mount, not every render
  const { rangeStart, rangeEnd } = useMemo(() => {
    const now = new Date()
    // Truncate to the start of the current day so the key is stable within a session
    now.setHours(0, 0, 0, 0)
    const nextWeek = new Date(now)
    nextWeek.setDate(now.getDate() + 7)
    return { rangeStart: now, rangeEnd: nextWeek }
  }, [])

  const { data: calendarData } = useQuery({
    queryKey: ['calendar-range', rangeStart.toISOString(), rangeEnd.toISOString()],
    queryFn: () => fetchCalendarRange(rangeStart, rangeEnd),
  })

  const { data: notes = [] } = useQuery({
    queryKey: ['notes'],
    queryFn: fetchNotes,
  })

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', 'open'],
    queryFn: () => fetchTasks('open'),
  })

  const upcomingEvents = calendarData?.events ?? []
  const lastNote = notes[0]
  const priorityCounts = tasks.reduce(
    (counts, task) => {
      if (task.priority === 'high') counts.high += 1
      else if (task.priority === 'medium') counts.medium += 1
      else if (task.priority === 'low') counts.low += 1
      else counts.other += 1
      return counts
    },
    { high: 0, medium: 0, low: 0, other: 0 }
  )

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Upcoming Events */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/95">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-8 w-8 text-violet-600 dark:text-violet-400" />
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Upcoming Events</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Next 7 days ({upcomingEvents.length})</p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No events scheduled for the coming week.</p>
          ) : (
            upcomingEvents.slice(0, 5).map((event) => (
              <div key={event.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-600 dark:bg-slate-800">
                <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{event.title}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {new Date(event.startsAt).toLocaleString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            ))
          )}
          {upcomingEvents.length > 5 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">And {upcomingEvents.length - 5} more event(s).</p>
          )}
          <Link
            to="/calendar"
            className="mt-2 inline-flex text-sm text-violet-600 hover:underline dark:text-violet-400"
          >
            View calendar →
          </Link>
        </div>
      </div>

      {/* Last Note */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/95">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-violet-600 dark:text-violet-400" />
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Last Opened Note</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Most recent</p>
          </div>
        </div>
        <div className="mt-4">
          {lastNote ? (
            <>
              <p className="text-lg font-medium text-slate-900 dark:text-slate-100 truncate">{lastNote.title}</p>
              <Link
                to={`/notes/${lastNote.id}`}
                className="mt-2 inline-flex text-sm text-violet-600 hover:underline dark:text-violet-400"
              >
                Open note →
              </Link>
            </>
          ) : (
            <p className="text-slate-500 dark:text-slate-400">No notes yet</p>
          )}
        </div>
      </div>

      {/* Tasks by Priority */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/95">
        <div className="flex items-center gap-3">
          <CheckSquare className="h-8 w-8 text-violet-600 dark:text-violet-400" />
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Tasks by priority</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Open tasks in your lists</p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-600 dark:bg-slate-800">
            <p className="text-sm text-slate-700 dark:text-slate-300">High</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{priorityCounts.high}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-600 dark:bg-slate-800">
            <p className="text-sm text-slate-700 dark:text-slate-300">Medium</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{priorityCounts.medium}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-600 dark:bg-slate-800">
            <p className="text-sm text-slate-700 dark:text-slate-300">Low</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{priorityCounts.low}</p>
          </div>
          {priorityCounts.other > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-600 dark:bg-slate-800">
              <p className="text-sm text-slate-700 dark:text-slate-300">Other</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{priorityCounts.other}</p>
            </div>
          )}
          <Link
            to="/tasks"
            className="mt-2 inline-flex text-sm text-violet-600 hover:underline dark:text-violet-400"
          >
            View tasks →
          </Link>
        </div>
      </div>
    </div>
  )
}