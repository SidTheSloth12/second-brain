import { useQuery } from'@tanstack/react-query'
import { useMemo } from'react'
import { Link } from'react-router-dom'
import { fetchCalendarRange } from'../lib/calendarApi'
import { fetchNotes } from'../lib/notesApi'
import { fetchTasks } from'../lib/tasksApi'
import { CalendarDays, FileText, CheckSquare } from'lucide-react'
import { motion } from'framer-motion'
export function Dashboard() {
  const { rangeStart, rangeEnd }=useMemo(()=>{
    const now=new Date()
    now.setHours(0, 0, 0, 0)
    const nextWeek=new Date(now)
    nextWeek.setDate(now.getDate()+7)
    return { rangeStart: now, rangeEnd: nextWeek }
  }, [])
  const { data: calendarData }=useQuery({
    queryKey: ['calendar-range', rangeStart.toISOString(), rangeEnd.toISOString()],
    queryFn: ()=>fetchCalendarRange(rangeStart, rangeEnd),
  })
  const { data: notes=[] }=useQuery({
    queryKey: ['notes'],
    queryFn: fetchNotes,
  })
  const { data: tasksData }=useQuery({
    queryKey: ['tasks','open'],
    queryFn: ()=>fetchTasks('open'),
  })
  const tasks=tasksData?.tasks ?? []
  const upcomingEvents=calendarData?.events ?? []
  const lastNote=notes[0]
  const priorityCounts=tasks.reduce(
    (counts, task)=>{
      if (task.priority==='high') counts.high+=1
      else if (task.priority==='medium') counts.medium+=1
      else if (task.priority==='low') counts.low+=1
      else counts.low+=1
      return counts
    },
    { high: 0, medium: 0, low: 0, other: 0 }
  )
  const cardVariants={
    hidden: { opacity: 0, y: 20 },
    visible: (i: number)=>({
      opacity: 1,
      y: 0,
      transition: { delay: i*0.1, duration: 0.4 },
    }),
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {}
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/50 backdrop-blur-sm transition-colors hover:border-violet-200 dark:hover:border-violet-500/30 flex flex-col h-full"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
            <CalendarDays className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Upcoming Events</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Next 7 days ({upcomingEvents.length})</p>
          </div>
        </div>
        <div className="mt-6 flex-1 flex flex-col space-y-3">
          {upcomingEvents.length===0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 flex-1">No events scheduled for the coming week.</p>
          ) : (
            <div className="space-y-3 flex-1">
              {upcomingEvents.slice(0, 5).map((event)=>(
                <div key={event.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-700/50 dark:bg-slate-800/50 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
                  <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{event.title}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {new Date(event.startsAt).toLocaleString(undefined, {
                      weekday:'short',
                      month:'short',
                      day:'numeric',
                      hour:'numeric',
                      minute:'2-digit',
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
          {upcomingEvents.length>5&&(
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center pt-2">And {upcomingEvents.length-5} more event(s).</p>
          )}
          <Link
            to="/calendar"
            className="mt-auto pt-4 inline-flex items-center text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
          >
            View calendar<span className="ml-1 text-lg leading-none">→</span>
          </Link>
        </div>
      </motion.div>
      {}
      <motion.div
        custom={1}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/50 backdrop-blur-sm transition-colors hover:border-violet-200 dark:hover:border-violet-500/30 flex flex-col h-full"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
            <FileText className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Last Opened Note</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Most recent</p>
          </div>
        </div>
        <div className="mt-6 flex-1 flex flex-col">
          {lastNote ? (
            <div className="flex-1 flex flex-col items-start">
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-700/50 dark:bg-slate-800/50 w-full mb-4 group hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                <Link to={`/notes/${lastNote.id}`} className="block">
                  <p className="text-lg font-medium text-slate-900 dark:text-slate-100 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{lastNote.title}</p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Edited {new Date(lastNote.updatedAt).toLocaleDateString()}</p>
                </Link>
              </div>
              <Link
                to={`/notes/${lastNote.id}`}
                className="mt-auto inline-flex items-center text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
              >
                Open note<span className="ml-1 text-lg leading-none">→</span>
              </Link>
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 flex-1">No notes yet</p>
          )}
        </div>
      </motion.div>
      {}
      <motion.div
        custom={2}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/50 backdrop-blur-sm transition-colors hover:border-violet-200 dark:hover:border-violet-500/30 flex flex-col h-full"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
            <CheckSquare className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Tasks by priority</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Open tasks in your lists</p>
          </div>
        </div>
        <div className="mt-6 flex-1 flex flex-col space-y-3">
          <div className="grid grid-cols-2 gap-3 flex-1">
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-700/50 dark:bg-slate-800/50 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col justify-center items-center">
              <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">High</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{priorityCounts.high}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-700/50 dark:bg-slate-800/50 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col justify-center items-center">
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">Medium</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{priorityCounts.medium}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-700/50 dark:bg-slate-800/50 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col justify-center items-center">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Low</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{priorityCounts.low}</p>
            </div>
            {priorityCounts.other>0&&(
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-700/50 dark:bg-slate-800/50 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col justify-center items-center">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Other</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{priorityCounts.other}</p>
              </div>
            )}
          </div>
          <Link
            to="/tasks"
            className="mt-auto pt-4 inline-flex items-center text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
          >
            View tasks<span className="ml-1 text-lg leading-none">→</span>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}