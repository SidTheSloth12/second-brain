import { useQuery, useMutation, useQueryClient } from'@tanstack/react-query'
import { useState, useMemo } from'react'
import { fetchHabits, createHabit, deleteHabit, toggleHabitLog, type Habit } from'../lib/habitsApi'
import { motion, AnimatePresence } from'framer-motion'
import { Trash2, Check, Plus, Flame, Calendar, Info } from'lucide-react'
function getLastNDays(n: number) {
  const days=[]
  const today=new Date()
  today.setHours(0, 0, 0, 0)
  for (let i=n-1; i>=0; i--) {
    const d=new Date(today)
    d.setDate(today.getDate()-i)
    days.push(d)
  }
  return days
}
function toLocalDateString(d: Date) {
  const pad=(n: number)=>String(n).padStart(2,'0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function calculateStreak(habit: Habit, today: Date): number {
  if (!habit.logs||habit.logs.length===0) return 0
  const completedDates=new Set(
    habit.logs
      .filter((l)=>l.completed)
      .map((l)=>new Date(l.date).toISOString().slice(0, 10))
  )
  let streak=0
  const d=new Date(today)
  d.setHours(0, 0, 0, 0)
  const todayStr=toLocalDateString(d)
  if (completedDates.has(todayStr)) {
    streak++
  }
  d.setDate(d.getDate()-1)
  for (let i = 0; i < habit.logs.length + 1; i++) {
    const dateStr=toLocalDateString(d)
    if (completedDates.has(dateStr)) {
      streak++
      d.setDate(d.getDate()-1)
    } else {
      break
    }
  }
  return streak
}
export function HabitsPage() {
  const queryClient=useQueryClient()
  const { data: habits=[], isLoading }=useQuery({
    queryKey: ['habits'],
    queryFn: fetchHabits,
  })
  const [newHabitName, setNewHabitName]=useState('')
  const createMut=useMutation({
    mutationFn: createHabit,
    onSuccess: ()=>{
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      setNewHabitName('')
    },
  })
  const deleteMut=useMutation({
    mutationFn: deleteHabit,
    onSuccess: ()=>{
      queryClient.invalidateQueries({ queryKey: ['habits'] })
    },
  })
  const toggleMut=useMutation({
    mutationFn: ({ id, date }: { id:string; date:string })=>toggleHabitLog(id, date),
    onSuccess: ()=>{
      queryClient.invalidateQueries({ queryKey: ['habits'] })
    },
  })
  const handleCreate=(e: React.FormEvent)=>{
    e.preventDefault()
    if (!newHabitName.trim()) return
    createMut.mutate({ name: newHabitName })
  }
  const handleToggle=(habitId:string, date: Date)=>{
    const today=new Date()
    today.setHours(23, 59, 59, 999)
    if (date>today) return
    const dateStr = toLocalDateString(date)
    toggleMut.mutate({ id: habitId, date: dateStr })
  }
  const last7Days=useMemo(()=>getLastNDays(7), [])
  const today=useMemo(()=>{
    const d=new Date()
    d.setHours(0,0,0,0)
    return d
  }, [])
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Habit Tracker
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Build consistency. Track your daily routines and maintain your streaks.
          </p>
        </div>
        <form onSubmit={handleCreate} className="flex w-full md:w-auto items-center gap-2 rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <input
            type="text"
            placeholder="New habit (e.g., Read 10 pages)"
            value={newHabitName}
            onChange={(e)=>setNewHabitName(e.target.value)}
            className="flex-1 bg-transparent px-3 py-1.5 text-sm outline-none text-slate-900 placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
            disabled={createMut.isPending}
          />
          <button
            type="submit"
            disabled={!newHabitName.trim()||createMut.isPending}
            className="flex h-8 items-center gap-1 rounded-lg bg-orange-500 px-3 text-xs font-semibold text-white shadow-sm transition-all hover:bg-orange-600 active:scale-95 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </form>
      </div>
      {createMut.isError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300">
          <strong>Failed to add habit.</strong> If you recently deployed the database update, please make sure your server's Prisma client is regenerated and restarted.
        </div>
      )}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <p className="animate-pulse text-sm font-medium text-slate-500">Loading your habits...</p>
        </div>
      ) : habits.length===0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
          <Calendar className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200">No habits yet</h3>
          <p className="mt-1 text-sm text-slate-500">Start building good routines by adding a habit above.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
                <th className="py-4 pl-6 pr-4 font-semibold text-slate-700 dark:text-slate-300 text-sm">Habit</th>
                <th className="py-4 px-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">Streak</th>
                {last7Days.map((day, i)=>(
                  <th key={i} className="py-4 px-2 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                        {day.toLocaleDateString(undefined, { weekday:'short' })}
                      </span>
                      <span className={`text-sm font-semibold ${day.getTime() === today.getTime() ? 'text-orange-500' : 'text-slate-700 dark:text-slate-300'}`}>
                        {day.getDate()}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="py-4 pl-4 pr-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              <AnimatePresence>
                {habits.map((habit)=>{
                  const streak=calculateStreak(habit, today)
                  return (
                    <motion.tr
                      key={habit.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
                    >
                      <td className="py-4 pl-6 pr-4">
                        <span className="font-medium text-slate-900 dark:text-slate-100">{habit.name}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                          <Flame className="h-3.5 w-3.5" />
                          {streak}
                        </div>
                      </td>
                      {last7Days.map((day, i)=>{
                        const isFuture=day>today
                        const dateStr=toLocalDateString(day)
                        const isCompleted=habit.logs?.some(
                          (l)=>l.completed&&new Date(l.date).toISOString().slice(0, 10)===dateStr
                        )
                        return (
                          <td key={i} className="py-4 px-2 text-center">
                            <button
                              type="button"
                              disabled={isFuture||toggleMut.isPending}
                              onClick={()=>handleToggle(habit.id, day)}
                              className={`group/btn relative inline-flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                                isFuture
                                  ? 'cursor-not-allowed opacity-30 bg-slate-100 dark:bg-slate-800'
                                  : isCompleted
                                  ? 'bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-500/30 ring-offset-1 dark:ring-offset-slate-950 scale-110'
                                  : 'bg-slate-100 text-transparent hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95'
                              }`}
                            >
                              <Check className={`h-4 w-4 ${isCompleted ? 'opacity-100' : 'opacity-0 group-hover/btn:text-slate-400 group-hover/btn:opacity-50'}`} strokeWidth={3}/>
                            </button>
                          </td>
                        )
                      })}
                      <td className="py-4 pl-4 pr-6 text-right">
                        <button
                          type="button"
                          onClick={()=>{
                            if (confirm(`Delete habit "${habit.name}" and all its logs?`)) {
                              deleteMut.mutate(habit.id)
                            }
                          }}
                          className="rounded-lg p-2 text-slate-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                          title="Delete habit"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-8 flex items-start gap-3 rounded-xl bg-blue-50/50 p-4 text-sm text-blue-800 dark:bg-blue-900/10 dark:text-blue-300">
        <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
        <p>
          <strong>How streaks work:</strong>Your streak increments for every consecutive day you complete the habit.
          If you miss a day, the streak resets to zero. Keep the flame alive!
        </p>
      </div>
    </div>
  )
}
